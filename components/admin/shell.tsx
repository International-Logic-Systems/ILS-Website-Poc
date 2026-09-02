'use client';

import {
  ChevronDown,
  FileText,
  Gauge,
  Landmark,
  Menu,
  ShieldCheck,
  Settings as SettingsIcon,
  Target,
  X,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import logoLockupWhite from '@/public/logo-lockup-white.png';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { cn } from '@/lib/admin/cn';
import { CURRENT_USER_ID, userById } from '@/lib/admin/fixtures/users';
import { usePendingCount } from '@/lib/admin/store';
import { Badge } from './ui/primitives';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Overview is the only exact match; the rest own their subtrees. */
  exact?: boolean;
};

const NAV: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: Gauge, exact: true },
  { href: '/admin/content', label: 'Content', icon: FileText },
  { href: '/admin/approvals', label: 'Approvals', icon: ShieldCheck },
  { href: '/admin/contracts', label: 'Contracts & Registrations', icon: Landmark },
  { href: '/admin/opportunities', label: 'Opportunity Scorer', icon: Target },
  { href: '/admin/settings', label: 'Settings', icon: SettingsIcon },
];

function isActive(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

/* ------------------------------------------------------------- sidebar */

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const pending = usePendingCount();

  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {NAV.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex items-center gap-3 rounded-md px-3 py-2 text-[13.5px] transition-colors',
              active
                ? 'bg-white/10 font-medium text-white'
                : 'text-sage hover:bg-white/5 hover:text-white',
            )}
          >
            {/* Green means live and verified on the public site; here it marks
                where you actually are. */}
            <span
              className={cn(
                'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-accent transition-opacity',
                active ? 'opacity-100' : 'opacity-0',
              )}
              aria-hidden
            />
            <Icon className={cn('size-4 shrink-0', active ? 'text-accent' : 'text-sage/70')} />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.href === '/admin/approvals' && pending > 0 ? (
              <span className="nums shrink-0 rounded-full bg-warn-soft px-1.5 py-0.5 text-[11px] font-semibold text-warn">
                {pending}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBrand() {
  return (
    // The public site's lockup, unchanged, with the admin designation carried
    // by the label beneath it rather than by a different mark.
    <Link href="/admin" aria-label="ILS Admin — overview" className="block px-6 py-5">
      <Image src={logoLockupWhite} alt="" aria-hidden priority className="h-7 w-auto" />
      <span className="mt-2.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-sage/80">
        Admin · Internal
      </span>
    </Link>
  );
}

function SidebarFooter() {
  return (
    <div className="mt-auto px-6 py-5">
      <Link
        href="/"
        className="text-[12px] text-sage/70 underline underline-offset-2 transition-colors hover:text-accent"
      >
        View the public site →
      </Link>
    </div>
  );
}

/* -------------------------------------------------------------- top bar */

/**
 * Shows the signed-in account, not a fixture.
 *
 * The session carries only a username, so the display name and initials are
 * derived from it. `userById(CURRENT_USER_ID)` is still the identity the store
 * attributes audit entries to — those are demo fixtures, and wiring real
 * attribution needs the persistence layer this dashboard does not have yet.
 */
function UserMenu({ signedInAs }: { signedInAs: string | null }) {
  const fixture = userById(CURRENT_USER_ID);
  const name = signedInAs ?? fixture.name;
  const initials = (signedInAs ?? fixture.name)
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
  return (
    <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-action-soft text-[11px] font-semibold text-action-ink">
        {initials}
      </span>
      <span className="hidden min-w-0 sm:block">
        <span className="block text-[13px] font-medium leading-tight text-ink">
            {name}
        </span>
          <span className="block text-[11px] leading-tight text-muted">Signed in · Administrator</span>
      </span>
      <ChevronDown className="hidden size-3.5 text-muted sm:block" aria-hidden />
      <button
        type="button"
        onClick={async () => {
          await fetch('/api/admin/logout', { method: 'POST' });
          // Full navigation so the middleware re-evaluates without the cookie.
          window.location.assign('/admin/login');
        }}
        className="ml-1 rounded-md border border-rule px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-slate transition-colors hover:border-action hover:text-ink"
      >
        Sign out
      </button>
    </div>
  );
}

function TopBar({ onOpenMenu, signedInAs }: { onOpenMenu: () => void; signedInAs: string | null }) {
  const pending = usePendingCount();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-rule bg-card/85 px-4 backdrop-blur-md lg:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        className="grid size-9 place-items-center rounded-md text-slate transition-colors hover:bg-wash hover:text-ink lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-4.5" />
      </button>

      <div className="min-w-0 flex-1" />

      <Link
        href="/admin/approvals"
        className={cn(
          'flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors',
          pending > 0
            ? 'border-warn-ring bg-warn-soft text-warn hover:bg-[#f7e9cc]'
            : 'border-rule bg-card text-slate hover:bg-wash',
        )}
      >
        <ShieldCheck className="size-3.5" />
        <span className="hidden sm:inline">
          {pending > 0 ? 'Pending approvals' : 'Approvals clear'}
        </span>
        {pending > 0 ? (
          <span className="nums grid min-w-5 place-items-center rounded-full bg-warn px-1.5 text-[11px] font-semibold text-white">
            {pending}
          </span>
        ) : null}
      </Link>

      <div className="h-6 w-px bg-rule" aria-hidden />
      <UserMenu signedInAs={signedInAs} />
    </header>
  );
}

/* --------------------------------------------------------- demo ribbon */

function DemoRibbon() {
  return (
    <footer className="mt-auto shrink-0 border-t border-rule bg-wash/70">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 lg:px-6">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.11em] text-muted">
          <span className="size-1.5 rounded-full bg-warn/70" aria-hidden />
          Demo mode — sample data
        </p>
        <p className="text-[11px] text-muted">
          Not connected to SAM.gov. Changes are held in memory and reset on refresh.
        </p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------- the shell */

export function AdminShell({
  children,
  signedInAs = null,
}: {
  children: React.ReactNode;
  signedInAs?: string | null;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const pathname = usePathname();

  /* Close the mobile drawer on navigation — otherwise it covers the page the
     operator just asked for. */
  React.useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-forest lg:flex">
        <SidebarBrand />
        <NavLinks />
        <SidebarFooter />
      </aside>

      {/* Mobile drawer */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-forest/50 backdrop-blur-[2px]"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-forest shadow-2xl">
            <div className="flex items-start justify-between">
              <SidebarBrand />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="m-4 rounded-md p-1 text-sage transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close navigation"
              >
                <X className="size-4" />
              </button>
            </div>
            <NavLinks onNavigate={() => setMenuOpen(false)} />
            <SidebarFooter />
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-64">
        <TopBar onOpenMenu={() => setMenuOpen(true)} signedInAs={signedInAs} />
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1180px]">{children}</div>
        </main>
        <DemoRibbon />
      </div>
    </div>
  );
}

export { NAV as adminNav };
export function useIsPendingBadge() {
  return usePendingCount();
}

export function PendingBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <Badge tone="pending">{count} pending</Badge>;
}
