'use client';

/**
 * Opportunity Fit Scorer.
 *
 * Scores are precomputed in the fixtures so the page is instant with no
 * network. "Rescore with AI" calls a route handler which uses the Anthropic
 * API when a key is present and simulates when it is not — either way the
 * button works and says which one happened.
 *
 * The detail drawer, not a separate route, so the ranked list stays on screen
 * behind it. Losing the list costs the audience their place.
 */

import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Check,
  CircleDashed,
  FileText,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/admin/ui/button';
import {
  Dialog,
  DialogBody,
  DialogHeader,
  DialogTitle,
  DrawerContent,
} from '@/components/admin/ui/dialog';
import { Markdown } from '@/components/admin/ui/markdown';
import {
  Badge,
  Card,
  Eyebrow,
  Mono,
  PageHeader,
  Separator,
} from '@/components/admin/ui/primitives';
import { RelativeTime } from '@/components/admin/ui/relative-time';
import { cn } from '@/lib/admin/cn';
import { captureBriefFor } from '@/lib/admin/fixtures';
import { userName } from '@/lib/admin/fixtures/users';
import { daysUntil, formatDate } from '@/lib/admin/format';
import { useAdminStore } from '@/lib/admin/store';
import type { Opportunity, RequirementState } from '@/lib/admin/types';

/* --------------------------------------------------------------- pieces */

function scoreClasses(score: number): string {
  if (score >= 85) return 'border-green-ring bg-green-soft text-green';
  if (score >= 70) return 'border-action-ring bg-action-soft text-action-ink';
  if (score >= 50) return 'border-warn-ring bg-warn-soft text-warn';
  return 'border-danger-ring bg-danger-soft text-danger';
}

function scoreLabel(score: number): string {
  if (score >= 85) return 'Strong fit';
  if (score >= 70) return 'Credible bid';
  if (score >= 50) return 'Partner needed';
  return 'Hard exclusion';
}

function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'md' | 'lg' }) {
  return (
    <span
      className={cn(
        'nums grid shrink-0 place-items-center rounded-md border font-semibold',
        scoreClasses(score),
        size === 'lg' ? 'size-14 text-xl' : 'size-11 text-[15px]',
      )}
    >
      {score}
    </span>
  );
}

const REQ_ICON: Record<RequirementState, React.ComponentType<{ className?: string }>> = {
  met: Check,
  partial: CircleDashed,
  gap: X,
};

const REQ_TONE: Record<RequirementState, string> = {
  met: 'text-green',
  partial: 'text-warn',
  gap: 'text-danger',
};

function DeadlineChip({ iso }: { iso: string }) {
  const days = daysUntil(iso);
  const urgent = days <= 14;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        urgent ? 'border-warn-ring bg-warn-soft text-warn' : 'border-rule bg-card text-slate',
      )}
    >
      <CalendarClock className="size-3" />
      {days} days · {formatDate(iso)}
    </span>
  );
}

/* ---------------------------------------------------------- the drawer */

function CaptureBriefDialog({
  opportunity,
  open,
  onOpenChange,
}: {
  opportunity: Opportunity;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const brief = captureBriefFor(opportunity.id);
  if (!brief) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-3xl">
        <DialogHeader>
          <Eyebrow className="mb-1.5">Capture brief · one page</Eyebrow>
          <DialogTitle>{opportunity.title}</DialogTitle>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Badge tone="live">{brief.bidRecommendation}</Badge>
            <Badge tone="info">{brief.confidence}</Badge>
            <span className="text-[12px] text-muted">
              Prepared by {userName(brief.preparedBy)} · <RelativeTime iso={brief.preparedAt} />
            </span>
          </div>
        </DialogHeader>
        <DialogBody className="space-y-5">
          {brief.sections.map((section) => (
            <section key={section.heading}>
              <h3 className="mb-1.5 text-[13px] font-semibold uppercase tracking-wide text-action-ink">
                {section.heading}
              </h3>
              <Markdown source={section.body} />
            </section>
          ))}
        </DialogBody>
      </DrawerContent>
    </Dialog>
  );
}

