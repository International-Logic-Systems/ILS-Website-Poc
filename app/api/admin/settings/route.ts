import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { SESSION_COOKIE, credentials, verifyToken } from "@/lib/admin/auth";
import { GA_PATTERN, GTM_PATTERN, getAnalytics, type SiteSettings } from "@/lib/site-settings";

/**
 * Read and write the settings an operator controls.
 *
 * Guarded on its own: the middleware matcher covers `/admin/:path*` only, so an
 * API route under `/api/admin` has to check the session itself.
 *
 * Saving revalidates the root layout, which is where the tags are rendered —
 * that is what makes a change take effect on the next request rather than at
 * the next deploy.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin(): Promise<Response | null> {
  const configured = credentials();
  if (!configured) return Response.json({ error: "Admin is not configured." }, { status: 503 });

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? await verifyToken(token, configured.secret) : null;
  if (!session) return Response.json({ error: "Not signed in." }, { status: 401 });

  return null;
}

export async function GET(): Promise<Response> {
  const denied = await requireAdmin();
  if (denied) return denied;
  return Response.json(await getAnalytics());
}

/** Empty string clears a value; an invalid one is rejected with a reason. */
function parseId(
  value: unknown,
  re: RegExp,
  label: string,
  example: string,
): { id: string | null } | { error: string } {
  if (value === null || value === undefined) return { id: null };
  if (typeof value !== "string") return { error: `${label} must be text.` };

  const t = value.trim().toUpperCase();
  if (!t) return { id: null };
  if (!re.test(t)) {
    return { error: `That does not look like a ${label}. It should look like ${example}.` };
  }
  return { id: t };
}

export async function POST(request: Request): Promise<Response> {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { gtmId?: unknown; gaId?: unknown };
  try {
    body = (await request.json()) as { gtmId?: unknown; gaId?: unknown };
  } catch {
    return Response.json({ error: "Expected JSON." }, { status: 400 });
  }

  const gtm = parseId(body.gtmId, GTM_PATTERN, "Google Tag Manager ID", "GTM-ABC1234");
  if ("error" in gtm) return Response.json({ error: gtm.error }, { status: 400 });

  const ga = parseId(body.gaId, GA_PATTERN, "Google Analytics measurement ID", "G-ABC1234567");
  if ("error" in ga) return Response.json({ error: ga.error }, { status: 400 });

  const settings: SiteSettings = {
    version: 1,
    updatedAt: new Date().toISOString(),
    analytics: { gtmId: gtm.id, gaId: ga.id },
  };

  const dir = path.join(process.cwd(), "server");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "settings.json"), `${JSON.stringify(settings, null, 2)}\n`, "utf8");

  // The tags live in the site layout, so the whole layout has to be dropped
  // from the cache rather than a single page.
  revalidatePath("/", "layout");

  return Response.json({ ok: true, ...(await getAnalytics()) });
}
