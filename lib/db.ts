import "server-only";
import { Pool } from "pg";

/**
 * Postgres connection pool.
 *
 * One pool per process, cached on `globalThis` so Next's dev server does not
 * open a new pool on every hot reload and exhaust the connection limit.
 *
 * `isConfigured()` exists because the site must still run without a database.
 * News falls back to the published JSON file and then to the seed content, and
 * sign-in falls back to the single environment-configured admin — so a missing
 * DATABASE_URL degrades the site rather than breaking it.
 */

const globalForDb = globalThis as unknown as { ilsPool?: Pool };

export function isConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function pool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  globalForDb.ilsPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    // A hung database must not hang the page. The callers all have a fallback.
    connectionTimeoutMillis: 5000,
    idle_in_transaction_session_timeout: 10_000,
    max: 10,
  });

  return globalForDb.ilsPool;
}

/**
 * Runs a query, returning null instead of throwing when the database is
 * unreachable or unconfigured — callers decide what to show instead.
 */
export async function tryQuery<T>(
  text: string,
  params: unknown[] = [],
): Promise<T[] | null> {
  if (!isConfigured()) return null;
  try {
    const result = await pool().query(text, params);
    return result.rows as T[];
  } catch (error) {
    console.error("[db] query failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Same, but for callers that must know the difference between empty and broken. */
export async function query<T>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool().query(text, params);
  return result.rows as T[];
}