function OpportunityDrawer({
  opportunity,
  open,
  onOpenChange,
}: {
  opportunity: Opportunity | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const applyRescore = useAdminStore((s) => s.applyRescore);
  const toast = useAdminStore((s) => s.toast);
  const [rescoring, setRescoring] = React.useState(false);
  const [briefOpen, setBriefOpen] = React.useState(false);

  if (!opportunity) return null;

  const brief = captureBriefFor(opportunity.id);
  const met = opportunity.requirements.filter((r) => r.state === 'met').length;
  const gaps = opportunity.requirements.filter((r) => r.state === 'gap').length;

  async function rescore() {
    if (!opportunity) return;
    setRescoring(true);
    try {
      const res = await fetch('/api/rescore', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: opportunity.title,
          agency: opportunity.agency,
          subAgency: opportunity.subAgency,
          naics: opportunity.naics,
          setAside: opportunity.setAside,
          route: opportunity.route,
          summary: opportunity.summary,
          responseDeadline: opportunity.responseDeadline,
          currentScore: opportunity.fitScore,
        }),
      });
      const data = (await res.json()) as {
        fitScore: number;
        rationale: string;
        source: 'anthropic' | 'simulated';
      };
      applyRescore(opportunity.id, {
        fitScore: data.fitScore,
        rationale: data.rationale,
        by: data.source,
      });
      toast({
        title: data.source === 'anthropic' ? 'Rescored by Claude' : 'Rescored (simulated)',
        body: `${opportunity.title.slice(0, 60)} — now ${data.fitScore}`,
        tone: 'info',
      });
    } catch {
      toast({ title: 'Rescore failed', body: 'The scoring service did not respond.', tone: 'danger' });
    } finally {
      setRescoring(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DialogHeader>
            <Eyebrow className="mb-1.5">
              {opportunity.noticeType} · <Mono className="text-[11px]">{opportunity.noticeId}</Mono>
            </Eyebrow>
            <DialogTitle className="pr-4">{opportunity.title}</DialogTitle>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <Badge tone="neutral">
                <Building2 className="size-3" />
                {opportunity.subAgency}
              </Badge>
              <DeadlineChip iso={opportunity.responseDeadline} />
            </div>
          </DialogHeader>

          <DialogBody className="space-y-5">
            {/* Score */}
            <div className="flex items-start gap-4 rounded-card border border-rule bg-card px-4 py-4">
              <ScoreBadge score={opportunity.fitScore} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13.5px] font-semibold text-ink">
                    {scoreLabel(opportunity.fitScore)}
                  </p>
                  {opportunity.rescoredBy ? (
                    <Badge tone={opportunity.rescoredBy === 'anthropic' ? 'info' : 'draft'}>
                      {opportunity.rescoredBy === 'anthropic' ? 'Rescored by Claude' : 'Simulated'}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate">
                  {opportunity.rationale}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => void rescore()}
                  disabled={rescoring}
                >
                  {rescoring ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {rescoring ? 'Scoring…' : 'Rescore with AI'}
                </Button>
              </div>
            </div>

            {/* Facts */}
            <div className="grid gap-x-4 gap-y-2.5 rounded-card border border-rule bg-card px-4 py-4 sm:grid-cols-2">
              {(
                [
                  ['Solicitation number', <Mono key="s">{opportunity.solicitationNumber}</Mono>],
                  ['NAICS', `${opportunity.naics} — ${opportunity.naicsTitle}`],
                  ['Set-aside', opportunity.setAside],
                  ['Ordering route', opportunity.route],
                  ['Place of performance', opportunity.placeOfPerformance],
                  ['Estimated value', opportunity.estimatedValue],
                  ['Posted', formatDate(opportunity.postedDate)],
                  ['Response due', formatDate(opportunity.responseDeadline)],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">
                    {label}
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink">{value}</p>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div>
              <h3 className="mb-1.5 text-[13px] font-semibold uppercase tracking-wide text-slate">
                Summary
              </h3>
              <p className="text-[13px] leading-relaxed text-slate">{opportunity.summary}</p>
            </div>

            {/* Requirements */}
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-slate">
                  Key requirements
                </h3>
                <Badge tone="live">{met} met</Badge>
                {gaps > 0 ? <Badge tone="danger">{gaps} gap{gaps === 1 ? '' : 's'}</Badge> : null}
              </div>
              <Card className="divide-y divide-rule-soft overflow-hidden">
                {opportunity.requirements.map((req) => {
                  const Icon = REQ_ICON[req.state];
                  return (
                    <div key={req.label} className="flex items-start gap-3 px-4 py-3">
                      <Icon className={cn('mt-0.5 size-4 shrink-0', REQ_TONE[req.state])} />
                      <div className="min-w-0">
                        <p
                          className={cn(
                            'text-[13px] font-medium',
                            req.state === 'gap' ? 'text-danger' : 'text-ink',
                          )}
                        >
                          {req.label}
                        </p>
                        <p className="mt-0.5 text-[12.5px] leading-snug text-slate">{req.note}</p>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>

            {brief ? (
              <div className="rounded-card border border-action-ring bg-action-soft/50 px-4 py-4">
                <p className="text-[13.5px] font-semibold text-action-ink">
                  A capture brief is ready for this opportunity
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-slate">
                  One page: why ILS wins, where it is exposed, capture actions with owners and
                  dates, teaming and pricing posture, and a bid recommendation.
                </p>
                <Button className="mt-3" onClick={() => setBriefOpen(true)}>
                  <FileText />
                  Draft capture brief
                </Button>
              </div>
            ) : null}
          </DialogBody>
        </DrawerContent>
      </Dialog>

      <CaptureBriefDialog
        opportunity={opportunity}
        open={briefOpen}
        onOpenChange={setBriefOpen}
      />
    </>
  );
}

/* ------------------------------------------------------------ the page */

function OpportunitiesInner() {
  const opportunities = useAdminStore((s) => s.opportunities);
  const params = useSearchParams();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);

  /* Deep link from the Overview digest. */
  React.useEffect(() => {
    const requested = params.get('open');
    if (requested) {
      setSelectedId(requested);
      setOpen(true);
    }
  }, [params]);

  const ranked = React.useMemo(
    () => [...opportunities].sort((a, b) => b.fitScore - a.fitScore),
    [opportunities],
  );

  const selected = ranked.find((o) => o.id === selectedId) ?? null;
  const strong = ranked.filter((o) => o.fitScore >= 85).length;
  const excluded = ranked.filter((o) => o.fitScore < 50).length;

  return (
    <>
      <PageHeader
        eyebrow="Scored against the ILS capability profile"
        title="Opportunity Scorer"
        description="Open solicitations ranked by fit. The score weights eligibility gates first — set-aside, vehicle, clearance — then NAICS and past performance, then capability."
        actions={
          <div className="flex items-center gap-2">
            <Badge tone="live">{strong} strong</Badge>
            <Badge tone="danger">{excluded} excluded</Badge>
          </div>
        }
      />

      <Card className="overflow-hidden">
        {ranked.map((opp, i) => (
          <React.Fragment key={opp.id}>
            {i > 0 ? <Separator /> : null}
            <button
              type="button"
              onClick={() => {
                setSelectedId(opp.id);
                setOpen(true);
              }}
              className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-wash/50"
            >
              <span className="nums w-5 shrink-0 pt-3 text-[12px] font-medium text-muted">
                {i + 1}
              </span>
              <ScoreBadge score={opp.fitScore} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[14.5px] font-medium leading-snug text-ink">
                    {opp.title}
                  </span>
                  {opp.fitScore < 50 ? (
                    <Badge tone="danger">
                      <AlertTriangle className="size-3" />
                      {scoreLabel(opp.fitScore)}
                    </Badge>
                  ) : null}
                  {opp.rescoredBy ? <Badge tone="info">Rescored</Badge> : null}
                </span>
                <span className="mt-1 block text-[12.5px] text-muted">
                  {opp.subAgency} · NAICS {opp.naics} · {opp.setAside} · {opp.noticeType}
                </span>
                <span className="mt-1.5 block max-w-3xl text-[13px] leading-relaxed text-slate">
                  {opp.rationale}
                </span>
                <span className="mt-2 flex flex-wrap items-center gap-2">
                  <DeadlineChip iso={opp.responseDeadline} />
                  <span className="text-[11.5px] text-muted">{opp.estimatedValue}</span>
                </span>
              </span>
            </button>
          </React.Fragment>
        ))}
      </Card>

      <OpportunityDrawer opportunity={selected} open={open} onOpenChange={setOpen} />
    </>
  );
}

export default function OpportunitiesPage() {
  /* useSearchParams needs a Suspense boundary above it. */
  return (
    <React.Suspense fallback={<PageHeader title="Opportunity Scorer" />}>
      <OpportunitiesInner />
    </React.Suspense>
  );
}
