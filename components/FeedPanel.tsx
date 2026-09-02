import { NOT_CONFIGURED } from "@/lib/feeds";

// Shared chrome for the live market feeds — deliberately mirrors MissionFeed's
// header bar so a live panel reads the same as the hero ledger.

export default function FeedPanel({
  label,
  source,
  sourceUrl,
  count,
  error,
  setupHint,
  note,
  children,
}: {
  label: string;
  source: string;
  sourceUrl: string;
  count: number;
  error: string | null;
  setupHint?: string;
  /** Caveat shown above the rows — e.g. that a fallback source is in use. */
  note?: string;
  children: React.ReactNode;
}) {
  const unconfigured = error === NOT_CONFIGURED;
  const live = !error && count > 0;

  return (
    <div className="hairline-card flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2">
        <span className="mono-label flex items-center gap-2">
          {live ? (
            <span className="status-dot" aria-hidden />
          ) : (
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-mute"
              aria-hidden
            />
          )}
          {label}
        </span>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mono-label hover:text-signal"
        >
          {source} ↗
        </a>
      </div>

      {unconfigured ? (
        <div className="px-4 py-6">
          <p className="mono-label text-mute">API KEY REQUIRED</p>
          <p className="mt-2 text-sm text-mute">{setupHint}</p>
        </div>
      ) : error ? (
        <div className="px-4 py-6">
          <p className="mono-label text-mute">FEED UNAVAILABLE</p>
          <p className="mt-2 text-sm text-mute">
            Upstream source did not respond ({error}). The rest of the page is unaffected; the
            feed retries on the next revalidation.
          </p>
        </div>
      ) : count === 0 ? (
        <div className="px-4 py-6">
          <p className="text-sm text-mute">No matching records in the current window.</p>
        </div>
      ) : (
        <>
          {note && (
            <p className="border-b border-line bg-raise px-4 py-2 text-[11px] leading-relaxed text-mute">
              {note}
            </p>
          )}
          {children}
        </>
      )}
    </div>
  );
}
