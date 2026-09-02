'use client';

/**
 * Overview.
 *
 * Built last and wired entirely to store state, so approving something in the
 * queue moves the count here, and publishing a post moves the month's total.
 * Nothing on this page is a static number.
 */

import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Target,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { Button } from '@/components/admin/ui/button';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Eyebrow,
  PageHeader,
  Separator,
} from '@/components/admin/ui/primitives';
import { RelativeTime } from '@/components/admin/ui/relative-time';
import { cn } from '@/lib/admin/cn';
import { EXPIRY_WARNING_DAYS } from '@/lib/admin/clock';
import { userById, userName } from '@/lib/admin/fixtures/users';
import { daysUntil, expiryPhrase, formatDate } from '@/lib/admin/format';
import { useAdminStore } from '@/lib/admin/store';
import type { AuditAction, Opportunity } from '@/lib/admin/types';

function scoreTone(score: number): string {
  if (score >= 85) return 'border-green-ring bg-green-soft text-green';
  if (score >= 70) return 'border-action-ring bg-action-soft text-action-ink';
  if (score >= 50) return 'border-warn-ring bg-warn-soft text-warn';
  return 'border-danger-ring bg-danger-soft text-danger';
}

function StatCard({
  label,
  value,
  hint,
  href,
  tone = 'neutral',
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  href: string;
  tone?: 'neutral' | 'warn' | 'good' | 'danger';
  icon: React.ComponentType<{ className?: string }>;
}) {
  const ring =
    tone === 'warn'
      ? 'border-warn-ring bg-warn-soft/50'
      : tone === 'good'
        ? 'border-green-ring bg-green-soft/40'
        : tone === 'danger'
          ? 'border-danger-ring bg-danger-soft/50'
          : 'border-rule bg-card';

  const accent =
    tone === 'warn'
      ? 'text-warn'
      : tone === 'good'
        ? 'text-green'
        : tone === 'danger'
          ? 'text-danger'
          : 'text-action';

  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col rounded-card border px-4 py-4 transition-colors hover:border-action-ring',
        ring,
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.11em] text-muted">
          {label}
        </span>
        <Icon className={cn('size-4', accent)} />
      </div>
      <span className={cn('nums text-3xl font-semibold leading-none', accent)}>{value}</span>
      <span className="mt-2 text-[12.5px] leading-snug text-slate">{hint}</span>
      <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-action opacity-0 transition-opacity group-hover:opacity-100">
        Open
        <ArrowRight className="size-3" />
      </span>
    </Link>
  );
}

const ACTION_ICON: Record<AuditAction, React.ComponentType<{ className?: string }>> = {
  created: FileText,
  published: CheckCircle2,
  unpublished: Clock,
  proposed: Clock,
  approved: ShieldCheck,
  rejected: XCircle,
  synced: RefreshCw,
  rescored: Target,
  reset: RefreshCw,
};

const ACTION_TONE: Record<AuditAction, string> = {
  created: 'text-slate',
  published: 'text-green',
  unpublished: 'text-muted',
  proposed: 'text-warn',
  approved: 'text-green',
  rejected: 'text-danger',
  synced: 'text-action',
  rescored: 'text-action',
  reset: 'text-muted',
};

function DigestRow({ opp, rank }: { opp: Opportunity; rank: number }) {
  return (
    <Link
      href={`/admin/opportunities?open=${opp.id}`}
      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-wash/50"
    >
      <span className="nums mt-0.5 w-4 shrink-0 text-[12px] font-medium text-muted">{rank}</span>
      <span
        className={cn(
          'nums mt-0.5 grid size-9 shrink-0 place-items-center rounded-md border text-[13px] font-semibold',
          scoreTone(opp.fitScore),
        )}
      >
        {opp.fitScore}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-medium leading-snug text-ink">{opp.title}</span>
        <span className="mt-0.5 block text-[12px] text-muted">
          {opp.subAgency} · {opp.setAside} · closes {formatDate(opp.responseDeadline)} (
          {daysUntil(opp.responseDeadline)} days)
        </span>
      </span>
    </Link>
  );
}

