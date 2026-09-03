import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { promisify } from "node:util";

// promisify picks the 3-argument overload, dropping the options parameter that
// carries the cost factors — so the promisified form is typed explicitly.
const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

/**
 * Password hashing with scrypt.
 *
 * The previous scheme was a bare SHA-256 of the password: unsalted, so two
 * people with the same password produce the same hash, and fast enough that a
 * commodity GPU tries billions of candidates a second. scrypt is salted per
 * user and deliberately expensive in both CPU and memory, which is what makes a
 * stolen `users` table hard to turn into working credentials.
 *
 * Node ships scrypt in core, so this needs no dependency — worth preferring
 * over bcrypt or argon2 here, given the project vendors everything else too.
 *
 * Stored format, self-describing so the cost parameters can be raised later
 * without invalidating existing rows:
 *
 *   scrypt$N$r$p$<salt-hex>$<hash-hex>
 */

const N = 16384; // CPU/memory cost
const R = 8;
const P = 1;
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, n, r, p, saltHex, hashHex] = parts;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");

  let actual: Buffer;
  try {
    actual = await scrypt(password, salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
  } catch {
    return false;
  }

  // Constant time: a length check first, since timingSafeEqual throws on a
  // mismatch and that throw would itself leak the length.
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

/** Minimum bar for a dashboard holding contract and approval data. */
export function passwordProblem(password: string): string | null {
  if (password.length < 12) return "Use at least 12 characters.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return "Use both upper and lower case letters.";
  }
  if (!/\d/.test(password)) return "Include at least one number.";
  return null;
}
