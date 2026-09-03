#!/usr/bin/env node
/**
 * Migrations and seeding.
 *
 *   node scripts/db.mjs migrate    apply every unapplied .sql in db/migrations
 *   node scripts/db.mjs seed       create the first admin from .env.local
 *   node scripts/db.mjs status     what is applied, and row counts
 *
 * Migrations are plain SQL files applied in filename order and recorded in a
 * `schema_migrations` table, so re-running is safe. No ORM: the schema is small
 * and SQL is the thing a DBA can review.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Client } = require('pg');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = path.join(ROOT, 'db', 'migrations');

/** Read DATABASE_URL from the environment or .env.local, without a dependency. */
async function connectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const env = await readFile(path.join(ROOT, '.env.local'), 'utf8');
    const line = env.split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL='));
    if (line) return line.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
  } catch { /* no .env.local */ }
  return null;
}

async function connect() {
  const cs = await connectionString();
  if (!cs) {
    console.error('DATABASE_URL is not set. Add it to .env.local:\n' +
      '  DATABASE_URL=postgres://ils:ils_local_dev@127.0.0.1:5432/ils');
    process.exit(1);
  }
  const client = new Client({ connectionString: cs });
  try {
    await client.connect();
  } catch (error) {
    console.error(`Could not reach Postgres: ${error.message}`);
    console.error('Is it running?  docker compose up -d');
    process.exit(1);
  }
  return client;
}

async function migrate(client) {
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`);

  const { rows } = await client.query('SELECT name FROM schema_migrations');
  const done = new Set(rows.map((r) => r.name));
  const files = (await readdir(MIGRATIONS)).filter((f) => f.endsWith('.sql')).sort();

  let applied = 0;
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = await readFile(path.join(MIGRATIONS, file), 'utf8');
    // Each migration is one transaction: it applies completely or not at all.
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`  applied  ${file}`);
      applied += 1;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`  FAILED   ${file}\n           ${error.message}`);
      process.exit(1);
    }
  }
  console.log(applied ? `${applied} migration(s) applied.` : 'Already up to date.');
}

async function seed(client) {
  const { hashPassword } = await import('./password-node.mjs');
  const email = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!password) {
    console.error('Set ADMIN_SEED_PASSWORD to create the first account, e.g.\n' +
      '  ADMIN_SEED_PASSWORD="ChangeMe-Now-2026" npm run db:seed');
    process.exit(1);
  }

  const { rows } = await client.query('SELECT count(*)::int AS n FROM users');
  if (rows[0].n > 0) {
    console.log(`${rows[0].n} user(s) already exist — seed skipped. Invite further users from the admin.`);
    return;
  }

  await client.query(
    `INSERT INTO users (email, name, role, password_hash, can_approve, is_active)
     VALUES ($1, $2, 'administrator', $3, TRUE, TRUE)`,
    [email, 'Administrator', await hashPassword(password)],
  );
  console.log(`Created the first account: ${email}`);
  console.log('Sign in, then invite colleagues from Settings — there is no public sign-up.');
}

async function status(client) {
  const { rows: m } = await client.query(
    'SELECT name, applied_at FROM schema_migrations ORDER BY name').catch(() => ({ rows: [] }));
  console.log(`migrations applied: ${m.length}`);
  for (const r of m) console.log(`  ${r.name}`);
  for (const t of ['users', 'news']) {
    const { rows } = await client.query(`SELECT count(*)::int AS n FROM ${t}`).catch(() => ({ rows: [{ n: '—' }] }));
    console.log(`  ${t}: ${rows[0].n} row(s)`);
  }
}

const command = process.argv[2] ?? 'migrate';
const client = await connect();
try {
  if (command === 'migrate') await migrate(client);
  else if (command === 'seed') await seed(client);
  else if (command === 'status') await status(client);
  else { console.error(`Unknown command: ${command}`); process.exit(1); }
} finally {
  await client.end();
}
