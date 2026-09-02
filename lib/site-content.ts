import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { news as seedNews } from "@/lib/content";

/**
 * What the public site reads.
 *
 * The admin publishes into `server/published.json`; this is the only thing that
 * reads it back. When the file is absent — a fresh clone, or before anyone has
 * published — the site falls back to the seed list in `lib/content.ts`, so a
 * missing store degrades to the shipped content rather than an empty page.
 *
 * There is no database. The file is the record, which is honest for a proof of
 * concept and is the seam a real CMS would replace: swap this reader and the
 * publish route, and every page keeps working unchanged.
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
export async function getNews(): Promise<PublishedNews[]> {
  const store = await readPublished();
  if (!store) return seedAsPublished();

  const seen = new Set(store.news.map((n) => n.title.toLowerCase()));
  const legacy = seedAsPublished().filter((n) => !seen.has(n.title.toLowerCase()));
  return [...store.news, ...legacy];
}

/** Where the current content came from — surfaced in the admin, not the site. */
export async function newsSource(): Promise<"admin" | "seed"> {
  return (await readPublished()) ? "admin" : "seed";
}
