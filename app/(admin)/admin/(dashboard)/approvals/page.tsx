'use client';

/**
 * Tier 2 — second approval required.
 *
 * Everything on this page is slower than it needs to be, deliberately. A
 * confirm dialog on approve, a mandatory comment on reject, the exposure line
 * printed where it cannot be scrolled past. The friction is the product.
 */

import { AlertTriangle, Check, Clock, ShieldCheck, UserCheck, X } from 'lucide-react';
import * as React from 'react';
import { DiffView } from '@/components/admin/diff-view';
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
  EmptyState,
  Field,
  PageHeader,
  Textarea,
} from '@/components/admin/ui/primitives';
import { RelativeTime } from '@/components/admin/ui/relative-time';
import { cn } from '@/lib/admin/cn';
import { recordTypeByKind } from '@/lib/admin/fixtures/records';
import { CURRENT_USER_ID, userById, userName } from '@/lib/admin/fixtures/users';
import { useAdminStore } from '@/lib/admin/store';
import type { ChangeRequest } from '@/lib/admin/types';

function Meta({ change }: { change: ChangeRequest }) {
  const proposer = userById(change.proposedBy);
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted">
      <span className="grid size-5 place-items-center rounded-full bg-wash text-[9px] font-semibold text-slate">
        {proposer.initials}
      </span>
      <span className="text-slate">{proposer.name}</span>
      <span>· {proposer.role}</span>
      <span aria-hidden>·</span>
      <RelativeTime iso={change.proposedAt} />
    </div>
  );
}

