'use client';

/**
 * Tier 1 — publish instantly.
 *
 * The whole point of this page is that nothing gets in the way. One click
 * publishes, the row updates in place, and the toast confirms it. There is no
 * confirmation dialog here on purpose: the ceremony belongs on the Approvals
 * page, and putting it in both places would teach the operator to click
 * through both without reading either.
 */

import { CalendarDays, Newspaper, Plus, Rocket, Undo2, Briefcase, PenLine } from 'lucide-react';
import * as React from 'react';
import { ContentEditor } from '@/components/admin/content-editor';
import { Button } from '@/components/admin/ui/button';
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Separator,
} from '@/components/admin/ui/primitives';
import { RelativeTime } from '@/components/admin/ui/relative-time';
import { cn } from '@/lib/admin/cn';
import { userName } from '@/lib/admin/fixtures/users';
import { formatDate, truncate } from '@/lib/admin/format';
import { useAdminStore } from '@/lib/admin/store';
import type { ContentItem, ContentKind } from '@/lib/admin/types';

const TABS: { kind: ContentKind; label: string; icon: React.ComponentType<{ className?: string }> }[] =
  [
    { kind: 'news', label: 'News', icon: Newspaper },
    { kind: 'job', label: 'Jobs', icon: Briefcase },
    { kind: 'event', label: 'Events', icon: CalendarDays },
  ];

function Row({ item, onEdit }: { item: ContentItem; onEdit: () => void }) {
  const publish = useAdminStore((s) => s.publishContent);
  const unpublish = useAdminStore((s) => s.unpublishContent);
  const live = item.status === 'published';

  return (
    <div className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-wash/40 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="text-left text-[14.5px] font-medium text-ink hover:text-action"
          >
            {item.title}
          </button>
          {live ? <Badge tone="live">Published</Badge> : <Badge tone="draft">Draft</Badge>}
        </div>

        <p className="mt-1 text-[13px] leading-snug text-slate">{truncate(item.summary, 150)}</p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted">
          <span>{userName(item.authorId)}</span>
          <span aria-hidden>·</span>
          {live && item.publishedAt ? (
            <RelativeTime iso={item.publishedAt} prefix="published" />
          ) : (
            <RelativeTime iso={item.updatedAt} prefix="edited" />
          )}
          {item.kind === 'job' ? (
            <>
              <span aria-hidden>·</span>
              <span>{item.location}</span>
              <span aria-hidden>·</span>
              <span
                className={cn(
                  item.clearance === 'Secret' ? 'font-medium text-warn' : undefined,
                )}
              >
                {item.clearance}
              </span>
            </>
          ) : null}
          {item.kind === 'event' ? (
            <>
              <span aria-hidden>·</span>
              <span>{formatDate(item.eventStart)}</span>
              <span aria-hidden>·</span>
              <span>{item.city}</span>
            </>
          ) : null}
          {item.tags.length ? (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{item.tags.join(' · ')}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <PenLine />
          Edit
        </Button>
        {live ? (
          <Button variant="outline" size="sm" onClick={() => unpublish(item.id)}>
            <Undo2 />
            Unpublish
          </Button>
        ) : (
          <Button variant="publish" size="sm" onClick={() => publish(item.id)}>
            <Rocket />
            Publish
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ContentPage() {
  const content = useAdminStore((s) => s.content);
  const [kind, setKind] = React.useState<ContentKind>('news');
  const [editing, setEditing] = React.useState<ContentItem | undefined>();
  const [open, setOpen] = React.useState(false);

  const items = React.useMemo(
    () =>
      content
        .filter((c) => c.kind === kind)
        .sort((a, b) => (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt)),
    [content, kind],
  );

  const drafts = items.filter((i) => i.status === 'draft').length;

  function openNew() {
    setEditing(undefined);
    setOpen(true);
  }

  function openEdit(item: ContentItem) {
    setEditing(item);
    setOpen(true);
  }

  return (
    <>
      <PageHeader
        eyebrow="Tier 1 · No approval required"
        title="Content"
        description="News posts, job openings and event notices. These publish the moment you click — nothing here is a fact a contracting officer would rely on to make an award decision."
        actions={
          <Button onClick={openNew}>
            <Plus />
            New {kind === 'news' ? 'post' : kind === 'job' ? 'opening' : 'notice'}
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-rule bg-card p-0.5">
          {TABS.map((t) => {
            const count = content.filter((c) => c.kind === t.kind).length;
            const Icon = t.icon;
            return (
              <button
                key={t.kind}
                type="button"
                onClick={() => setKind(t.kind)}
                className={cn(
                  'flex items-center gap-2 rounded px-3 py-1.5 text-[13px] font-medium transition-colors',
                  kind === t.kind
                    ? 'bg-action-soft text-action-ink'
                    : 'text-slate hover:bg-wash hover:text-ink',
                )}
              >
                <Icon className="size-3.5" />
                {t.label}
                <span className="nums text-[11px] text-muted">{count}</span>
              </button>
            );
          })}
        </div>
        {drafts > 0 ? (
          <Badge tone="draft">
            {drafts} draft{drafts === 1 ? '' : 's'} ready to publish
          </Badge>
        ) : null}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          body="Create the first item and publish it in one click."
          action={
            <Button onClick={openNew}>
              <Plus />
              New item
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          {items.map((item, i) => (
            <React.Fragment key={item.id}>
              {i > 0 ? <Separator /> : null}
              <Row item={item} onEdit={() => openEdit(item)} />
            </React.Fragment>
          ))}
        </Card>
      )}

      <ContentEditor
        open={open}
        onOpenChange={setOpen}
        item={editing}
        kind={editing?.kind ?? kind}
      />
    </>
  );
}
