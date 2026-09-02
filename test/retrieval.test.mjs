import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildIndex, renderContext, search, tokenize } from '../lib/chat/retrieval.ts';

const knowledge = JSON.parse(readFileSync(new URL('../server/knowledge.json', import.meta.url), 'utf8'));
const index = buildIndex(knowledge.chunks);

/** The top-ranked chunk for a question. */
const top = (query) => search(index, query, { limit: 1 })[0];

/** True if any of the top `n` results is on `path`. */
const hits = (query, path, n = 8) =>
  search(index, query, { limit: n }).some((result) => result.chunk.path === path);

/** Joined text of the top `n` results, for asserting a value was retrieved. */
const textOf = (query, n = 8) =>
  search(index, query, { limit: n })
    .map((result) => result.chunk.text)
    .join('\n');

describe('tokenize', () => {
  test('lowercases and drops stopwords', () => {
    assert.ok(tokenize('What Are The Capabilities').includes('capabilities'));
    assert.ok(!tokenize('What Are The Capabilities').includes('are'));
  });

  test('emits the stem alongside the exact token', () => {
    // Both forms, never the stem alone: the exact token keeps its weight and
    // the stem is what lets "apply" reach "applying".
    const terms = tokenize('capabilities');
    assert.ok(terms.includes('capabilities'));
    assert.ok(terms.includes('capability'));
    assert.ok(tokenize('applying').includes('apply'));
  });

  test('indexes the digit run of an alphanumeric token', () => {
    // "401k" asked against "401(k)" written.
    assert.ok(tokenize('401k').includes('401'));
  });

  test('keeps a contract number whole and also splits it', () => {
    const terms = tokenize('693KA9-18-A-00102');
    assert.ok(terms.includes('693ka9-18-a-00102'));
    assert.ok(terms.includes('693ka9'));
    assert.ok(terms.includes('00102'));
  });
});

describe('retrieval quality', () => {
  test('finds a vehicle by its exact contract number', () => {
    // The case that most justifies lexical search over embeddings.
    assert.match(top('693KA9-18-A-00102').chunk.text, /693KA9-18-A-00102/);
    assert.match(textOf('75N98120D00167'), /75N98120D00167/);
  });

  test('finds a vehicle by name', () => {
    assert.ok(hits('What is eFAST?', '/contracts'));
    assert.ok(hits('Do you hold a GSA schedule?', '/contracts'));
    assert.ok(hits('Tell me about CIO-SP3', '/contracts'));
  });

  test('retrieves the derived status, not a sales line', async () => {
    // The status the badge shows has to be the status the assistant sees.
    // Asserted against statusOf rather than a literal, so this keeps testing
    // the wiring as periods of performance change instead of going stale.
    const { vehicles, statusOf, STATUS_LABEL } = await import('../lib/vehicles.ts');
    assert.match(textOf('Is the GSA schedule still active?'), /GS-35F-397DA/);

    for (const vehicle of vehicles) {
      const label = STATUS_LABEL[statusOf(vehicle)];
      assert.match(
        textOf(`${vehicle.name} status`, 10),
        new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
        `${vehicle.slug} should retrieve its derived status "${label}"`,
      );
    }
  });

  test('retrieves a labelled contract term', () => {
    assert.match(textOf('prompt payment terms CIO-SP3'), /0\.75% 10, Net 30/);
  });

  test('routes a leadership question to the leadership facts', () => {
    assert.ok(hits('Who is your CEO?', '/leadership'));
    assert.match(textOf('Who is your CEO?'), /Chief Executive Officer/);
  });

  test('routes a benefits question to careers', () => {
    assert.ok(hits('What employee benefits do you offer?', '/careers'));
    assert.match(textOf('Do you offer a 401k?'), /401\(k\)/);
  });

  test('finds task areas awarded under a vehicle', () => {
    assert.match(textOf('CIO-SP3 task areas'), /Task Area 10 — Software Development/);
  });
});

describe('renderContext', () => {
  test('carries the source path for every passage', () => {
    const rendered = renderContext(search(index, 'contract vehicles', { limit: 2 }));
    assert.match(rendered, /<url>\/contracts<\/url>/);
  });

  test('says so plainly when nothing matched', () => {
    assert.match(renderContext([]), /No matching ILS information was found/);
  });
});
