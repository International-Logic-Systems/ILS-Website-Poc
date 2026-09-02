/**
 * Locates and reads the two file-backed knowledge sources: the curated
 * markdown in `knowledge/`, and the site's own rendered pages.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  extractMain,
  extractTitle,
  markdownToText,
  splitByHeadings,
  stripFrontmatter,
} from './text.mjs';

/** Recursively lists files under `dir` whose extension is in `extensions`. */
export async function walk(dir, extensions) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  const found = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await walk(full, extensions)));
    } else if (extensions.includes(path.extname(entry.name).toLowerCase())) {
      found.push(full);
    }
  }
  return found.sort();
}

/** True if `candidate` exists and is a directory. */
async function isDirectory(candidate) {
  try {
    return (await stat(candidate)).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Finds the directory holding the site's rendered HTML.
 *
 * A static export writes `out/`, which is what the S3 deployment uploads. When
 * the site has only been built and not exported, Next still leaves prerendered
 * HTML for every static route under `.next/server/app/`, so the knowledge build
 * works either way rather than depending on which command was run last.
 */
export async function findRenderedPages(root) {
  const candidates = [
    { dir: path.join(root, 'out'), label: 'out/ (static export)' },
    { dir: path.join(root, '.next', 'server', 'app'), label: '.next/server/app/ (prerender)' },
  ];
  for (const candidate of candidates) {
    if (await isDirectory(candidate.dir)) return candidate;
  }
  return null;
}

/**
 * Derives the public URL path a rendered file is served at.
 *
 * Both layouts collapse to the same route: `out/about/index.html` and
 * `.next/server/app/about.html` are each `/about`.
 */
export function routeFromFile(file, baseDir) {
  const relative = path.relative(baseDir, file).split(path.sep).join('/');
  const withoutExtension = relative.replace(/\.html$/i, '').replace(/\/index$/, '');
  if (!withoutExtension || withoutExtension === 'index') return '/';
  return `/${withoutExtension}`;
}

/**
 * Routes excluded from the corpus.
 *
 * Next's internal error shells carry no company information.
 *
 * `/admin/**` is excluded for a stronger reason: the knowledge base backs the
 * PUBLIC assistant. Harvesting the prerendered dashboard put internal content —
 * approval queues, user roles, opportunity pipeline — into a corpus anyone can
 * query from the website. It was 23 of 79 chunks before this rule.
 */
const EXCLUDED_ROUTES = new Set(['/_not-found', '/_global-error', '/404', '/500']);

/** Route prefixes excluded from the corpus. */
const EXCLUDED_PREFIXES = ['/admin'];

function isExcluded(route) {
  return (
    EXCLUDED_ROUTES.has(route) ||
    EXCLUDED_PREFIXES.some((p) => route === p || route.startsWith(`${p}/`))
  );
}

/** Reads the curated markdown in `knowledge/` into documents. */
export async function collectCuratedDocuments(knowledgeDir) {
  const files = await walk(knowledgeDir, ['.md', '.mdx']);
  const documents = [];

  for (const file of files) {
    const name = path.basename(file);
    if (name.toLowerCase() === 'readme.md') continue;

    const raw = await readFile(file, 'utf8');
    const { data, body } = stripFrontmatter(raw);
    const text = markdownToText(body);
    if (!text) continue;

    const relative = path.relative(knowledgeDir, file).split(path.sep).join('/');
    documents.push({
      source: 'curated',
      title: data.title || path.basename(file, path.extname(file)).replace(/[-_]/g, ' '),
      path: data.path || data.url || '/contact',
      file: `knowledge/${relative}`,
      sections: splitMarkdownSections(body, text),
    });
  }

  return documents;
}

/**
 * Splits curated markdown on ATX headings so chunks stay subject-shaped, the
 * same way page sections do.
 */
function splitMarkdownSections(body, fallbackText) {
  const headingRe = /^\s{0,3}(#{1,6})\s+(.+)$/gm;
  const sections = [];
  let cursor = 0;
  let current = { heading: null, body: '' };

  for (let match = headingRe.exec(body); match; match = headingRe.exec(body)) {
    current.body += body.slice(cursor, match.index);
    sections.push(current);
    current = { heading: match[2].trim(), body: '' };
    cursor = match.index + match[0].length;
  }
  current.body += body.slice(cursor);
  sections.push(current);

  const mapped = sections
    .map((section) => ({ heading: section.heading, text: markdownToText(section.body) }))
    .filter((section) => section.text || section.heading);

  return mapped.length ? mapped : [{ heading: null, text: fallbackText }];
}

/** Reads the site's rendered pages into documents. */
export async function collectPageDocuments(root) {
  const rendered = await findRenderedPages(root);
  if (!rendered) return { documents: [], origin: null };

  const files = await walk(rendered.dir, ['.html']);
  const documents = [];

  for (const file of files) {
    const route = routeFromFile(file, rendered.dir);
    if (isExcluded(route)) continue;

    const html = await readFile(file, 'utf8');
    const main = extractMain(html);
    if (!main) continue;

    const sections = splitByHeadings(main);
    if (!sections.length) continue;

    documents.push({
      source: 'page',
      title: extractTitle(html) || route,
      path: route,
      file: path.relative(root, file).split(path.sep).join('/'),
      sections,
    });
  }

  return { documents, origin: rendered.label };
}
