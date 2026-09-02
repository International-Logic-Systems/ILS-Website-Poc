import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import {
  chunkDocument,
  dedupeChunks,
  estimateTokens,
  splitParagraphs,
  splitSentences,
} from '../scripts/lib/chunk.mjs';
import {
  decodeEntities,
  extractMain,
  extractTitle,
  fragmentToText,
  markdownToText,
  normalizeWhitespace,
  splitByHeadings,
  stripFrontmatter,
} from '../scripts/lib/text.mjs';
import { routeFromFile } from '../scripts/lib/sources.mjs';

describe('decodeEntities', () => {
  test('decodes the named entities React emits', () => {
    assert.equal(decodeEntities('Fairfax &amp; Virginia'), 'Fairfax & Virginia');
    assert.equal(decodeEntities('a &middot; b &mdash; c'), 'a · b — c');
  });

  test('decodes decimal and hexadecimal references', () => {
    assert.equal(decodeEntities('&#8212;'), '—');
    assert.equal(decodeEntities('&#x2014;'), '—');
  });

  test('leaves an unknown entity alone rather than dropping it', () => {
    assert.equal(decodeEntities('&notanentity;'), '&notanentity;');
  });
});

describe('normalizeWhitespace', () => {
  test('collapses runs but keeps paragraph breaks', () => {
    assert.equal(normalizeWhitespace('a   b\n\n\n\nc'), 'a b\n\nc');
  });

  test('treats a non-breaking space as a space', () => {
    assert.equal(normalizeWhitespace('a  b'), 'a b');
  });
});

describe('stripFrontmatter', () => {
  test('parses flat keys and returns the body', () => {
    const { data, body } = stripFrontmatter('---\ntitle: Careers\npath: /careers\n---\n# Roles\n');
    assert.deepEqual(data, { title: 'Careers', path: '/careers' });
    assert.equal(body.trim(), '# Roles');
  });

  test('unwraps quoted values', () => {
    const { data } = stripFrontmatter('---\ntitle: "Contract Vehicles"\n---\nbody');
    assert.equal(data.title, 'Contract Vehicles');
  });

  test('passes a file through untouched when there is no frontmatter', () => {
    const { data, body } = stripFrontmatter('# Just a heading');
    assert.deepEqual(data, {});
    assert.equal(body, '# Just a heading');
  });
});

describe('markdownToText', () => {
  test('keeps link text and drops the URL', () => {
    assert.equal(markdownToText('See [our vehicles](/contract-vehicles).'), 'See our vehicles.');
  });

  test('drops editor guidance held in HTML comments', () => {
    // The starter files in knowledge/ carry their instructions this way. If a
    // comment survived, the assistant could recite a note meant for an editor.
    const text = markdownToText('## Company size\n\n<!-- do not guess headcount -->\n\nConfirmed copy.');
    assert.equal(text.includes('do not guess'), false);
    assert.equal(text.includes('Confirmed copy.'), true);
  });

  test('strips emphasis, fences and JSX', () => {
    assert.equal(markdownToText('**bold** and `code`'), 'bold and code');
    assert.equal(markdownToText('a\n\n```js\nconst x = 1\n```\n\nb'), 'a\n\nb');
    assert.equal(markdownToText('<Callout tone="warn" />text'), 'text');
  });
});

describe('extractMain', () => {
  const page = `<html><head><title>About — International Logic Systems</title></head>
    <body><header>Capabilities Careers Contact</header>
    <main id="main"><h1>About</h1><p>Founded 1998.</p></main>
    <footer>inquiries@intllogic.com</footer></body></html>`;

  test('returns only the main element', () => {
    const main = extractMain(page);
    assert.equal(main.includes('Founded 1998.'), true);
  });

  test('excludes the repeated header and footer chrome', () => {
    // Chrome appears on all thirteen pages. Leaving it in would put the same
    // nav labels in every chunk and flatten every retrieval score.
    const main = extractMain(page);
    assert.equal(main.includes('Careers Contact'), false);
    assert.equal(main.includes('inquiries@intllogic.com'), false);
  });

  test('drops script and style content', () => {
    const main = extractMain('<main><script>var a=1</script><style>b{}</style><p>kept</p></main>');
    assert.equal(main.includes('var a=1'), false);
    assert.equal(main.includes('b{}'), false);
    assert.equal(main.includes('kept'), true);
  });

  test('returns null when there is no main element', () => {
    assert.equal(extractMain('<html><body><p>nothing</p></body></html>'), null);
  });
});

describe('extractTitle', () => {
  test('drops the site-wide suffix the layout appends', () => {
    assert.equal(extractTitle('<title>Careers — International Logic Systems</title>'), 'Careers');
  });

  test('keeps a title that does not carry the suffix', () => {
    assert.equal(extractTitle('<title>Cyber security capability</title>'), 'Cyber security capability');
  });

  test('returns null when there is no title', () => {
    assert.equal(extractTitle('<html></html>'), null);
  });
});

