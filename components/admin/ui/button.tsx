'use client';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/admin/cn';

/**
 * Variants carry meaning, not just colour.
 *
 * `primary` is deep brand green — the interactive surface, the invited click.
 * `publish` is the bright accent, reserved for the one-click Tier 1 action, so
 * the colour that means "verified" on the public site means "live" here.
 * `approve` shares it. `danger` is a reject or a delete. The two greens differ
 * by weight, not hue: nothing outside these three may fill with either.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-action text-white hover:bg-action-hover',
        publish: 'bg-bright text-ink hover:brightness-95',
        approve: 'bg-bright text-ink hover:brightness-95',
        danger: 'bg-danger text-white hover:bg-[#7f1610]',
        outline: 'border border-rule bg-card text-ink hover:bg-wash',
        subtle: 'bg-wash text-slate hover:bg-rule-soft hover:text-ink',
        ghost: 'text-slate hover:bg-wash hover:text-ink',
        dark: 'bg-forest text-white hover:bg-forest-raised',
      },
      size: {
        sm: 'h-8 px-3 text-[13px] [&_svg]:size-3.5',
        md: 'h-9 px-4 [&_svg]:size-4',
        lg: 'h-11 px-6 text-[15px] [&_svg]:size-4',
        icon: 'size-9 [&_svg]:size-4',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    /** Render as the child element — for links that should look like buttons. */
    asChild?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});

export { buttonVariants };
