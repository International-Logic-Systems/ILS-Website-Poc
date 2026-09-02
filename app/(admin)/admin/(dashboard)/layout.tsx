/**
 * The dashboard shell: sidebar, top bar and the demo ribbon.
 *
 * Sits in a `(dashboard)` route group so /admin/login can share the admin
 * document and stylesheet without inheriting the chrome — a sign-in screen with
 * a sidebar behind it invites you to click nav you have no session for.
 *
 * This layer is a server component so it can read the session cookie and hand
 * the shell the account that is actually signed in, rather than a fixture name.
 */

import { cookies } from 'next/headers';
import { AdminShell } from '@/components/admin/shell';
import { Toaster } from '@/components/admin/ui/toaster';
import { SESSION_COOKIE, credentials, verifyToken } from '@/lib/admin/auth';

/** Middleware guarantees a valid session here; this only reads the name off it. */
async function signedInUser(): Promise<string | null> {
  const configured = credentials();
  if (!configured) return null;

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await verifyToken(token, configured.secret);
  return session?.user ?? null;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await signedInUser();

  return (
    <>
      <AdminShell signedInAs={user}>{children}</AdminShell>
      <Toaster />
    </>
  );
}
