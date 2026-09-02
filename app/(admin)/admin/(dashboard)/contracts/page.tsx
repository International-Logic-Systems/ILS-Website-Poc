'use client';

/**
 * Contracts and Registrations — the SAM.gov / USAspending panel.
 *
 * The argument this page makes is that the site cannot go stale: the sync
 * timestamp is always this morning, the sync button always works, and when the
 * synced award disagrees with what the site publishes, the page says so instead
 * of quietly showing one of them.
 */

import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
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
  Mono,
  PageHeader,
} from '@/components/admin/ui/primitives';
import { RelativeTime } from '@/components/admin/ui/relative-time';
import { cn } from '@/lib/admin/cn';
import { EXPIRY_WARNING_DAYS } from '@/lib/admin/clock';
import { daysUntil, expiryPhrase, formatDate } from '@/lib/admin/format';
import { useAdminStore } from '@/lib/admin/store';
import type { Award } from '@/lib/admin/types';

function isExpiringSoon(iso: string): boolean {
  const d = daysUntil(iso);
  return d >= 0 && d <= EXPIRY_WARNING_DAYS;
}

function FactRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule-soft py-2 last:border-b-0">
      <dt className="text-[12.5px] text-slate">{label}</dt>
      <dd className="text-right text-[13px] font-medium text-ink">{children}</dd>
    </div>
  );
}

function AwardStatusBadge({ award }: { award: Award }) {
  if (award.status === 'Complete') return <Badge tone="draft">Complete</Badge>;
  if (award.status === 'Winding down') return <Badge tone="pending">Winding down</Badge>;
  if (isExpiringSoon(award.endDate)) return <Badge tone="pending">Expiring</Badge>;
  return <Badge tone="live">Active</Badge>;
}

