import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { SESSION_COOKIE, credentials, verifyToken } from "@/lib/admin/auth";
import type { PublishedNews, PublishedStore } from "@/lib/site-content";

/**
 * The publish seam: admin → website.
 *
 * The admin dashboard holds its working state in the browser. This is the one
 * route that turns that state into something the public site serves: it writes
 * `server/published.json` and then revalidates the pages that read it, so a
 * publish is live on the next request rather than at the next deploy.
 *
 * Guarded on its own. The middleware matcher covers `/admin/:path*` only, so an
 * API route under `/api/admin` has to check the session itself — otherwise the
 * one endpoint that can change the public site would be the one nobody is
 * checking.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Pages whose content comes from the published store. */
const AFFECTED = ["/news", "/"];

const MAX_ITEMS = 200;

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Accepts only the shape the site renders, and only from a signed-in admin. */
function parseNews(input: unknown): PublishedNews[] | null {
  if (!Array.isArray(input) || input.length > MAX_ITEMS) return null;

  const out: PublishedNews[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") return null;
    const item = raw as Record<string, unknown>;

    const title = clean(item.title, 300);
    const id = clean(item.id, 120);
    if (!title || !id) return null;

    out.push({
      id,
      date: clean(item.date, 40),
      title,
      body: clean(item.body, 4000),
      slug: clean(item.slug, 160),
      publishedAt: typeof item.publishedAt === "string" ? item.publishedAt : null,
    });
  }
  return out;
}

export async function POST(request: Request): Promise<Response> {
  const configured = credentials();
  if (!configured) {
    return Response.json({ error: "Admin is not configured." }, { status: 503 });
  }

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? await verifyToken(token, configured.secret) : null;
  if (!session) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: { news?: unknown };
  try {
    body = (await request.json()) as { news?: unknown };
  } catch {
    return Response.json({ error: "Expected JSON." }, { status: 400 });
  }

  const news = parseNews(body.news);
  if (!news) {
    return Response.json({ error: "Unexpected news payload." }, { status: 400 });
  }

  const store: PublishedStore = {
    version: 1,
    updatedAt: new Date().toISOString(),
    news,
  };

  const dir = path.join(process.cwd(), "server");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "published.json"), `${JSON.stringify(store, null, 2)}\n`, "utf8");

  // Drop the cached render of every page that reads the store, so the change is
  // visible on the next request instead of at the next build.
  for (const route of AFFECTED) revalidatePath(route);

  return Response.json({ ok: true, count: news.length, updatedAt: store.updatedAt, revalidated: AFFECTED });
}