describe('fragmentToText', () => {
  test('renders a definition list as label and value', () => {
    // The registration table is a <dl>. "UEI to be supplied" on two lines
    // would separate the label from its value and retrieve badly.
    const text = fragmentToText('<dl><dt>UEI</dt><dd>to be supplied</dd></dl>');
    assert.equal(text, 'UEI: to be supplied');
  });

  test('separates table cells so a row stays one line', () => {
    const text = fragmentToText('<tr><td>eFAST</td><td>Active</td></tr>');
    assert.equal(text, 'eFAST · Active');
  });

  test('marks list items', () => {
    assert.equal(fragmentToText('<ul><li>one</li><li>two</li></ul>'), '• one\n• two');
  });
});

describe('splitByHeadings', () => {
  test('splits a fragment into heading-delimited sections', () => {
    const sections = splitByHeadings(
      '<p>intro</p><h2>Vehicles</h2><p>eFAST</p><h2>Contact</h2><p>email</p>',
    );
    assert.deepEqual(
      sections.map((section) => [section.heading, section.text]),
      [
        [null, 'intro'],
        ['Vehicles', 'eFAST'],
        ['Contact', 'email'],
      ],
    );
  });

  test('records the heading level', () => {
    const [section] = splitByHeadings('<h3>Deep</h3><p>body</p>').filter((s) => s.heading);
    assert.equal(section.level, 3);
  });
});

describe('estimateTokens', () => {
  test('is zero for empty input', () => {
    assert.equal(estimateTokens(''), 0);
  });

  test('over-estimates rather than under-estimates', () => {
    // Chunks must stay under the budget, so the estimate is deliberately high.
    const text = 'The quick brown fox jumps over the lazy dog. '.repeat(10);
    assert.ok(estimateTokens(text) >= text.split(/\s+/).filter(Boolean).length);
  });

  test('grows with length', () => {
    assert.ok(estimateTokens('a '.repeat(200)) > estimateTokens('a '.repeat(20)));
  });
});

describe('splitParagraphs / splitSentences', () => {
  test('splits on blank lines and drops empties', () => {
    assert.deepEqual(splitParagraphs('one\n\n\ntwo\n\n  \n\nthree'), ['one', 'two', 'three']);
  });

  test('keeps the terminator with its sentence', () => {
    assert.deepEqual(splitSentences('First one. Second one.'), ['First one.', 'Second one.']);
  });
});

