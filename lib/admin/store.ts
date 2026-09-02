'use client';

/**
 * The in-memory store.
 *
 * No database, no persistence. Everything starts from the fixture seed and
 * lives in memory for the length of the session, which is exactly what a demo
 * needs: mutations feel real, and a refresh puts the stage back the way it was.
 *
 * The two-tier rule is enforced here rather than in the components, so there is
 * no route through the UI that publishes a Tier 2 record without an approval.
 * `publishContent` writes straight to the item. `proposeChange` never touches
 * the record — only `approveChange` does.
 */

import { create } from 'zustand';
import { syncPublished } from './sync';
import { samClient } from '../sam';
import { createSeedState, type SeedState } from './fixtures';
import { CURRENT_USER_ID, userName } from './fixtures/users';
import { recordTypeByKind } from './fixtures/records';
import type {
  AuditAction,
  AuditEvent,
  ChangeRequest,
  ContentItem,
  GovRecord,
  Opportunity,
  RecordKind,
} from './types';

export type ToastTone = 'published' | 'pending' | 'approved' | 'rejected' | 'info' | 'danger';

export type Toast = {
  id: string;
  title: string;
  body?: string;
  tone: ToastTone;
};

/** Monotonic ids. Only ever called from a user action, so never during SSR. */
let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

function now(): string {
  return new Date().toISOString();
}

type Actions = {
  /* ---- tier 1: instant ---- */
  saveContent(item: ContentItem): void;
  publishContent(id: string): void;
  unpublishContent(id: string): void;
  deleteContent(id: string): void;

  /* ---- tier 2: gated ---- */
  proposeChange(input: {
    recordId: string;
    recordKind: RecordKind;
    recordName: string;
    isNew: boolean;
    proposed: Record<string, string>;
    rationale: string;
  }): void;
  approveChange(id: string, comment?: string): void;
  rejectChange(id: string, comment: string): void;

  /* ---- sam.gov ---- */
  syncNow(): Promise<void>;

  /* ---- scorer ---- */
  applyRescore(id: string, next: { fitScore: number; rationale: string; by: 'anthropic' | 'simulated' }): void;

  /* ---- demo controls ---- */
  resetDemo(): void;

  /* ---- toasts ---- */
  toast(t: Omit<Toast, 'id'>): void;
  dismissToast(id: string): void;
};

export type AdminStore = SeedState & {
  syncing: boolean;
  toasts: Toast[];
  /** Bumped on reset so forms holding local draft state remount. */
  generation: number;
} & Actions;

function auditEvent(
  action: AuditAction,
  summary: string,
  extra: Partial<AuditEvent> = {},
): AuditEvent {
  return {
    id: nextId('au'),
    at: now(),
    actorId: CURRENT_USER_ID,
    action,
    recordId: null,
    recordKind: null,
    changeRequestId: null,
    summary,
    detail: null,
    ...extra,
  };
}

const KIND_NOUN: Record<ContentItem['kind'], string> = {
  news: 'news post',
  job: 'job opening',
  event: 'event notice',
};