export default function OverviewPage() {
  const changeRequests = useAdminStore((s) => s.changeRequests);
  const content = useAdminStore((s) => s.content);
  const records = useAdminStore((s) => s.records);
  const entity = useAdminStore((s) => s.entity);
  const awards = useAdminStore((s) => s.awards);
  const opportunities = useAdminStore((s) => s.opportunities);
  const auditLog = useAdminStore((s) => s.auditLog);
  const lastSyncedAt = useAdminStore((s) => s.lastSyncedAt);

  const pending = changeRequests.filter((c) => c.status === 'pending');

  /* Rolling thirty days rather than the calendar month — a demo given on the
     2nd of a month should not show a card reading zero. */
  const publishedRecently = content.filter(
    (c) => c.publishedAt && Date.now() - new Date(c.publishedAt).getTime() < 30 * 86_400_000,
  ).length;

  /* Registration health spans the SAM registration, live awards, and any
     certification carrying an expiry date. */
  const health = React.useMemo(() => {
    const items: { label: string; date: string }[] = [];
    const consider = (label: string, date: string) => {
      if (!date) return;
      const d = daysUntil(date);
      if (d <= EXPIRY_WARNING_DAYS) items.push({ label, date });
    };
    consider('SAM.gov registration', entity.expirationDate);
    for (const a of awards) if (a.status !== 'Complete') consider(a.vehicle, a.endDate);
    for (const r of records) {
      if (r.kind === 'certification' || r.kind === 'designation') {
        consider(r.name, r.values.expirationDate ?? '');
      }
    }
    const expired = items.filter((i) => daysUntil(i.date) < 0);
    return { items, expired };
  }, [entity, awards, records]);

  const digest = React.useMemo(
    () => [...opportunities].sort((a, b) => b.fitScore - a.fitScore).slice(0, 3),
    [opportunities],
  );

  const feed = auditLog.slice(0, 9);

  return (
    <>
      <PageHeader
        eyebrow="Good morning"
        title="Overview"
        description="What needs a decision, what went live, and what the pipeline looks like this morning."
        actions={
          <span className="text-[12px] text-muted">
            SAM.gov synced <RelativeTime iso={lastSyncedAt} />
          </span>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending approvals"
          value={String(pending.length)}
          hint={
            pending.length
              ? `Oldest waiting ${Math.abs(daysUntil(pending[pending.length - 1].proposedAt))} days`
              : 'Queue is clear'
          }
          href="/admin/approvals"
          tone={pending.length > 0 ? 'warn' : 'good'}
          icon={pending.length > 0 ? Clock : ShieldCheck}
        />
        <StatCard
          label="Published this month"
          value={String(publishedRecently)}
          hint="News, jobs and events live in the last 30 days"
          href="/admin/content"
          icon={FileText}
        />
        <StatCard
          label="Registration health"
          value={health.expired.length ? 'Expired' : health.items.length ? 'Amber' : 'Green'}
          hint={
            health.expired.length
              ? `${health.expired.length} lapsed — ineligible for award`
              : health.items.length
                ? `${health.items.length} item${health.items.length === 1 ? '' : 's'} inside 90 days`
                : 'Nothing expiring within 90 days'
          }
          href="/admin/contracts"
          tone={health.expired.length ? 'danger' : health.items.length ? 'warn' : 'good'}
          icon={health.items.length ? ShieldAlert : ShieldCheck}
        />
        <StatCard
          label="Top opportunity"
          value={String(digest[0]?.fitScore ?? 0)}
          hint={digest[0] ? digest[0].subAgency : 'No open solicitations'}
          href="/admin/opportunities"
          tone="good"
          icon={Target}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        {/* Daily digest */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div>
              <Eyebrow className="mb-1.5">
                <Mail className="mr-1 inline size-3" />
                Daily digest · sent 06:15
              </Eyebrow>
              <CardTitle>Top three opportunities this morning</CardTitle>
            </div>
            <Badge tone="info">Every weekday</Badge>
          </CardHeader>
          <div className="divide-y divide-rule-soft border-y border-rule-soft">
            {digest.map((opp, i) => (
              <DigestRow key={opp.id} opp={opp} rank={i + 1} />
            ))}
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-[12px] text-muted">
              Scored against the ILS profile — NAICS, vehicles, past performance and clearances.
            </p>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/opportunities">
                All {opportunities.length}
                <ArrowUpRight />
              </Link>
            </Button>
          </div>
        </Card>

        {/* Recent activity */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div>
              <Eyebrow className="mb-1.5">From the audit trail</Eyebrow>
              <CardTitle>Recent activity</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/settings">
                Full log
                <ArrowUpRight />
              </Link>
            </Button>
          </CardHeader>
          <CardBody className="pt-0">
            <ol className="relative">
              {feed.map((event, i) => {
                const Icon = ACTION_ICON[event.action];
                return (
                  <li key={event.id} className="flex gap-3 py-2.5">
                    <span className="relative flex flex-col items-center">
                      <span
                        className={cn(
                          'grid size-6 shrink-0 place-items-center rounded-full border border-rule bg-card',
                          ACTION_TONE[event.action],
                        )}
                      >
                        <Icon className="size-3" />
                      </span>
                      {i < feed.length - 1 ? (
                        <span className="mt-1 w-px flex-1 bg-rule-soft" aria-hidden />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] leading-snug text-ink">
                        {event.summary}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-muted">
                        {userName(event.actorId)} · <RelativeTime iso={event.at} />
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </CardBody>
        </Card>
      </div>

      {/* Pending approvals preview */}
      {pending.length > 0 ? (
        <Card className="mt-4 overflow-hidden">
          <CardHeader>
            <div>
              <Eyebrow className="mb-1.5">Waiting on you</Eyebrow>
              <CardTitle>
                {pending.length} change{pending.length === 1 ? '' : 's'} need a second approver
              </CardTitle>
            </div>
            <Button size="sm" asChild>
              <Link href="/admin/approvals">
                Review queue
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <div className="border-t border-rule-soft">
            {pending.map((c, i) => (
              <React.Fragment key={c.id}>
                {i > 0 ? <Separator /> : null}
                <Link
                  href="/admin/approvals"
                  className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-wash/50"
                >
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-warn-soft text-[9px] font-semibold text-warn">
                    {userById(c.proposedBy).initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-medium text-ink">{c.recordName}</span>
                    <span className="mt-0.5 block text-[12px] text-muted">
                      {userName(c.proposedBy)} · <RelativeTime iso={c.proposedAt} />
                      {c.isNew ? ' · new record' : ''}
                    </span>
                  </span>
                  <Badge tone="pending">Pending</Badge>
                </Link>
              </React.Fragment>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Expiry detail */}
      {health.items.length > 0 ? (
        <Card className="mt-4 border-warn-ring bg-warn-soft/30">
          <CardBody className="pt-4">
            <p className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-warn">
              <ShieldAlert className="size-4" />
              Expiring within {EXPIRY_WARNING_DAYS} days
            </p>
            <ul className="space-y-1">
              {health.items.map((item) => (
                <li key={item.label} className="flex flex-wrap gap-x-2 text-[13px] text-warn">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-warn/80">
                    — {formatDate(item.date)} ({expiryPhrase(item.date)})
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}
    </>
  );
}