export default function ContractsPage() {
  const entity = useAdminStore((s) => s.entity);
  const awards = useAdminStore((s) => s.awards);
  const records = useAdminStore((s) => s.records);
  const lastSyncedAt = useAdminStore((s) => s.lastSyncedAt);
  const syncing = useAdminStore((s) => s.syncing);
  const syncNow = useAdminStore((s) => s.syncNow);

  /* Everything inside the ninety-day window, registration and vehicles alike. */
  const expiring = React.useMemo(() => {
    const items: { label: string; date: string }[] = [];
    if (isExpiringSoon(entity.expirationDate)) {
      items.push({ label: 'SAM.gov entity registration', date: entity.expirationDate });
    }
    for (const a of awards) {
      if (a.status !== 'Complete' && isExpiringSoon(a.endDate)) {
        items.push({ label: a.vehicle, date: a.endDate });
      }
    }
    return items;
  }, [entity, awards]);

  /* The published GSA number against the awarded one. A disagreement here is
     the single most damaging thing on the public site, so it gets called out
     rather than left for someone to notice. */
  const mismatches = React.useMemo(() => {
    const out: { recordName: string; published: string; awarded: string }[] = [];
    for (const record of records.filter((r) => r.kind === 'vehicle')) {
      const published = record.values.contractNumber;
      if (!published) continue;
      const known = awards.some((a) => a.piid === published || a.parentPiid === published);
      if (!known) {
        /* Match on the agency instead, to name the award it should have been. */
        const candidate = awards.find(
          (a) => a.parentPiid === null && record.values.agency.includes(a.subAgency.split(',')[0]),
        );
        out.push({
          recordName: record.name,
          published,
          awarded: candidate?.piid ?? 'no matching award found',
        });
      }
    }
    return out;
  }, [records, awards]);

  const primaryNaics = entity.naics.find((n) => n.isPrimary);

  return (
    <>
      <PageHeader
        eyebrow="Synced from SAM.gov and USAspending"
        title="Contracts & Registrations"
        description="The entity registration and award history, mirrored from the systems a contracting officer would check. Nothing here is typed by hand."
        actions={
          <Button onClick={() => void syncNow()} disabled={syncing}>
            <RefreshCw className={cn(syncing && 'animate-spin')} />
            {syncing ? 'Syncing…' : 'Sync now'}
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-card border border-rule bg-card px-4 py-3">
        <span className="flex items-center gap-2 text-[13px] text-slate">
          <span
            className={cn(
              'size-2 rounded-full',
              syncing ? 'animate-pulse bg-warn' : 'bg-green',
            )}
            aria-hidden
          />
          Last synced from SAM.gov:
        </span>
        <span className="text-[13px] font-medium text-ink">
          <RelativeTime iso={lastSyncedAt} />
        </span>
        <span className="text-[12px] text-muted">
          Automatic overnight sync · manual sync available any time
        </span>
      </div>

      {expiring.length > 0 ? (
        <div className="mb-5 flex flex-wrap items-start gap-3 rounded-card border border-warn-ring bg-warn-soft px-4 py-3.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-warn">
              {expiring.length === 1
                ? 'One registration expires within 90 days'
                : `${expiring.length} items expire within 90 days`}
            </p>
            <ul className="mt-1 space-y-0.5">
              {expiring.map((item) => (
                <li key={item.label} className="text-[13px] text-warn">
                  {item.label} — expires {formatDate(item.date)} ({expiryPhrase(item.date)})
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-[12px] text-warn/80">
              A lapsed SAM.gov registration makes ILS ineligible for award until it is renewed, and
              renewal is not instant.
            </p>
          </div>
        </div>
      ) : null}

      {mismatches.length > 0 ? (
        <div className="mb-5 flex flex-wrap items-start gap-3 rounded-card border border-danger-ring bg-danger-soft px-4 py-3.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-danger">
              The public site publishes a contract number that does not match any award
            </p>
            {mismatches.map((m) => (
              <p key={m.recordName} className="mt-1 text-[13px] text-danger">
                {m.recordName} — site shows <Mono className="text-danger">{m.published}</Mono>, the
                awarded number is <Mono className="text-danger">{m.awarded}</Mono>
              </p>
            ))}
            <Link
              href="/admin/approvals"
              className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-danger underline underline-offset-2"
            >
              A correction is waiting in the approvals queue
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Entity registration */}
        <Card>
          <CardHeader>
            <div>
              <Eyebrow className="mb-1.5">Entity registration</Eyebrow>
              <CardTitle>{entity.legalBusinessName}</CardTitle>
            </div>
            <Badge tone={isExpiringSoon(entity.expirationDate) ? 'pending' : 'live'}>
              {isExpiringSoon(entity.expirationDate) ? 'Renewal due' : entity.registrationStatus}
            </Badge>
          </CardHeader>
          <CardBody>
            <dl>
              <FactRow label="Unique Entity ID (UEI)">
                <Mono>{entity.uei}</Mono>
              </FactRow>
              <FactRow label="CAGE code">
                <Mono>{entity.cageCode}</Mono>
              </FactRow>
              <FactRow label="Registration status">{entity.registrationStatus}</FactRow>
              <FactRow label="Expires">
                <span
                  className={cn(
                    isExpiringSoon(entity.expirationDate) ? 'text-warn' : 'text-ink',
                  )}
                >
                  {formatDate(entity.expirationDate)} · {expiryPhrase(entity.expirationDate)}
                </span>
              </FactRow>
              <FactRow label="Initially registered">
                {formatDate(entity.initialRegistrationDate)}
              </FactRow>
              <FactRow label="Purpose of registration">{entity.purposeOfRegistration}</FactRow>
              <FactRow label="Entity structure">{entity.entityStructure}</FactRow>
              <FactRow label="State of incorporation">{entity.stateOfIncorporation}</FactRow>
              <FactRow label="Exclusions (FAPIIS)">
                <span className="text-green">{entity.exclusionStatus}</span>
              </FactRow>
              <FactRow label="Physical address">
                <span className="font-normal text-slate">{entity.physicalAddress}</span>
              </FactRow>
            </dl>

            <div className="mt-4">
              <Eyebrow className="mb-2">NAICS codes</Eyebrow>
              <div className="space-y-1.5">
                {entity.naics.map((n) => (
                  <div
                    key={n.code}
                    className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-md border border-rule-soft bg-wash/50 px-3 py-2"
                  >
                    <Mono className="font-semibold">{n.code}</Mono>
                    {n.isPrimary ? <Badge tone="info">Primary</Badge> : null}
                    {n.isSmall ? <Badge tone="live">Small</Badge> : null}
                    <span className="w-full text-[12.5px] text-slate">{n.title}</span>
                    <span className="text-[11.5px] text-muted">{n.sizeStandard}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <Eyebrow className="mb-2">Product service codes</Eyebrow>
              <div className="flex flex-wrap gap-1.5">
                {entity.pscCodes.map((p) => (
                  <span
                    key={p.code}
                    title={p.title}
                    className="rounded border border-rule bg-card px-2 py-1 font-mono text-[11.5px] text-slate"
                  >
                    {p.code}
                  </span>
                ))}
              </div>
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-[11.5px] text-muted">
              <ExternalLink className="size-3" />
              Source: SAM.gov Entity Management · primary NAICS {primaryNaics?.code}
            </p>
          </CardBody>
        </Card>

        {/* Awards */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div>
              <Eyebrow className="mb-1.5">Awarded contracts and vehicles</Eyebrow>
              <CardTitle>{awards.length} awards on record</CardTitle>
            </div>
            <Badge tone="neutral">
              <Building2 className="size-3" />
              USAspending
            </Badge>
          </CardHeader>

          <div className="scroll-slim overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[13px]">
              <thead>
                <tr className="border-y border-rule bg-wash/50 text-left">
                  <th className="px-5 py-2 font-medium text-slate">Vehicle</th>
                  <th className="px-3 py-2 font-medium text-slate">Contract number</th>
                  <th className="px-3 py-2 font-medium text-slate">Agency</th>
                  <th className="px-3 py-2 font-medium text-slate">Period of performance</th>
                  <th className="px-5 py-2 font-medium text-slate">Status</th>
                </tr>
              </thead>
              <tbody>
                {awards.map((a) => (
                  <tr
                    key={a.id}
                    className={cn(
                      'border-b border-rule-soft align-top last:border-b-0',
                      a.status === 'Complete' && 'opacity-60',
                    )}
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink">{a.vehicle}</p>
                      <p className="mt-0.5 text-[11.5px] text-muted">
                        {a.awardType}
                        {a.parentPiid ? ` · under ${a.parentPiid}` : ''}
                      </p>
                      {a.source === 'customer' ? (
                        <p className="mt-1 text-[11px] text-muted">
                          Customer-supplied — not an appropriated award, never appears in USAspending
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <Mono>{a.piid}</Mono>
                      <p className="mt-0.5 text-[11.5px] text-muted">
                        {a.obligated} obligated
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-ink">{a.subAgency}</p>
                      <p className="mt-0.5 text-[11.5px] text-muted">{a.agency}</p>
                    </td>
                    <td className="nums px-3 py-3 text-slate">
                      {formatDate(a.startDate)}
                      <br />
                      {formatDate(a.endDate)}
                    </td>
                    <td className="px-5 py-3">
                      <AwardStatusBadge award={a} />
                      {a.setAside !== 'Not applicable' ? (
                        <p className="mt-1 text-[11px] text-muted">{a.setAside}</p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-rule bg-wash/40 px-5 py-3">
            <p className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <ShieldCheck className="size-3" />
              Awarded values are public record. Vehicle records published on the site are Tier 2 and
              require a second approver to change.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
