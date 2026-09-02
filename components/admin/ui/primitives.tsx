'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/admin/cn';

/* ---------------------------------------------------------------- card */

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-card border border-rule bg-card', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-start justify-between gap-4 px-5 pt-4 pb-3', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-[15px] font-semibold text-ink', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-0.5 text-[13px] leading-snug text-slate', className)} {...props} />;
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pb-5', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center gap-2 border-t border-rule-soft px-5 py-3', className)}
      {...props}
    />
  );
}

/* --------------------------------------------------------------- badge */

/**
 * One badge component for every state in the app, so "Published", "Approved"
 * and "Verified" cannot drift into three different greens.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-5 whitespace-nowrap',
  {
    variants: {
      tone: {
        live: 'border-green-ring bg-green-soft text-green',
        pending: 'border-warn-ring bg-warn-soft text-warn',
        draft: 'border-rule bg-wash text-slate',
        danger: 'border-danger-ring bg-danger-soft text-danger',
        info: 'border-action-ring bg-action-soft text-action-ink',
        neutral: 'border-rule bg-card text-slate',
        dark: 'border-transparent bg-forest text-sage',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

/** A small filled dot, for a badge that needs a status light. */
export function Dot({ className }: { className?: string }) {
  return <span className={cn('size-1.5 rounded-full bg-current', className)} aria-hidden />;
}

/* --------------------------------------------------------------- inputs */

const fieldBase =
  'w-full rounded-md border border-rule bg-card px-3 text-sm text-ink placeholder:text-muted transition-colors focus:border-action focus:outline-none disabled:bg-wash disabled:text-muted';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(fieldBase, 'h-9', className)} {...props} />;
  },
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(fieldBase, 'py-2 leading-relaxed', className)} {...props} />;
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
  return <select ref={ref} className={cn(fieldBase, 'h-9 pr-8', className)} {...props} />;
});

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('block text-[12px] font-medium tracking-wide text-slate', className)}
      {...props}
    />
  );
}

export function FieldHelp({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1.5 text-[12px] leading-snug text-muted', className)} {...props} />;
}

/** Label + control + help, stacked. The only field layout in the app. */
export function Field({
  label,
  help,
  htmlFor,
  children,
  className,
}: {
  label: string;
  help?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mb-1.5">
        {label}
      </Label>
      {children}
      {help ? <FieldHelp>{help}</FieldHelp> : null}
    </div>
  );
}

/* ------------------------------------------------------- layout helpers */

/** The uppercase mono kicker the marketing site uses above section headings. */
export function Eyebrow({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate',
        className,
      )}
      {...props}
    />
  );
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? <Eyebrow className="mb-2">{eyebrow}</Eyebrow> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  icon,
  action,
}: {
  title: string;
  body: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-rule bg-card/60 px-6 py-14 text-center">
      {icon ? <div className="mb-3 text-muted">{icon}</div> : null}
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-slate">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/** A monospaced identifier — contract numbers, UEI, notice IDs. */
export function Mono({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('font-mono text-[13px] nums text-ink', className)} {...props} />;
}

export function Separator({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-rule-soft', className)} role="none" />;
}
