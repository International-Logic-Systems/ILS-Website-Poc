'use client';

import { ChevronDown, Minus, Plus } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/admin/cn';
import { recordTypeByKind } from '@/lib/admin/fixtures/records';
import { formatDate, humanizeKey } from '@/lib/admin/format';
import type { ChangeRequest, FieldDef, GovRecord } from '@/lib/admin/types';
import { Markdown } from './ui/markdown';
import { Badge } from './ui/primitives';

/**
 * Side-by-side diff of a proposed change.
 *
 * Two rules make this readable rather than merely correct:
 *
 *   1. Changed fields come first and are the only ones expanded. Unchanged
 *      fields collapse into a single line, because a nine-field record where
 *      two fields moved should look like two changes, not nine.
 *   2. The current column is always on the left and always labelled "live on
 *      the site". The approver's job is to decide whether the right-hand side
 *      should replace it, and that framing has to survive being read from the
 *      back of a room.
 */

function valueOf(values: Record<string, string> | null, key: string): string {
  return values?.[key] ?? '';
}

function FieldValue({ field, value }: { field: FieldDef; value: string }) {
  if (!value) {
    return <p className="text-[13px] italic text-muted">Not set</p>;
  }
  if (field.type === 'markdown') {
    return <Markdown source={value} compact className="text-[13px]" />;
  }
  if (field.type === 'date') {
    return <p className="nums font-mono text-[13px] text-ink">{formatDate(value)}</p>;
  }
  if (field.type === 'code') {
    return <p className="nums font-mono text-[13px] text-ink">{value}</p>;
  }
  return <p className="text-[13px] leading-relaxed text-ink">{value}</p>;
}

function DiffRow({
  field,
  before,
  after,
  isNew,
}: {
  field: FieldDef;
  before: string;
  after: string;
  isNew: boolean;
}) {
  return (
    <div className="grid gap-px overflow-hidden rounded-md border border-warn-ring bg-warn-ring/40 sm:grid-cols-2">
      <div className="bg-card px-3.5 py-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Minus className="size-3 text-muted" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">
            Live on the site
          </span>
        </div>
        {isNew ? (
          <p className="text-[13px] italic text-muted">Not published — this record does not exist yet</p>
        ) : (
          <div className="opacity-70">
            <FieldValue field={field} value={before} />
          </div>
        )}
      </div>
      <div className="bg-green-soft/50 px-3.5 py-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Plus className="size-3 text-green" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-green">
            Proposed
          </span>
        </div>
        <FieldValue field={field} value={after} />
      </div>
    </div>
  );
}

export function DiffView({
  change,
  record,
}: {
  change: ChangeRequest;
  /** The live record, when it exists. Absent for a proposed new record. */
  record?: GovRecord;
}) {
  const [showUnchanged, setShowUnchanged] = React.useState(false);
  const typeDef = recordTypeByKind.get(change.recordKind);

  /* For a pending request the truth is the live record; for a decided one the
     record has already moved on, so the snapshot taken at proposal time is the
     only honest "before". */
  const before = React.useMemo(
    () => (change.status === 'pending' ? (record?.values ?? change.previous) : change.previous),
    [change, record],
  );

  const fields: FieldDef[] = React.useMemo(() => {
    if (typeDef) return typeDef.fields;
    /* Fall back to whatever keys the proposal carries, so an unknown record
       type still renders something legible rather than nothing. */
    return Object.keys(change.proposed).map((key) => ({
      key,
      label: humanizeKey(key),
      type: 'text' as const,
    }));
  }, [typeDef, change.proposed]);

  const { changed, unchanged } = React.useMemo(() => {
    const c: FieldDef[] = [];
    const u: FieldDef[] = [];
    for (const field of fields) {
      const a = valueOf(before, field.key);
      const b = valueOf(change.proposed, field.key);
      if (change.isNew ? b !== '' : a !== b) c.push(field);
      else u.push(field);
    }
    return { changed: c, unchanged: u };
  }, [fields, before, change]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="pending">
          {changed.length} field{changed.length === 1 ? '' : 's'} changed
        </Badge>
        {unchanged.length ? (
          <span className="text-[12px] text-muted">{unchanged.length} unchanged</span>
        ) : null}
        {change.isNew ? <Badge tone="info">New record</Badge> : null}
      </div>

      {changed.map((field) => (
        <div key={field.key}>
          <p className="mb-1.5 text-[12px] font-medium text-slate">{field.label}</p>
          <DiffRow
            field={field}
            before={valueOf(before, field.key)}
            after={valueOf(change.proposed, field.key)}
            isNew={change.isNew}
          />
        </div>
      ))}

      {unchanged.length > 0 ? (
        <div className="rounded-md border border-rule bg-card">
          <button
            type="button"
            onClick={() => setShowUnchanged((v) => !v)}
            className="flex w-full items-center justify-between px-3.5 py-2.5 text-left"
          >
            <span className="text-[12.5px] text-slate">
              {unchanged.length} unchanged field{unchanged.length === 1 ? '' : 's'}
            </span>
            <ChevronDown
              className={cn(
                'size-4 text-muted transition-transform',
                showUnchanged && 'rotate-180',
              )}
            />
          </button>
          {showUnchanged ? (
            <div className="space-y-3 border-t border-rule-soft px-3.5 py-3">
              {unchanged.map((field) => (
                <div key={field.key}>
                  <p className="mb-1 text-[11.5px] font-medium text-muted">{field.label}</p>
                  <div className="opacity-70">
                    <FieldValue field={field} value={valueOf(change.proposed, field.key)} />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
