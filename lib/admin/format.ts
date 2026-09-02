/**
 * Display formatting for the dashboard.
 *
 * Dates render in the federal long form — "24 Aug 2026" — because that is how
 * every contract document the operator is cross-checking against writes them,
 * and a demo that makes the audience translate formats loses them.
 */

const DAY = 86_400_000;

const longDate = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const timeOfDay = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

/** "24 Aug 2026". Empty string in, empty string out — some fields are blank by design. */
export function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return longDate.format(d);
}

/** "24 Aug 2026 · 14:20" */
export function formatDateTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${longDate.format(d)} · ${timeOfDay.format(d)}`;
}

/**
 * "3 minutes ago", "yesterday", "6 days ago".
 *
 * Only ever called after mount — see `<RelativeTime>`. Calling it during a
 * server render would produce a string the client disagrees with a moment
 * later, which React reports as a hydration error.
 */
export function formatRelative(iso: string): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;

  const diff = Date.now() - then;
  const future = diff < 0;
  const abs = Math.abs(diff);

  const minutes = Math.floor(abs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes === 1) return future ? 'in a minute' : 'a minute ago';
  if (minutes < 60) return future ? `in ${minutes} minutes` : `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return future ? 'in an hour' : 'an hour ago';
  if (hours < 24) return future ? `in ${hours} hours` : `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return future ? 'tomorrow' : 'yesterday';
  if (days < 31) return future ? `in ${days} days` : `${days} days ago`;

  const months = Math.round(days / 30);
  if (months === 1) return future ? 'next month' : 'a month ago';
  if (months < 24) return future ? `in ${months} months` : `${months} months ago`;

  const years = Math.round(months / 12);
  return future ? `in ${years} years` : `${years} years ago`;
}

/** Whole days between now and `iso`. Negative once past. */
export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / DAY);
}

/** "in 61 days", "expired 12 days ago", "today". */
export function expiryPhrase(iso: string): string {
  const days = daysUntil(iso);
  if (days === 0) return 'today';
  if (days < 0) return `${Math.abs(days)} days ago`;
  return `in ${days} days`;
}

/** Initials for an avatar chip, from a display name. */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Sentence-case a field key for a fallback label. */
export function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

/** Truncate on a word boundary, for list-view teasers. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${cut.slice(0, space > max * 0.6 ? space : max).trimEnd()}…`;
}

/** The reading time a capture brief claims. Fixture briefs are one page. */
export function readingMinutes(text: string): number {
  return Math.max(1, Math.round(text.split(/\s+/).length / 220));
}
