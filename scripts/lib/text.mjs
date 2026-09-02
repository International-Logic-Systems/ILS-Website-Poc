/**
 * Text extraction for the knowledge builder.
 *
 * Everything here is pure and synchronous so the unit tests can exercise it
 * without touching the filesystem or a build output.
 */

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  mdash: '\u2014', ndash: '\u2013', middot: '\u00b7', hellip: '\u2026',
  lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201c', rdquo: '\u201d',
  times: '\u00d7', copy: '\u00a9', reg: '\u00ae', deg: '\u00b0',
};

/** Decodes the named and numeric entities React emits. */
export function decodeEntities(input) {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (whole, name) => NAMED_ENTITIES[name.toLowerCase()] ?? whole);
}

/** Collapses runs of whitespace, keeping paragraph breaks intact. */
export function normalizeWhitespace(input) {
  return input
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Removes YAML frontmatter from a markdown file, returning the parsed keys
 * alongside the body. Only the flat `key: value` form is supported, which is
 * all the curated files need.
 */
export function stripFrontmatter(markdown) {
  const match = /^\uFEFF?---\n([\s\S]*?)\n---\n?/.exec(markdown);
  if (!match) return { data: {}, body: markdown.replace(/^\uFEFF/, '') };

  const data = {};
  for (const line of match[1].split('\n')) {
    const pair = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line.trim());
    if (pair) data[pair[1]] = pair[2].replace(/^["']|["']$/g, '').trim();
  }
  return { data, body: markdown.slice(match[0].length) };
}

/**
 * Reduces markdown to the prose a retriever should match on: link text without
 * URLs, no emphasis markers, no code fences, no JSX/HTML tags.
 */
export function markdownToText(markdown) {
  return normalizeWhitespace(
    markdown
      .replace(/<!--[\s\S]*?-->/g, ' ')       // editor guidance never reaches the corpus
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/^import\s+.*$/gm, ' ')          // MDX import lines
      .replace(/<[A-Za-z][^>]*\/>/g, ' ')       // self-closing JSX
      .replace(/<\/?[A-Za-z][^>]*>/g, ' ')      // JSX / inline HTML tags
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')
      .replace(/^\s{0,3}>\s?/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '\u2022 ')
      .replace(/(\*\*|__|\*|_|`)/g, ''),
  );
}

const DROP_ELEMENTS = /<(script|style|noscript|svg|template)\b[^>]*>[\s\S]*?<\/\1>/gi;

/**
 * Pulls the `<main>` element out of a rendered page.
 *
 * Site chrome is deliberately excluded. The header and footer repeat verbatim
 * on all thirteen pages, so leaving them in would put the same nav labels and
 * contact block in every chunk and flatten the retrieval scores.
 */
export function extractMain(html) {
  const cleaned = html.replace(/<!--[\s\S]*?-->/g, ' ').replace(DROP_ELEMENTS, ' ');
  const open = /<main\b[^>]*>/i.exec(cleaned);
  if (!open) return null;
  const start = open.index + open[0].length;
  const end = cleaned.lastIndexOf('</main>');
  return end > start ? cleaned.slice(start, end) : cleaned.slice(start);
}

/** Reads the document title, minus the site-wide suffix the layout appends. */
export function extractTitle(html) {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!match) return null;
  return decodeEntities(match[1])
    .replace(/\s*[\u2014|]\s*International Logic Systems\s*$/i, '')
    .trim() || null;
}

/**
 * Flattens a fragment to text, giving structural tags the punctuation that
 * keeps their meaning readable in a flat string: definition lists become
 * `label: value`, table rows become middot-separated lines.
 */
export function fragmentToText(fragment) {
  return normalizeWhitespace(
    decodeEntities(
      fragment
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<li\b[^>]*>/gi, '\n\u2022 ')
        .replace(/<\/(dt|th)\s*>/gi, ': ')
        .replace(/<\/(td)\s*>/gi, ' \u00b7 ')
        .replace(
          /<\/(p|div|dd|tr|section|article|blockquote|figcaption|ul|ol|dl|table|h[1-6])\s*>/gi,
          '\n',
        )
        .replace(/<[^>]+>/g, ' '),
    ),
  ).replace(/[ \u00b7]+$/gm, '');
}

/**
 * Splits a page fragment into heading-delimited sections.
 *
 * Chunking on headings rather than a blind character window keeps each chunk
 * about one subject, which is what makes a keyword retriever usable on a
 * corpus this small.
 */
export function splitByHeadings(fragment) {
  const headingRe = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const sections = [];
  let cursor = 0;
  let current = { heading: null, level: 0, html: '' };

  for (let match = headingRe.exec(fragment); match; match = headingRe.exec(fragment)) {
    current.html += fragment.slice(cursor, match.index);
    sections.push(current);
    current = {
      heading: fragmentToText(match[2]) || null,
      level: Number(match[1][1]),
      html: '',
    };
    cursor = match.index + match[0].length;
  }
  current.html += fragment.slice(cursor);
  sections.push(current);

  return sections
    .map((section) => ({ ...section, text: fragmentToText(section.html) }))
    .filter((section) => section.text || section.heading);
}
