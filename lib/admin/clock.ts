/**
 * Relative dates for the seed data.
 *
 * A demo deck gets presented weeks after it is built, so no seeded timestamp
 * is written as a literal. Everything is expressed as an offset from today —
 * the approvals queue is always days old, the SAM sync is always this morning,
 * and the registration always expires inside the ninety-day window.
 *
 * The anchor is UTC midnight rather than `Date.now()` so the server render and
 * the browser hydration agree on every seeded value. Live "3 minutes ago"
 * readouts are produced at render time instead, by `<RelativeTime>`.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** UTC midnight of the current day. Stable for the whole of a demo day. */
export const ANCHOR = Math.floor(Date.now() / DAY) * DAY;

/** ISO timestamp `dayOffset` days from today, at the given wall-clock time. */
export function at(dayOffset: number, hour = 9, minute = 30): string {
  return new Date(ANCHOR + dayOffset * DAY + hour * HOUR + minute * MINUTE).toISOString();
}

export function daysAgo(days: number, hour = 9, minute = 30): string {
  return at(-days, hour, minute);
}

export function daysAhead(days: number, hour = 17, minute = 0): string {
  return at(days, hour, minute);
}

export function todayAt(hour: number, minute = 0): string {
  return at(0, hour, minute);
}

/** Calendar months back from today, snapped to the same day of the month. */
export function monthsAgo(months: number, hour = 9, minute = 30): string {
  const d = new Date(ANCHOR);
  d.setUTCMonth(d.getUTCMonth() - months);
  return new Date(d.getTime() + hour * HOUR + minute * MINUTE).toISOString();
}

/** Calendar months ahead of today. Used for expiry dates that must stay realistic. */
export function monthsAhead(months: number, hour = 17, minute = 0): string {
  const d = new Date(ANCHOR);
  d.setUTCMonth(d.getUTCMonth() + months);
  return new Date(d.getTime() + hour * HOUR + minute * MINUTE).toISOString();
}

/** Whole days from now until `iso`. Negative once the date has passed. */
export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / DAY);
}

/** The window that turns the registration-health callout amber. */
export const EXPIRY_WARNING_DAYS = 90;

export function isExpiringSoon(iso: string): boolean {
  const days = daysUntil(iso);
  return days >= 0 && days <= EXPIRY_WARNING_DAYS;
}
