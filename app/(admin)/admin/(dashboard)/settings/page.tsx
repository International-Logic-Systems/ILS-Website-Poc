'use client';

/**
 * Settings — demo controls, the two-tier policy, and the full audit log.
 *
 * The tier table is here because it is the thing an executive audience asks
 * about after the approvals demo: not "how does it work" but "who decided what
 * goes in which tier". Having the answer on screen is worth more than any
 * setting a demo could plausibly need.
 */

import { AlertTriangle, RotateCcw, ShieldCheck, Zap } from 'lucide-react';
import * as React from 'react';
import { AnalyticsSettings } from '@/components/admin/analytics-settings';
import { Button } from '@/components/admin/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/admin/ui/dialog';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Eyebrow,
  PageHeader,
} from '@/components/admin/ui/primitives';
import { RelativeTime } from '@/components/admin/ui/relative-time';
import { cn } from '@/lib/admin/cn';
import { recordTypes } from '@/lib/admin/fixtures/records';
import { CURRENT_USER_ID, userById, users } from '@/lib/admin/fixtures/users';
import { useAdminStore } from '@/lib/admin/store';
import type { AuditAction } from '@/lib/admin/types';

const TIER1 = [
  { label: 'News posts', note: 'Announcements, releases, company news' },
  { label: 'Job openings', note: 'Every listing states its clearance level' },
  { label: 'Event notices', note: 'Industry days, conferences, open houses' },
];

const ACTION_TONE: Record<AuditAction, 'live' | 'pending' | 'danger' | 'info' | 'draft'> = {
  created: 'draft',
  published: 'live',
  unpublished: 'draft',
  proposed: 'pending',
  approved: 'live',
  rejected: 'danger',
  synced: 'info',
  rescored: 'info',
  reset: 'draft',
};

function ResetDialog() {
  const resetDemo = useAdminStore((s) => s.resetDemo);
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <RotateCcw />
        Reset demo data
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset all demo data?</DialogTitle>
            <DialogDescription>
              Every record, approval decision, published post and opportunity score returns to its
              opening state. Nothing is written anywhere, so this is safe to run mid-presentation.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <ul className="space-y-1.5 text-[13px] text-slate">
              <li>· The approvals queue goes back to four pending changes</li>
              <li>· Published posts return to their seeded state, drafts included</li>
              <li>· Tier 2 records revert, and the GSA schedule number is wrong again</li>
              <li>· Opportunity scores return to the precomputed values</li>
            </ul>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                resetDemo();
                setOpen(false);
              }}
            >
              <RotateCcw />
              Reset now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function SettingsPage() {
  const auditLog = useAdminStore((s) => s.auditLog);
  const [filter, setFilter] = React.useState<'all' | 'tier2' | 'tier1'>('all');

  const filtered = React.useMemo(() => {
    if (filter === 'tier2') return auditLog.filter((e) => e.recordId !== null);
    if (filter === 'tier1') return auditLog.filter((e) => e.action === 'published' || e.action === 'unpublished');
    return auditLog;
  }, [auditLog, filter]);

  const me = userById(CURRENT_USER_ID);

  return (
    <>
      <PageHeader
        eyebrow="Demo controls and policy"
        title="Settings"
        description="Website analytics, who can approve, what sits in which tier, and the complete audit trail."
        actions={<ResetDialog />}
      />

      {/* The only setting here that changes the public site, so it leads. */}
      <div className="mb-4">
        <AnalyticsSettings />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Signed in */}
        <Card>
          <CardHeader>
            <div>
              <Eyebrow className="mb-1.5">Signed in as</Eyebrow>
              <CardTitle>
                {me.name} — {me.role}
              </CardTitle>
            </div>
            <Badge tone="live">
              <ShieldCheck className="size-3" />
              Can approve
            </Badge>
          </CardHeader>
          <CardBody>
            <p className="mb-3 text-[13px] leading-relaxed text-slate">
              Approvals require a second person: the operator who proposed a change cannot be the
              one who approves it. Two of the six demo accounts hold approval rights.
            </p>
            <div className="space-y-1.5">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-md border border-rule-soft bg-wash/40 px-3 py-2"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-card text-[10px] font-semibold text-slate">
                    {u.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-ink">{u.name}</span>
                    <span className="block text-[11.5px] text-muted">{u.role}</span>
                  </span>
                  {u.canApprove ? (
                    <Badge tone="live">Approver</Badge>
                  ) : (
                    <Badge tone="draft">Editor</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Tier policy */}
        <Card>
          <CardHeader>
            <div>
              <Eyebrow className="mb-1.5">Publishing policy</Eyebrow>
              <CardTitle>What needs a second approver</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-green">
                <Zap className="size-3.5" />
                Tier 1 — publishes instantly
              </p>
              <div className="space-y-1">
                {TIER1.map((t) => (
                  <div key={t.label} className="rounded-md border border-green-ring bg-green-soft/40 px-3 py-2">
                    <p className="text-[13px] font-medium text-ink">{t.label}</p>
                    <p className="text-[11.5px] text-slate">{t.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-warn">
                <ShieldCheck className="size-3.5" />
                Tier 2 — second approver required
              </p>
              <div className="space-y-1">
                {recordTypes.map((t) => (
                  <div key={t.kind} className="rounded-md border border-warn-ring bg-warn-soft/40 px-3 py-2">
                    <p className="text-[13px] font-medium text-ink">{t.label}</p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-slate">{t.exposure}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="flex items-start gap-2 rounded-md border border-rule bg-wash/50 px-3 py-2.5 text-[12px] leading-relaxed text-slate">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-muted" />
              The test is not importance. It is whether a contracting officer could rely on the
              value to make an award decision, and what happens to ILS if it is wrong.
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Audit log */}
      <Card className="mt-4 overflow-hidden">
        <CardHeader>
          <div>
            <Eyebrow className="mb-1.5">Complete audit trail</Eyebrow>
            <CardTitle>{filtered.length} events</CardTitle>
          </div>
          <div className="flex rounded-md border border-rule bg-wash p-0.5">
            {(
              [
                ['all', 'All'],
                ['tier2', 'Tier 2 records'],
                ['tier1', 'Publishes'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  'rounded px-2.5 py-1 text-[12px] font-medium transition-colors',
                  filter === value ? 'bg-card text-ink shadow-sm' : 'text-slate hover:text-ink',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </CardHeader>
        <div className="scroll-slim max-h-[30rem] divide-y divide-rule-soft overflow-y-auto border-t border-rule-soft">
          {filtered.map((event) => (
            <div key={event.id} className="flex items-start gap-3 px-5 py-3">
              <Badge tone={ACTION_TONE[event.action]} className="mt-0.5 shrink-0 capitalize">
                {event.action}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-snug text-ink">{event.summary}</p>
                {event.detail ? (
                  <p className="mt-1 border-l-2 border-rule pl-2.5 text-[12px] leading-snug text-slate">
                    {event.detail}
                  </p>
                ) : null}
                <p className="mt-1 text-[11.5px] text-muted">
                  {userById(event.actorId).name} · <RelativeTime iso={event.at} />
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <p className="mt-4 text-[12px] leading-relaxed text-muted">
        This dashboard is a demonstration. Data is seeded from fixture files and held in memory —
        no database, no authentication, and nothing is written to disk. Refreshing the page restores
        the opening state.
      </p>
    </>
  );
}
