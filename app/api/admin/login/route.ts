/**
 * POST /api/admin/login — exchange credentials for a session cookie.
 *
 * Deliberately terse in what it reports back: "those credentials were not
 * accepted" for a bad username, a bad password, and a missing configuration
 * alike. Distinguishing them tells an attacker which half to keep guessing.
 */

import { SESSION_COOKIE, SESSION_TTL_MS, createToken, credentials, passwordMatches } from "@/lib/admin/auth";
import { authenticate, usersAvailable } from "@/lib/admin/users";

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

  /*
   * Database first, environment second.
   *
   * Staff accounts live in Postgres with per-user salted scrypt hashes. The
   * environment credential remains as a bootstrap and a fallback: it is how the
   * very first sign-in happens before any row exists, and how the dashboard
   * stays reachable if the database is down. Both paths report the same generic
   * failure, so neither can be used to work out which accounts exist.
   */
  let identity: string | null = null;

  if (usersAvailable()) {
    const user = await authenticate(username, password);
    if (user) identity = user.email;
  }

  if (!identity && username === configured.user && (await passwordMatches(password))) {
    identity = configured.user;
  }

  if (!identity) {
    return Response.json({ error: GENERIC }, { status: 401 });
  }

  attempts.delete(ip);
  const token = await createToken(identity, configured.secret);

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
