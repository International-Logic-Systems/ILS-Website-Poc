import "server-only";

import { isConfigured, query, tryQuery } from "@/lib/db";
import { hashPassword, verifyPassword } from "./password";

/**
 * Staff accounts, in Postgres.
 *
 * Invite-only by design: there is no public sign-up route anywhere in the
 * application. A row exists because a signed-in admin created it, and
 * `invited_by` records which one — the dashboard holds contract records, the
 * approvals queue and the audit trail, so self-service access would be a way to
 * grant yourself sight of all three.
 *
 * When no database is configured the whole module stands aside and sign-in
 * falls back to the single environment-configured admin, so the site still runs
 * on a laptop with nothing else set up.
 */

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  canApprove: boolean;
  isActive: boolean;
  invitedBy: string | null;
  lastLoginAt: string | null;
  createdAt: string;
};

type Row = {
  id: string;
  email: string;
  name: string;
  role: string;
  can_approve: boolean;
  is_active: boolean;
  invited_by: string | null;
  last_login_at: string | null;
  created_at: string;
};

const toUser = (r: Row): AdminUser => ({
  id: String(r.id),
  email: r.email,
  name: r.name,
  role: r.role,
  canApprove: r.can_approve,
  isActive: r.is_active,
  invitedBy: r.invited_by ? String(r.invited_by) : null,
  lastLoginAt: r.last_login_at,
  createdAt: r.created_at,
});

const COLUMNS = `id, email, name, role, can_approve, is_active, invited_by, last_login_at, created_at`;

export function usersAvailable(): boolean {
  return isConfigured();
}

export async function listUsers(): Promise<AdminUser[]> {
  const rows = await tryQuery<Row>(`SELECT ${COLUMNS} FROM users ORDER BY created_at`);
  return (rows ?? []).map(toUser);
}

/**
 * Verifies an email and password against the database.
 *
 * Returns null for an unknown account, a deactivated one, or a wrong password —
 * the caller must not distinguish between them, or the response becomes a way
 * to enumerate who has an account.
 */
export async function authenticate(
  email: string,
  password: string,
): Promise<AdminUser | null> {
  if (!isConfigured()) return null;

  const rows = await tryQuery<Row & { password_hash: string }>(
    `SELECT ${COLUMNS}, password_hash FROM users WHERE lower(email) = lower($1) LIMIT 1`,
    [email],
  );
  if (!rows || rows.length === 0) return null;

  const row = rows[0];
  if (!row.is_active) return null;
  if (!(await verifyPassword(password, row.password_hash))) return null;

  // Best effort: a failed timestamp write must not fail the sign-in.
  await tryQuery(`UPDATE users SET last_login_at = now() WHERE id = $1`, [row.id]);

  return toUser(row);
}

export type InviteInput = {
  email: string;
  name: string;
  password: string;
  role?: string;
  canApprove?: boolean;
  invitedBy?: string | null;
};

/** Creates an account. Throws on a duplicate email so the caller can say so. */
export async function inviteUser(input: InviteInput): Promise<AdminUser> {
  const rows = await query<Row>(
    `INSERT INTO users (email, name, role, password_hash, can_approve, invited_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${COLUMNS}`,
    [
      input.email.trim(),
      input.name.trim(),
      input.role?.trim() || "editor",
      await hashPassword(input.password),
      Boolean(input.canApprove),
      input.invitedBy ?? null,
    ],
  );
  return toUser(rows[0]);
}

export async function setActive(id: string, isActive: boolean): Promise<void> {
  await query(`UPDATE users SET is_active = $2, updated_at = now() WHERE id = $1`, [id, isActive]);
}

export async function findByEmail(email: string): Promise<AdminUser | null> {
  const rows = await tryQuery<Row>(
    `SELECT ${COLUMNS} FROM users WHERE lower(email) = lower($1) LIMIT 1`,
    [email],
  );
  return rows && rows.length ? toUser(rows[0]) : null;
}