function DecisionDialogs({
  change,
  mode,
  onClose,
}: {
  change: ChangeRequest;
  mode: 'approve' | 'reject' | null;
  onClose: () => void;
}) {
  const approve = useAdminStore((s) => s.approveChange);
  const reject = useAdminStore((s) => s.rejectChange);
  const [comment, setComment] = React.useState('');

  React.useEffect(() => setComment(''), [mode, change.id]);

  const approver = userById(CURRENT_USER_ID);

  return (
    <>
      <Dialog open={mode === 'approve'} onOpenChange={(o) => !o && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve and publish this change?</DialogTitle>
            <DialogDescription>
              This replaces the live value on the public site immediately, and records you as the
              second approver.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="rounded-md border border-warn-ring bg-warn-soft px-3.5 py-3">
              <p className="mb-1 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-warn">
                <AlertTriangle className="size-3" />
                What this record affects
              </p>
              <p className="text-[13px] leading-relaxed text-warn">{change.exposure}</p>
            </div>
            <div className="rounded-md border border-rule bg-wash/60 px-3.5 py-3 text-[13px]">
              <p className="text-slate">
                <span className="font-medium text-ink">{change.recordName}</span>
              </p>
              <p className="mt-1 text-muted">
                Proposed by {userName(change.proposedBy)} · approving as{' '}
                <span className="font-medium text-ink">{approver.name}</span>
              </p>
            </div>
            <Field label="Approval note" help="Optional. Recorded in the audit trail.">
              <Textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What you checked it against."
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="approve"
              onClick={() => {
                approve(change.id, comment);
                onClose();
              }}
            >
              <Check />
              Approve and publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mode === 'reject'} onOpenChange={(o) => !o && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this change</DialogTitle>
            <DialogDescription>
              The live value stays as it is. Your reason goes back to the editor and into the audit
              trail — a rejection with no reason just gets resubmitted.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Reason for rejection" help="Required.">
              <Textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What is wrong, and what would make it approvable."
                autoFocus
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={comment.trim().length < 3}
              onClick={() => {
                reject(change.id, comment);
                onClose();
              }}
            >
              <X />
              Reject with comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PendingCard({ change }: { change: ChangeRequest }) {
  const record = useAdminStore((s) => s.records.find((r) => r.id === change.recordId));
  const [mode, setMode] = React.useState<'approve' | 'reject' | null>(null);
  const typeDef = recordTypeByKind.get(change.recordKind);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rule bg-wash/40 px-5 py-4">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{typeDef?.singular ?? change.recordKind}</Badge>
            <Badge tone="pending">
              <Clock className="size-3" />
              Pending approval
            </Badge>
            <Badge tone="info">
              <UserCheck className="size-3" />
              Requires second approver
            </Badge>
          </div>
          <h2 className="text-[15px] font-semibold text-ink">{change.recordName}</h2>
          <div className="mt-1.5">
            <Meta change={change} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setMode('reject')}>
            <X />
            Reject
          </Button>
          <Button variant="approve" size="sm" onClick={() => setMode('approve')}>
            <Check />
            Approve
          </Button>
        </div>
      </div>

      <CardBody className="space-y-4 pt-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-rule bg-card px-3.5 py-3">
            <p className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">
              Why this change
            </p>
            <p className="text-[13px] leading-relaxed text-slate">{change.rationale}</p>
          </div>
          <div className="rounded-md border border-warn-ring bg-warn-soft px-3.5 py-3">
            <p className="mb-1 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-warn">
              <AlertTriangle className="size-3" />
              Exposure if wrong
            </p>
            <p className="text-[13px] leading-relaxed text-warn">{change.exposure}</p>
          </div>
        </div>

        <DiffView change={change} record={record} />
      </CardBody>

      <DecisionDialogs change={change} mode={mode} onClose={() => setMode(null)} />
    </Card>
  );
}

function DecidedRow({ change }: { change: ChangeRequest }) {
  const [open, setOpen] = React.useState(false);
  const approved = change.status === 'approved';

  return (
    <div className="px-5 py-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={approved ? 'live' : 'danger'}>
              {approved ? <Check className="size-3" /> : <X className="size-3" />}
              {approved ? 'Approved' : 'Rejected'}
            </Badge>
            <span className="text-[13.5px] font-medium text-ink">{change.recordName}</span>
          </div>
          <p className="mt-1 text-[12px] text-muted">
            Proposed by {userName(change.proposedBy)} ·{' '}
            {approved ? 'approved' : 'rejected'} by {userName(change.decidedBy ?? '')} ·{' '}
            {change.decidedAt ? <RelativeTime iso={change.decidedAt} /> : null}
          </p>
          {change.decisionComment ? (
            <p
              className={cn(
                'mt-2 border-l-2 pl-3 text-[12.5px] leading-relaxed',
                approved ? 'border-green-ring text-slate' : 'border-danger-ring text-danger',
              )}
            >
              {change.decisionComment}
            </p>
          ) : null}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          View diff
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{change.recordName}</DialogTitle>
            <DialogDescription>
              {approved
                ? 'This change was approved and applied.'
                : 'This change was rejected. The live value never changed.'}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <DiffView change={change} />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ApprovalsPage() {
  const changeRequests = useAdminStore((s) => s.changeRequests);

  const pending = changeRequests.filter((c) => c.status === 'pending');
  const decided = changeRequests
    .filter((c) => c.status !== 'pending')
    .sort((a, b) => (b.decidedAt ?? '').localeCompare(a.decidedAt ?? ''));

  return (
    <>
      <PageHeader
        eyebrow="Tier 2 · Second approver required"
        title="Approvals"
        description="Contract vehicles, certifications, socio-economic designations, client references and leadership bios. A contracting officer can rely on every one of these, so none of them change without a second pair of eyes."
        actions={
          pending.length > 0 ? (
            <Badge tone="pending">
              <Clock className="size-3" />
              {pending.length} awaiting decision
            </Badge>
          ) : (
            <Badge tone="live">
              <ShieldCheck className="size-3" />
              Queue clear
            </Badge>
          )
        }
      />

      {pending.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="size-7" />}
          title="Nothing waiting for approval"
          body="Every proposed change to a Tier 2 record has been decided. New proposals land here the moment an editor submits one."
        />
      ) : (
        <div className="space-y-4">
          {pending.map((c) => (
            <PendingCard key={c.id} change={c} />
          ))}
        </div>
      )}

      {decided.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-slate">
            Decided
          </h2>
          <Card className="divide-y divide-rule-soft overflow-hidden">
            {decided.map((c) => (
              <DecidedRow key={c.id} change={c} />
            ))}
          </Card>
        </section>
      ) : null}
    </>
  );
}
