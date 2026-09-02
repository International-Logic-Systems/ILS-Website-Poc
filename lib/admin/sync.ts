/**
 * Pushes the published Tier 1 content to the public site.
 *
 * The store is the working copy; `server/published.json` is the record the site
 * serves. Every action that changes what *should* be live calls this, so there
 * is no separate "deploy" step to forget — publishing is the deploy.
 *
 * Fire-and-forget by design: the store has already updated and the operator has
 * already seen the toast. A failure here is reported through `onSyncResult` so
 * the shell can say the website did not receive it, rather than silently
 * leaving the admin and the site disagreeing.
 */

import type { ContentItem } from "./types";

export type SyncState = "idle" | "saving" | "saved" | "error";

type Listener = (state: SyncState, detail?: string) => void;

const listeners = new Set<Listener>();

export function onSyncResult(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(state: SyncState, detail?: string) {
  for (const fn of listeners) fn(state, detail);
}

/** "2026-08-14T…" → "AUG 2026", matching how the site prints a news date. */
function displayDate(iso: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  return `${d.toLocaleString("en-US", { month: "short" }).toUpperCase()} ${d.getFullYear()}`;
}

/**
 * The site renders the summary, not the markdown body: the body is long-form
 * and the news list is a teaser. Falling back to the body keeps an item that
 * has no summary from publishing as a blank card.
 */
function teaser(item: ContentItem): string {
  return item.summary?.trim() || item.body.replace(/[#*_`>]/g, "").trim().slice(0, 400);
}

export async function syncPublished(content: ContentItem[]): Promise<void> {
  const news = content
    .filter((c) => c.kind === "news" && c.status === "published")
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .map((c) => ({
      id: c.id,
      date: displayDate(c.publishedAt),
      title: c.title,
      body: teaser(c),
      slug: c.slug,
      publishedAt: c.publishedAt,
    }));

  emit("saving");
  try {
    const res = await fetch("/api/admin/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ news }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      emit("error", `${res.status} ${detail.slice(0, 120)}`);
      return;
    }
    emit("saved", `${news.length} live`);
  } catch (error) {
    emit("error", error instanceof Error ? error.message : "network error");
  }
}
