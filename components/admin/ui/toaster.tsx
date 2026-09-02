'use client';

import { AlertTriangle, CheckCircle2, Clock, Info, XCircle } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/admin/cn';
import { useAdminStore, type ToastTone } from '@/lib/admin/store';

/**
 * Toasts.
 *
 * The Tier 1 "Published just now" toast is the demo's proof that the fast tier
 * is genuinely fast, so it lands bottom-right in green within a frame of the
 * click. The Tier 2 toasts use the same component but never green unless a
 * second approver actually applied the change — a proposal gets amber and says
 * so, because a green flash after proposing would tell the operator the exact
 * opposite of what happened.
 */

const TONE: Record<
  ToastTone,
  { icon: React.ComponentType<{ className?: string }>; ring: string; accent: string }
> = {
  published: { icon: CheckCircle2, ring: 'border-green-ring', accent: 'text-green' },
  approved: { icon: CheckCircle2, ring: 'border-green-ring', accent: 'text-green' },
  pending: { icon: Clock, ring: 'border-warn-ring', accent: 'text-warn' },
  rejected: { icon: XCircle, ring: 'border-danger-ring', accent: 'text-danger' },
  danger: { icon: AlertTriangle, ring: 'border-danger-ring', accent: 'text-danger' },
  info: { icon: Info, ring: 'border-action-ring', accent: 'text-action' },
};

export function Toaster() {
  const toasts = useAdminStore((s) => s.toasts);
  const dismiss = useAdminStore((s) => s.dismissToast);

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const { icon: Icon, ring, accent } = TONE[t.tone];
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => dismiss(t.id)}
            className={cn(
              'pointer-events-auto flex w-full items-start gap-3 rounded-card border bg-card px-4 py-3 text-left shadow-lg',
              'motion-safe:animate-[toast-in_180ms_ease-out]',
              ring,
            )}
          >
            <Icon className={cn('mt-0.5 size-4 shrink-0', accent)} />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-ink">{t.title}</span>
              {t.body ? (
                <span className="mt-0.5 block text-[12px] leading-snug text-slate">{t.body}</span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