describe('chunkDocument', () => {
  const doc = (sections) => ({ source: 'facts', title: 'T', path: '/p', sections });

  test('attaches the source page title and path to every chunk', () => {
    // This is what the assistant cites, so it has to survive chunking.
    const chunks = chunkDocument(doc([{ heading: 'H', text: 'word '.repeat(200) }]));
    assert.ok(chunks.length > 0);
    for (const chunk of chunks) {
      assert.equal(chunk.title, 'T');
      assert.equal(chunk.path, '/p');
      assert.equal(chunk.source, 'facts');
    }
  });

  test('holds chunks to the token budget', () => {
    const chunks = chunkDocument(doc([{ heading: 'H', text: 'word '.repeat(2000) }]), {
      maxTokens: 200,
    });
    assert.ok(chunks.length > 1);
    for (const chunk of chunks) assert.ok(chunk.tokens <= 200, `${chunk.tokens} exceeds 200`);
  });

  test('splits a long section on paragraph boundaries', () => {
    const paragraphs = ['alpha', 'bravo', 'charlie'].map((word) => `${word} `.repeat(60).trim());
    const chunks = chunkDocument(doc([{ heading: 'H', text: paragraphs.join('\n\n') }]), {
      maxTokens: 120,
      minTokens: 10,
    });
    // No chunk should mix two paragraphs' filler words at a broken boundary.
    for (const chunk of chunks) assert.equal(/\balpha bravo\b|\bbravo charlie\b/.test(chunk.text), false);
  });

  test('starts a new chunk at a heading once the current one can stand alone', () => {
    const chunks = chunkDocument(
      doc([
        { heading: 'One', text: 'alpha '.repeat(80).trim() },
        { heading: 'Two', text: 'bravo '.repeat(80).trim() },
      ]),
      { maxTokens: 500, minTokens: 20 },
    );
    assert.equal(chunks.length, 2);
    assert.equal(chunks[0].heading, 'One');
    assert.equal(chunks[1].heading, 'Two');
  });

  test('folds a runt tail back into its neighbour', () => {
    // A one-line tail rarely carries enough words to score, and wastes a slot
    // in the top results if it does.
    const chunks = chunkDocument(
      doc([
        { heading: 'Body', text: 'alpha '.repeat(80).trim() },
        { heading: 'Tail', text: 'short tail' },
      ]),
      { maxTokens: 500, minTokens: 60 },
    );
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0].text.includes('short tail'), true);
    assert.deepEqual(chunks[0].headings, ['Body', 'Tail']);
  });

  test('names a heading the chunk crosses into', () => {
    // Headings are lifted out of the body when a page is split. A chunk that
    // spans two of them must name the second, or the two sections read as one
    // passage -- which is how one customer's engagement gets attributed to
    // another. Regression: the assistant reported USDA's cloud migration as
    // EXIM Bank's, because both cards packed into one chunk labelled "EXIM Bank".
    const [chunk] = chunkDocument(
      doc([
        { heading: 'EXIM Bank', text: 'Loan servicing replaced for trade finance officers.' },
        { heading: 'USDA', text: 'Applications migrated off end-of-life infrastructure.' },
      ]),
      // minTokens high enough that neither section can stand alone, which is
      // what forces them into one chunk and creates the hazard.
      { maxTokens: 500, minTokens: 200 },
    );
    assert.deepEqual(chunk.headings, ['EXIM Bank', 'USDA']);
    assert.match(chunk.text, /^USDA$/m);
    assert.ok(
      chunk.text.indexOf('USDA') < chunk.text.indexOf('end-of-life'),
      'the heading must precede the text it labels',
    );
  });

  test('does not repeat the leading heading, which is already the chunk label', () => {
    const [chunk] = chunkDocument(doc([{ heading: 'EXIM Bank', text: 'One engagement.' }]));
    assert.equal(chunk.text, 'One engagement.');
  });

  test('names the heading when a runt is folded across a boundary', () => {
    const [chunk] = chunkDocument(
      doc([
        { heading: 'Body', text: 'alpha '.repeat(80).trim() },
        { heading: 'Tail', text: 'short tail' },
      ]),
      { maxTokens: 500, minTokens: 60 },
    );
    assert.match(chunk.text, /^Tail$/m);
  });

  test('numbers chunk ids contiguously after merging', () => {
    const chunks = chunkDocument(
      doc([
        { heading: 'A', text: 'alpha '.repeat(200).trim() },
        { heading: 'B', text: 'tiny' },
        { heading: 'C', text: 'bravo '.repeat(200).trim() },
      ]),
      { maxTokens: 200, minTokens: 60 },
    );
    assert.deepEqual(
      chunks.map((chunk) => chunk.id),
      chunks.map((_, index) => `facts:/p#${index}`),
    );
  });

  test('produces nothing for a document with only headings', () => {
    // The starter files in knowledge/ are headings plus comments. They must
    // contribute no chunks until someone writes real content into them.
    assert.deepEqual(chunkDocument(doc([{ heading: 'Company size', text: '' }])), []);
  });

  test('produces nothing for an empty document', () => {
    assert.deepEqual(chunkDocument(doc([])), []);
  });
});

describe('dedupeChunks', () => {
  const chunk = (source, text) => ({ id: `${source}:x`, source, heading: null, text });

  test('keeps the more authoritative copy of a duplicated fact', () => {
    const text = 'ILS holds an eFAST Master Ordering Agreement under contract 693KA9-18-A-00102.';
    const kept = dedupeChunks([chunk('page', text), chunk('facts', text)]);
    assert.equal(kept.length, 1);
    assert.equal(kept[0].source, 'facts');
  });

  test('prefers curated over both other sources', () => {
    const text = 'ILS is a woman-owned small business founded in Fairfax, Virginia in 1998.';
    const kept = dedupeChunks([chunk('page', text), chunk('facts', text), chunk('curated', text)]);
    assert.equal(kept.length, 1);
    assert.equal(kept[0].source, 'curated');
  });

  test('keeps chunks that merely share vocabulary', () => {
    const kept = dedupeChunks([
      chunk('facts', 'The eFAST vehicle is held with the Federal Aviation Administration.'),
      chunk('facts', 'The CIO-SP3 Small Business vehicle is held with NITAAC at the NIH.'),
    ]);
    assert.equal(kept.length, 2);
  });
});

describe('routeFromFile', () => {
  test('maps a static export path to its route', () => {
    assert.equal(routeFromFile('out/about/index.html', 'out'), '/about');
    assert.equal(routeFromFile('out/index.html', 'out'), '/');
  });

  test('maps a prerender path to the same route', () => {
    // Both build shapes have to agree, or citations would differ by build mode.
    const base = '.next/server/app';
    assert.equal(routeFromFile(`${base}/about.html`, base), '/about');
    assert.equal(routeFromFile(`${base}/index.html`, base), '/');
    assert.equal(
      routeFromFile(`${base}/past-performance/exim-elms.html`, base),
      '/past-performance/exim-elms',
    );
  });
});