export const useAdminStore = create<AdminStore>((set, get) => ({
  ...createSeedState(),
  syncing: false,
  toasts: [],
  generation: 0,

  /* ------------------------------------------------------------ tier 1 */

  saveContent(item) {
    set((s) => {
      const exists = s.content.some((c) => c.id === item.id);
      const stamped = { ...item, updatedAt: now() };
      return {
        content: exists
          ? s.content.map((c) => (c.id === item.id ? stamped : c))
          : [{ ...stamped, createdAt: now() }, ...s.content],
      };
    });
    // Editing something already live is itself a publish.
    if (item.status === 'published') void syncPublished(get().content);
  },

  publishContent(id) {
    const item = get().content.find((c) => c.id === id);
    if (!item) return;
    const at = now();
    set((s) => ({
      content: s.content.map((c) =>
        c.id === id ? { ...c, status: 'published', publishedAt: at, updatedAt: at } : c,
      ),
      auditLog: [
        auditEvent('published', `Published ${KIND_NOUN[item.kind]} “${item.title}”`),
        ...s.auditLog,
      ],
    }));
    void syncPublished(get().content);
    get().toast({
      title: 'Published to the website',
      body: item.title,
      tone: 'published',
    });
  },

  unpublishContent(id) {
    const item = get().content.find((c) => c.id === id);
    if (!item) return;
    set((s) => ({
      content: s.content.map((c) =>
        c.id === id ? { ...c, status: 'draft', publishedAt: null, updatedAt: now() } : c,
      ),
      auditLog: [
        auditEvent('unpublished', `Returned ${KIND_NOUN[item.kind]} “${item.title}” to draft`),
        ...s.auditLog,
      ],
    }));
    void syncPublished(get().content);
    get().toast({ title: 'Removed from the website', body: item.title, tone: 'info' });
  },

  deleteContent(id) {
    const item = get().content.find((c) => c.id === id);
    if (!item) return;
    set((s) => ({ content: s.content.filter((c) => c.id !== id) }));
    // A deleted item that was live has to leave the site too.
    if (item.status === 'published') void syncPublished(get().content);
    get().toast({ title: 'Deleted', body: item.title, tone: 'info' });
  },

  /* ------------------------------------------------------------ tier 2 */

  proposeChange({ recordId, recordKind, recordName, isNew, proposed, rationale }) {
    const record = get().records.find((r) => r.id === recordId) ?? null;
    const typeDef = recordTypeByKind.get(recordKind);
    const cr: ChangeRequest = {
      id: nextId('cr'),
      recordId,
      recordKind,
      recordName,
      isNew,
      previous: isNew ? null : (record?.values ?? null),
      proposed,
      proposedBy: CURRENT_USER_ID,
      proposedAt: now(),
      rationale,
      exposure: typeDef?.exposure ?? 'Requires a second approver before it can be published.',
      status: 'pending',
      decidedBy: null,
      decidedAt: null,
      decisionComment: null,
    };

    set((s) => ({
      changeRequests: [cr, ...s.changeRequests],
      auditLog: [
        auditEvent(
          'proposed',
          `Proposed ${isNew ? 'creation of' : 'a change to'} ${(
            typeDef?.singular ?? 'record'
          ).toLowerCase()} “${recordName}”`,
          { recordId, recordKind, changeRequestId: cr.id, detail: rationale },
        ),
        ...s.auditLog,
      ],
    }));

    get().toast({
      title: 'Sent for approval',
      body: 'The live value is unchanged until a second approver applies it.',
      tone: 'pending',
    });
  },

  approveChange(id, comment) {
    const cr = get().changeRequests.find((c) => c.id === id);
    if (!cr || cr.status !== 'pending') return;
    const at = now();

    set((s) => {
      const exists = s.records.some((r) => r.id === cr.recordId);
      const records: GovRecord[] = exists
        ? s.records.map((r) =>
            r.id === cr.recordId
              ? {
                  ...r,
                  values: { ...cr.proposed },
                  updatedAt: at,
                  lastApprovedBy: CURRENT_USER_ID,
                  lastApprovedAt: at,
                }
              : r,
          )
        : [
            ...s.records,
            {
              id: cr.recordId,
              kind: cr.recordKind,
              name: cr.recordName,
              values: { ...cr.proposed },
              createdAt: at,
              updatedAt: at,
              lastApprovedBy: CURRENT_USER_ID,
              lastApprovedAt: at,
            },
          ];

      return {
        records,
        changeRequests: s.changeRequests.map((c) =>
          c.id === id
            ? {
                ...c,
                status: 'approved' as const,
                decidedBy: CURRENT_USER_ID,
                decidedAt: at,
                decisionComment: comment?.trim() ? comment.trim() : null,
              }
            : c,
        ),
        auditLog: [
          auditEvent('approved', `Approved and applied the change to “${cr.recordName}”`, {
            recordId: cr.recordId,
            recordKind: cr.recordKind,
            changeRequestId: cr.id,
            detail: comment?.trim() || null,
          }),
          ...s.auditLog,
        ],
      };
    });

    get().toast({
      title: 'Approved and published',
      body: `${cr.recordName} — applied by ${userName(CURRENT_USER_ID)}`,
      tone: 'approved',
    });
  },

  rejectChange(id, comment) {
    const cr = get().changeRequests.find((c) => c.id === id);
    if (!cr || cr.status !== 'pending') return;
    /* A reject with no reason is the thing this whole tier exists to prevent,
       so it is refused here as well as disabled in the dialog. */
    if (!comment.trim()) return;
    const at = now();

    set((s) => ({
      changeRequests: s.changeRequests.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'rejected' as const,
              decidedBy: CURRENT_USER_ID,
              decidedAt: at,
              decisionComment: comment.trim(),
            }
          : c,
      ),
      auditLog: [
        auditEvent('rejected', `Rejected the proposed change to “${cr.recordName}”`, {
          recordId: cr.recordId,
          recordKind: cr.recordKind,
          changeRequestId: cr.id,
          detail: comment.trim(),
        }),
        ...s.auditLog,
      ],
    }));

    get().toast({
      title: 'Rejected',
      body: 'The live value is unchanged. The editor has the reason.',
      tone: 'rejected',
    });
  },

  /* ------------------------------------------------------------- sam.gov */

  async syncNow() {
    if (get().syncing) return;
    set({ syncing: true });
    try {
      const result = await samClient.sync();
      set((s) => ({
        entity: result.entity,
        awards: result.awards,
        lastSyncedAt: result.syncedAt,
        syncing: false,
        auditLog: [
          auditEvent('synced', 'Synced entity registration and awards from SAM.gov and USAspending', {
            detail: 'Manual sync from the Contracts and Registrations panel.',
          }),
          ...s.auditLog,
        ],
      }));
      get().toast({
        title: 'Synced from SAM.gov',
        body: 'Entity registration and awarded contracts are current.',
        tone: 'info',
      });
    } catch {
      set({ syncing: false });
      get().toast({
        title: 'Sync failed',
        body: 'SAM.gov did not respond. The last good values are still showing.',
        tone: 'danger',
      });
    }
  },

  /* -------------------------------------------------------------- scorer */

  applyRescore(id, next) {
    const opp = get().opportunities.find((o) => o.id === id);
    if (!opp) return;
    const previous = opp.fitScore;
    const at = now();

    set((s) => ({
      opportunities: s.opportunities.map((o): Opportunity =>
        o.id === id
          ? { ...o, fitScore: next.fitScore, rationale: next.rationale, rescoredAt: at, rescoredBy: next.by }
          : o,
      ),
      auditLog: [
        auditEvent('rescored', `Rescored “${opp.title}” — ${previous} to ${next.fitScore}`, {
          detail:
            next.by === 'anthropic'
              ? 'Scored by claude-haiku-4-5 against the ILS capability profile.'
              : 'Simulated rescore — no ANTHROPIC_API_KEY present.',
        }),
        ...s.auditLog,
      ],
    }));
  },

  /* --------------------------------------------------------- demo control */

  resetDemo() {
    set((s) => ({
      ...createSeedState(),
      syncing: false,
      toasts: [],
      generation: s.generation + 1,
    }));
    get().toast({
      title: 'Demo data reset',
      body: 'Every record, approval and score is back to its opening state.',
      tone: 'info',
    });
  },

  /* -------------------------------------------------------------- toasts */

  toast(t) {
    const id = nextId('toast');
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => get().dismissToast(id), 4200);
  },

  dismissToast(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

/* ------------------------------------------------------------- selectors */

export function usePendingCount(): number {
  return useAdminStore((s) => s.changeRequests.filter((c) => c.status === 'pending').length);
}

export function usePendingForRecord(recordId: string): ChangeRequest | undefined {
  return useAdminStore((s) =>
    s.changeRequests.find((c) => c.recordId === recordId && c.status === 'pending'),
  );
}

/** Every audit entry touching one record, newest first. */
export function useRecordTrail(recordId: string): AuditEvent[] {
  return useAdminStore((s) => s.auditLog.filter((e) => e.recordId === recordId));
}
