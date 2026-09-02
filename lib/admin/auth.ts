/**
 * Admin session tokens.
 *
 * Runs in both the Edge middleware and the Node route handler, so everything
 * here uses Web Crypto — `node:crypto` is not available in middleware.
 *
 * The token is a signed statement, not a database lookup: `payload.signature`,
 * where the signature is an HMAC over the payload using ADMIN_SESSION_SECRET.
 * Nothing is stored server-side, so it survives restarts and works unchanged
 * across multiple instances. The trade is that a token cannot be revoked before
 * it expires — rotate the secret to invalidate every session at once.
 */

const enc = new TextEncoder();

export const SESSION_COOKIE = "ils_admin_session";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // one working day

export type Session = { user: string; exp: number };

function b64urlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const b of view) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): string {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  return atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

/** Length-independent comparison, so a mismatch reveals nothing by timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createToken(user: string, secret: string): Promise<string> {
  const payload: Session = { user, exp: Date.now() + SESSION_TTL_MS };
  const body = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(body));
  return `${body}.${b64urlEncode(sig)}`;
}

/** Returns the session only when the signature checks out and it has not expired. */
export async function verifyToken(token: string, secret: string): Promise<Session | null> {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;

  const body = token.slice(0, dot);
  const given = token.slice(dot + 1);

  const expected = b64urlEncode(
    await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(body)),
  );
  if (!timingSafeEqual(given, expected)) return null;

  try {
    const session = JSON.parse(b64urlDecode(body)) as Session;
    if (typeof session.exp !== "number" || session.exp < Date.now()) return null;
    if (typeof session.user !== "string" || !session.user) return null;
    return session;
  } catch {
    return null;
  }
}

/**
 * Credentials, from the environment.
 *
 * Prefers ADMIN_PASSWORD_SHA256 so a plaintext password never sits in an env
 * file or a deployment console. ADMIN_PASSWORD is accepted as a fallback for
 * local use. Returns null when either the secret or the password is missing —
 * callers must fail closed rather than admit everyone.
 */
export function credentials(): { user: string; secret: string } | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const hasPassword =
    !!process.env.ADMIN_PASSWORD_SHA256 || !!process.env.ADMIN_PASSWORD;
  if (!secret || !hasPassword) return null;
  return { user: process.env.ADMIN_USERNAME || "admin", secret };
}

export async function passwordMatches(candidate: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_SHA256;
  if (hash) return timingSafeEqual((await sha256Hex(candidate)).toLowerCase(), hash.toLowerCase());

  const plain = process.env.ADMIN_PASSWORD;
  if (!plain) return false;
  // Hash both sides so the comparison is fixed-length regardless of input.
  return timingSafeEqual(await sha256Hex(candidate), await sha256Hex(plain));
}
