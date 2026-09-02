'use client';

import { Eye, PenLine, Rocket, Save } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/admin/cn';
import { CURRENT_USER_ID } from '@/lib/admin/fixtures/users';
import { useAdminStore } from '@/lib/admin/store';
import type { ContentItem, ContentKind } from '@/lib/admin/types';
import { Button } from './ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Markdown } from './ui/markdown';
import { Badge, Field, Input, Select, Textarea } from './ui/primitives';

const KIND_LABEL: Record<ContentKind, string> = {
  news: 'News post',
  job: 'Job opening',
  event: 'Event notice',
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

/** A blank item of the requested kind. */
function blank(kind: ContentKind): ContentItem {
  const base = {
    id: `new-${kind}-${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    slug: '',
    summary: '',
    body: '',
    tags: [] as string[],
    status: 'draft' as const,
    authorId: CURRENT_USER_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: null,
  };
  if (kind === 'job') {
    return {
      ...base,
      kind: 'job',
      programme: '',
      location: '',
      clearance: 'None required',
      employmentType: 'Full time',
    };
  }
  if (kind === 'event') {
    return {
      ...base,
      kind: 'event',
      eventStart: new Date(Date.now() + 14 * 86_400_000).toISOString(),
      venue: '',
      city: '',
      registrationLabel: '',
    };
  }
  return { ...base, kind: 'news' };
}

/** ISO ⇄ the `datetime-local` value the input wants. */
function toLocalInput(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 16);
}

export function ContentEditor({
  open,
  onOpenChange,
  item,
  kind,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Undefined when creating. */
  item?: ContentItem;
  kind: ContentKind;
}) {
  const saveContent = useAdminStore((s) => s.saveContent);
  const publishContent = useAdminStore((s) => s.publishContent);

  const [draft, setDraft] = React.useState<ContentItem>(() => item ?? blank(kind));
  const [tab, setTab] = React.useState<'write' | 'preview'>('write');

  /* Reset the form whenever the dialog opens on a different item. */
  React.useEffect(() => {
    if (open) {
      setDraft(item ?? blank(kind));
      setTab('write');
    }
  }, [open, item, kind]);

  const isNew = !item;
  const canSave = draft.title.trim().length > 2 && draft.body.trim().length > 0;

  function patch(next: Partial<ContentItem>) {
    setDraft((d) => ({ ...d, ...next }) as ContentItem);
  }

  function commit(publish: boolean) {
    const finished: ContentItem = {
      ...draft,
      title: draft.title.trim(),
      slug: draft.slug.trim() || slugify(draft.title),
      summary: draft.summary.trim(),
    };
    saveContent(finished);
    if (publish) publishContent(finished.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>
              {isNew ? `New ${KIND_LABEL[kind].toLowerCase()}` : `Edit ${KIND_LABEL[kind].toLowerCase()}`}
            </DialogTitle>
            <Badge tone="live">Publishes instantly</Badge>
          </div>
          <DialogDescription>
            No approval gate on this tier. Hitting Publish puts it on the public site immediately.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <Field label="Title">
            <Input
              value={draft.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder={
                kind === 'job'
                  ? 'Senior Cloud Engineer'
                  : kind === 'event'
                    ? 'Industry day — FAA eFAST'
                    : 'ILS renews ISO/IEC 27001:2022 certification'
              }
              autoFocus
            />
          </Field>

          <Field label="Summary" help="One line. Shown on the public index card.">
            <Textarea
              rows={2}
              value={draft.summary}
              onChange={(e) => patch({ summary: e.target.value })}
            />
          </Field>

          {draft.kind === 'job' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Programme">
                <Input
                  value={draft.programme}
                  onChange={(e) => patch({ programme: e.target.value } as Partial<ContentItem>)}
                />
              </Field>
              <Field label="Location">
                <Input
                  value={draft.location}
                  onChange={(e) => patch({ location: e.target.value } as Partial<ContentItem>)}
                />
              </Field>
              <Field label="Clearance" help="Every listing states its clearance level.">
                <Select
                  value={draft.clearance}
                  onChange={(e) => patch({ clearance: e.target.value } as Partial<ContentItem>)}
                >
                  <option>None required</option>
                  <option>Public Trust</option>
                  <option>Secret</option>
                </Select>
              </Field>
              <Field label="Employment type">
                <Input
                  value={draft.employmentType}
                  onChange={(e) => patch({ employmentType: e.target.value } as Partial<ContentItem>)}
                />
              </Field>
            </div>
          ) : null}

          {draft.kind === 'event' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Starts">
                <Input
                  type="datetime-local"
                  value={toLocalInput(draft.eventStart)}
                  onChange={(e) =>
                    patch({
                      eventStart: new Date(e.target.value).toISOString(),
                    } as Partial<ContentItem>)
                  }
                />
              </Field>
              <Field label="City">
                <Input
                  value={draft.city}
                  onChange={(e) => patch({ city: e.target.value } as Partial<ContentItem>)}
                />
              </Field>
              <Field label="Venue" className="sm:col-span-2">
                <Input
                  value={draft.venue}
                  onChange={(e) => patch({ venue: e.target.value } as Partial<ContentItem>)}
                />
              </Field>
              <Field label="Registration" className="sm:col-span-2">
                <Input
                  value={draft.registrationLabel}
                  onChange={(e) =>
                    patch({ registrationLabel: e.target.value } as Partial<ContentItem>)
                  }
                />
              </Field>
            </div>
          ) : null}

          {/* Body with live markdown preview */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[12px] font-medium tracking-wide text-slate">Body</span>
              <div className="flex rounded-md border border-rule bg-wash p-0.5">
                {(
                  [
                    ['write', 'Write', PenLine],
                    ['preview', 'Preview', Eye],
                  ] as const
                ).map(([value, label, Icon]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTab(value)}
                    className={cn(
                      'flex items-center gap-1.5 rounded px-2.5 py-1 text-[12px] font-medium transition-colors',
                      tab === value ? 'bg-card text-ink shadow-sm' : 'text-slate hover:text-ink',
                    )}
                  >
                    <Icon className="size-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {tab === 'write' ? (
              <Textarea
                rows={12}
                value={draft.body}
                onChange={(e) => patch({ body: e.target.value })}
                className="font-mono text-[13px]"
                placeholder={'Markdown supported.\n\n**Bold**, - bullets, ## headings, | tables |'}
              />
            ) : (
              <div className="scroll-slim max-h-[19rem] min-h-[10rem] overflow-y-auto rounded-md border border-rule bg-card px-4 py-3">
                <Markdown source={draft.body} />
              </div>
            )}
          </div>

          <Field label="Tags" help="Comma separated.">
            <Input
              value={draft.tags.join(', ')}
              onChange={(e) =>
                patch({
                  tags: e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field>
        </DialogBody>

        <DialogFooter>
          <span className="mr-auto text-[12px] text-muted">
            {draft.status === 'published' ? 'Currently live' : 'Draft — not on the public site'}
          </span>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="subtle" disabled={!canSave} onClick={() => commit(false)}>
            <Save />
            Save draft
          </Button>
          <Button variant="publish" disabled={!canSave} onClick={() => commit(true)}>
            <Rocket />
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
