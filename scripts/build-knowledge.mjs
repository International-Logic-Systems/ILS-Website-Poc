#!/usr/bin/env node
/**
 * Builds `server/knowledge.json`, the only body of text the chat assistant is
 * allowed to answer from.
 *
 * Three sources feed it, in descending authority:
 *
 *   curated  knowledge/**\/*.md   hand-written answers to questions the site
 *                                 does not address in prose
 *   facts    lib/*.ts             the site's typed content, which is the only
 *                                 source that knows a value is unconfirmed
 *   page     rendered HTML        what each page actually says, so the
 *                                 assistant cannot contradict the site
 *
 * Run as part of `npm run build`, after `next build`, so the rendered pages are
 * on disk. Run directly with `--sample` to inspect what it produced.
 *
 * Usage:
 *   node scripts/build-knowledge.mjs
 *   node scripts/build-knowledge.mjs --sample        # print a few chunks
 *   node scripts/build-knowledge.mjs --sample=12     # print twelve
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chunkDocument, dedupeChunks } from './lib/chunk.mjs';
import { collectCuratedDocuments, collectPageDocuments } from './lib/sources.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KNOWLEDGE_DIR = path.join(ROOT, 'knowledge');
const OUTPUT = path.join(ROOT, 'server', 'knowledge.json');

const MAX_TOKENS = 500;
const MIN_TOKENS = 90;

/** Parses `--sample` / `--sample=N` off the command line. */
function sampleSize(argv) {
  const flag = argv.find((argument) => argument === '--sample' || argument.startsWith('--sample='));
  if (!flag) return 0;
  const value = flag.includes('=') ? Number(flag.split('=')[1]) : 6;
  return Number.isFinite(value) && value > 0 ? value : 6;
}

function summarise(chunks) {
  const bySource = new Map();
  for (const chunk of chunks) {
    const entry = bySource.get(chunk.source) ?? { chunks: 0, tokens: 0, paths: new Set() };
    entry.chunks += 1;
    entry.tokens += chunk.tokens;
    entry.paths.add(chunk.path);
    bySource.set(chunk.source, entry);
  }
  return bySource;
}

function printSample(chunks, count) {
  // Spread the sample across the corpus rather than showing the first N, which
  // would all come from one page.
  const stride = Math.max(1, Math.floor(chunks.length / count));
  const picked = [];
  for (let index = 0; index < chunks.length && picked.length < count; index += stride) {
    picked.push(chunks[index]);
  }

  for (const chunk of picked) {
    const rule = '─'.repeat(74);
    console.log(`\n${rule}`);
    console.log(`  ${chunk.id}`);
    console.log(`  source=${chunk.source}  path=${chunk.path}  tokens≈${chunk.tokens}`);
    console.log(`  title=${JSON.stringify(chunk.title)}  heading=${JSON.stringify(chunk.heading)}`);
    console.log(rule);
    console.log(chunk.text.length > 900 ? `${chunk.text.slice(0, 900)}\n  …[truncated]` : chunk.text);
  }
  console.log();
}

async function main() {
  const argv = process.argv.slice(2);

  const [curated, pages] = await Promise.all([
    collectCuratedDocuments(KNOWLEDGE_DIR),
    collectPageDocuments(ROOT),
  ]);

  // Imported lazily: this is the only step that loads TypeScript, and keeping
  // it out of the top level means a failure here reports against this build
  // rather than the module graph.
  const { collectFactDocuments } = await import('./lib/facts.mjs');
  const facts = await collectFactDocuments();

  const documents = [...curated, ...facts, ...pages.documents];
  const options = { maxTokens: MAX_TOKENS, minTokens: MIN_TOKENS };
  const raw = documents.flatMap((document) => chunkDocument(document, options));
  const chunks = dedupeChunks(raw).sort((a, b) => a.path.localeCompare(b.path) || a.id.localeCompare(b.id));

  if (!chunks.length) {
    throw new Error(
      'No knowledge chunks were produced. Run `next build` first so the rendered pages exist, ' +
        'or add content under knowledge/.',
    );
  }

  const payload = {
    // `builtAt` is deliberately absent: a timestamp would make every build a
    // diff, and nothing downstream reads it.
    version: 1,
    chunkCount: chunks.length,
    totalTokens: chunks.reduce((sum, chunk) => sum + chunk.tokens, 0),
    sources: {
      curated: curated.length,
      facts: facts.length,
      pages: pages.documents.length,
      pageOrigin: pages.origin,
    },
    chunks,
  };

  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  const bySource = summarise(chunks);
  console.log(`knowledge: ${chunks.length} chunks, ~${payload.totalTokens} tokens → server/knowledge.json`);
  for (const [source, entry] of [...bySource].sort()) {
    console.log(
      `  ${source.padEnd(8)} ${String(entry.chunks).padStart(3)} chunks  ` +
        `~${String(entry.tokens).padStart(5)} tokens  ${entry.paths.size} paths`,
    );
  }
  if (!pages.documents.length) {
    console.warn(
      '  warning: no rendered pages found. Run `next build` before this script so page prose is included.',
    );
  } else {
    console.log(`  pages read from ${pages.origin}`);
  }
  if (raw.length !== chunks.length) {
    console.log(`  ${raw.length - chunks.length} near-duplicate chunks dropped`);
  }

  const sample = sampleSize(argv);
  if (sample) printSample(chunks, sample);
}

main().catch((error) => {
  console.error(`build-knowledge failed: ${error.message}`);
  process.exitCode = 1;
});
