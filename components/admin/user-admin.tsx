'use client';

/**
 * Staff accounts — the invite-only user list.
 *
 * There is no sign-up page anywhere on the site; this form is the only way an
 * account comes into existence, and it requires an existing session. The
 * password rules are stated up front rather than after a rejection.
 */

import * as React from 'react';
import { Button } from '@/components/admin/ui/button';
import { Badge, Card, CardBody, CardHeader, CardTitle, Eyebrow } from '@/components/admin/ui/primitives';

type User = {
  id: string; email: string; name: string; role: string;
  canApprove: boolean; isActive: boolean; lastLoginAt: string | null;
};

const field =
  'mt-1.5 w-full rounded-md border border-rule bg-card px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-action focus:outline-none';

export function UserAdmin() {
  const [available, setAvailable] = React.useState<boolean | null>(null);
  const [users, setUsers] = React.useState<User[]>([]);
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await fetch('/api/admin/users');
    if (!res.ok) { setAvailable(false); return; }
    const data = await res.json();
    setAvailable(data.available);
    setUsers(data.users ?? []);
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError(null); setDone(null);
    const form = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, canApprove: form.canApprove === 'on' }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok || !data.ok) { setError(data.error ?? 'Could not create that account.'); return; }
    setDone(`${data.user.email} can now sign in.`);
    setOpen(false);
    void load();
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <Eyebrow>Access</Eyebrow>
          <CardTitle>Staff accounts</CardTitle>
        </div>
        {available === false
          ? <Badge tone="draft">No database</Badge>
          : <Badge tone="live">{users.length} account{users.length === 1 ? '' : 's'}</Badge>}
      </CardHeader>

      <CardBody>
        {available === false ? (
          <p className="text-sm text-muted">
            Accounts live in Postgres. With no <code>DATABASE_URL</code> configured, sign-in
            falls back to the single administrator set in the environment.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-rule-soft border-y border-rule-soft">
              {users.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
                  <span className="font-semibold text-ink">{u.name}</span>
                  <span className="text-sm text-muted">{u.email}</span>
                  <span className="ml-auto flex items-center gap-2">
                    {u.canApprove && <Badge tone="info">Approver</Badge>}
                    <Badge tone={u.isActive ? 'live' : 'draft'}>{u.isActive ? 'Active' : 'Disabled'}</Badge>
                  </span>
                </li>
              ))}
            </ul>

            {done && <p className="mt-3 text-sm text-green">{done}</p>}

            {open ? (
              <form onSubmit={invite} className="mt-4 space-y-4 rounded-md border border-rule-soft p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-ink">Name</span>
                    <input name="name" required className={field} placeholder="Dana Brennan" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-ink">Work email</span>
                    <input name="email" type="email" required className={field} placeholder="dana@intllogic.com" />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-semibold text-ink">Temporary password</span>
                  <span className="mt-1 block text-sm text-muted">
                    At least 12 characters, upper and lower case, and a number. Share it with them
                    directly — it is never emailed.
                  </span>
                  <input name="password" type="text" required className={field} spellCheck={false} />
                </label>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" name="canApprove" className="size-4" />
                  Can approve Tier 2 changes
                </label>

                {error && (
                  <p role="alert" className="rounded-md border border-danger-ring bg-danger-soft px-3 py-2 text-sm text-danger">
                    {error}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button type="submit" variant="primary" disabled={busy}>
                    {busy ? 'Creating…' : 'Create account'}
                  </Button>
                  <Button type="button" variant="subtle" onClick={() => { setOpen(false); setError(null); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="mt-4 flex items-center gap-3">
                <Button type="button" variant="primary" onClick={() => setOpen(true)}>
                  Invite a colleague
                </Button>
                <span className="text-sm text-muted">
                  There is no public sign-up — accounts are created here only.
                </span>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
