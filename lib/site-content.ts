import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { news as seedNews } from "@/lib/content";
import { tryQuery } from "@/lib/db";

/**
 * What the public site reads.
 *
 * Postgres is the record when it is available. The JSON file the admin writes
 * is the fallback, and the seed list compiled into `lib/content.ts` is the
 * fallback for that — so the page renders on a fresh clone, on a laptop with no
 * database, and during an outage.
 */

export type PublishedNews = {
  /** Stable id from the admin, used to de-duplicate and to key the list. */
  id: string;
  /** Display date, e.g. "AUG 2026". */
  date: string;
  title: string;
  body: string;
  slug: string;
  publishedAt: string | null;
};

export type PublishedStore = {
  version: 1;
  updatedAt: string;
  news: PublishedNews[];
};

const STORE = path.join(process.cwd(), "server", "published.json");

/** Seed rows carry no id; derive a stable one so keys never collide. */
const seedAsPublished = (): PublishedNews[] =>
  seedNews.map((n, i) => ({
    id: `seed-${i}`,
    date: n.date,
    title: n.title,
    body: n.body,
    slug: "",
    publishedAt: null,
  }));

export async function readPublished(): Promise<PublishedStore | null> {
  try {
    const raw = await readFile(STORE, "utf8");
    const parsed = JSON.parse(raw) as PublishedStore;
    if (!parsed || !Array.isArray(parsed.news)) return null;
    return parsed;
  } catch {
    // Missing or unreadable is a normal state, not an error: nothing has been
    // published yet.
    return null;
  }
}

/**
 * The news the site should show, newest first.
 *
 * Admin-published items win. The seed list is appended beneath them so the
 * historical record does not vanish the first time someone publishes.
 */
/** "2026-08-14T…" → "AUG 2026", the form the site prints. */
function displayDate(iso: string | Date | null): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  return `${d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase()} ${d.getUTCFullYear()}`;
}

/**
 * Published news from Postgres, or null when there is no database or it cannot
 * be reached — which is the difference the caller needs in order to fall back
 * rather than render an empty page.
 */
async function newsFromDb(): Promise<PublishedNews[] | null> {
  const rows = await tryQuery<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    body: string;
    published_at: string;
  }>(
    `SELECT id, slug, title, summary, body, published_at
       FROM news
      WHERE status = 'published'
      ORDER BY published_at DESC`,
  );
  if (!rows) return null;

  return rows.map((r) => ({
    id: `db-${r.id}`,
    date: displayDate(r.published_at),
    title: r.title,
    // The list shows the teaser; the body is long-form.
    body: r.summary?.trim() || r.body,
    slug: r.slug,
    publishedAt: r.published_at,
  }));
}

/**
 * The news the site should show, newest first.
 *
 * Three sources in descending authority: Postgres, then the JSON file the admin
 * writes, then the seed list compiled into `lib/content.ts`. Each is a fallback
 * for the one before, so a database outage degrades to the last published file
 * rather than to an empty page, and a fresh clone with neither still renders.
 *
 * Titles are de-duplicated across sources: the same story arriving from both
 * Postgres and the file must appear once.
 */
const MONTHS: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

/**
 * A sortable instant for an item, whichever source it came from.
 *
 * Postgres rows carry a real `publishedAt`. The file and seed rows carry only a
 * printed label like "AUG 2024", so that is parsed back to the first of the
 * month — precise enough to order by, and the only date those rows have.
 */
function sortKey(item: PublishedNews): number {
  if (item.publishedAt) {
    const t = new Date(item.publishedAt).getTime();
    if (!Number.isNaN(t)) return t;
  }
  const m = /^([A-Z]{3})\s+(\d{4})$/.exec(item.date.trim().toUpperCase());
  if (m && m[1] in MONTHS) return Date.UTC(Number(m[2]), MONTHS[m[1]], 1);
  return 0; // undated sorts to the bottom rather than the top
}

export async function getNews(): Promise<PublishedNews[]> {
  const fromDb = await newsFromDb();
  const store = await readPublished();

  const layers = [fromDb ?? [], store?.news ?? [], seedAsPublished()];

  const seen = new Set<string>();
  const out: PublishedNews[] = [];
  for (const layer of layers) {
    for (const item of layer) {
      const key = item.title.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
  }

  // Merging by source left three date-ordered runs stacked on top of each
  // other rather than one ordered list, so the page jumped backwards at each
  // boundary. Sort is stable, so items sharing a month keep source precedence.
  return out.sort((a, b) => sortKey(b) - sortKey(a));
}

/** Where the current content came from — surfaced in the admin, not the site. */
export async function newsSource(): Promise<"admin" | "seed"> {
  return (await readPublished()) ? "admin" : "seed";
}
