/**
 * POST /api/admin/login — exchange credentials for a session cookie.
 *
 * Deliberately terse in what it reports back: "those credentials were not
 * accepted" for a bad username, a bad password, and a missing configuration
 * alike. Distinguishing them tells an attacker which half to keep guessing.
 */

import { SESSION_COOKIE, SESSION_TTL_MS, createToken, credentials, passwordMatches } from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC = "Those credentials were not accepted.";

/**
 * Brute-force brake, per IP, in memory.
 *
 * Enough to stop a script; it resets on deploy and does not span instances. A
 * real deployment should put this in Redis or at the edge/WAF.
 */
const ATTEMPT_LIMIT = 8;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map<string, { count: number; first: number }>();

function tooManyAttempts(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.first > ATTEMPT_WINDOW_MS) {
    attempts.set(ip, { count: 1, first: now });
    return false;
  }
  rec.count += 1;
  return rec.count > ATTEMPT_LIMIT;
}

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request): Promise<Response> {
  const ip = clientIp(request);

  if (tooManyAttempts(ip)) {
    return Response.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "retry-after": "600" } },
    );
  }

  const configured = credentials();
  if (!configured) {
    // Logged for the operator; the caller is told nothing useful.
    console.error("admin login attempted but ADMIN_SESSION_SECRET / password are not set");
    return Response.json({ error: GENERIC }, { status: 401 });
  }

  let username = "";
  let password = "";
  try {
    const body = (await request.json()) as { username?: unknown; password?: unknown };
    username = typeof body.username === "string" ? body.username : "";
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return Response.json({ error: GENERIC }, { status: 400 });
  }

  const ok = username === configured.user && (await passwordMatches(password));
  if (!ok) {
    return Response.json({ error: GENERIC }, { status: 401 });
  }

  attempts.delete(ip);
  const token = await createToken(configured.user, configured.secret);

  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      // httpOnly so script cannot read it; SameSite=Lax so it survives the
      // redirect back from the login form but is not sent cross-site.
      "set-cookie": `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax;${secure} Max-Age=${Math.floor(
        SESSION_TTL_MS / 1000,
      )}`,
    },
  });
}
