'use client';

import * as React from 'react';
import { formatDateTime, formatRelative } from '@/lib/admin/format';

/**
 * Renders the absolute date on the server and swaps to "3 minutes ago" once
 * mounted.
 *
 * A relative string computed during a server render is stale by the time the
 * browser hydrates, which React reports as a hydration mismatch. Rendering the
 * absolute form first sidesteps it, and the absolute form is also what someone
 * sees with JavaScript disabled.
 */
export function RelativeTime({
  iso,
  className,
  prefix,
}: {
  iso: string;
  className?: string;
  prefix?: string;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!iso) return null;
  const absolute = formatDateTime(iso);

  return (
    <time dateTime={iso} title={absolute} className={className}>
      {prefix ? `${prefix} ` : ''}
      {mounted ? formatRelative(iso) : absolute}
    </time>
  );
}
