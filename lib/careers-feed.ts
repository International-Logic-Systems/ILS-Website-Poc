import "server-only";

/**
 * Open positions, read from the iCIMS portal.
 *
 * iCIMS renders its normal search page with JavaScript, but ships a
 * server-rendered version for clients without it — the `in_iframe=1` document
 * referenced by the `<noscript>` iframe on the public page. That is what this
 * reads: it is the same data, published by iCIMS for exactly this case, and
 * `robots.txt` disallows only the referral, login, candidate and connect paths,
 * not `/jobs/search`.
 *
 * The applicant tracking system stays the system of record. Nothing is cached
 * here beyond Next's own fetch cache, no listing is stored in the repo, and a
 * failure returns an empty list so the page falls back to sending people to the
 * portal rather than showing a stale or invented role.
 */

const PORTAL = "https://careers-intllogic.icims.com";
const SOURCE = `${PORTAL}/jobs/search?ss=1&in_iframe=1`;

/** Re-read hourly: roles change on a human timescale, not a request timescale. */
const REVALIDATE_SECONDS = 3600;

export type Position = {
  /** iCIMS internal id from the URL, e.g. "1320". */
  id: string;
  /** Reference iCIMS shows candidates, e.g. "2026-1320". */
  reference: string | null;
  title: string;
  location: string | null;
  category: string | null;
  summary: string | null;
  /** Canonical portal URL for this role, without the iframe parameter. */
  href: string;
};

const decode = (s: string): string =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/\s+/g, " ")
    .trim();

const strip = (html: string): string => decode(html.replace(/<[^>]+>/g, " "));

/** Pulls one labelled value out of the job card's definition list. */
function headerField(card: string, label: string): string | null {
  const re = new RegExp(
    `<dt[^>]*class="iCIMS_JobHeaderField"[^>]*>\\s*${label}\\s*</dt>\\s*<dd[^>]*>([\\s\\S]*?)</dd>`,
    "i",
  );
  const value = re.exec(card)?.[1];
  return value ? strip(value) || null : null;
}

function parse(html: string): Position[] {
  const out: Position[] = [];

  for (const [, card] of html.matchAll(
    /<li[^>]*class="[^"]*iCIMS_JobCardItem[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
  )) {
    const link = /<a[^>]*href="([^"]*\/jobs\/(\d+)\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/i.exec(card);
    if (!link) continue;

    const [, rawHref, id, inner] = link;
    const title = strip(/<h3[^>]*>([\s\S]*?)<\/h3>/i.exec(inner)?.[1] ?? inner);
    if (!title) continue;

    // The location sits in the card header above the title.
    const header = /class="[^"]*header left[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(card)?.[1] ?? "";
    const location = strip(header.replace(/<span[^>]*class="sr-only[^"]*"[^>]*>[\s\S]*?<\/span>/i, ""));

    const summary = strip(
      /class="[^"]*col-xs-12 description[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(card)?.[1] ?? "",
    );

    out.push({
      id,
      reference: headerField(card, "ID"),
      title,
      location: location || null,
      category: headerField(card, "Category"),
      summary: summary ? summary.slice(0, 260) : null,
      // Drop the iframe flag so the link opens the real posting.
      href: decode(rawHref).replace(/[?&]in_iframe=1/, ""),
    });
  }

  return out;
}

/**
 * Last successful read, so a brief iCIMS outage does not blank the page.
 *
 * Without this, one timed-out request regenerates the page with no openings and
 * that empty version is then cached for the full revalidate window — a
 * five-second blip would hide every role for an hour.
 */
let lastGood: { positions: Position[]; at: number } | null = null;

/** Beyond a day, stale listings are worse than none. */
const STALE_LIMIT_MS = 24 * 3600_000;

function fallback(): Position[] {
  if (lastGood && Date.now() - lastGood.at < STALE_LIMIT_MS) return lastGood.positions;
  return [];
}

/**
 * Current openings, in the order iCIMS returns them.
 *
 * The two failure cases are treated differently on purpose:
 *
 *   - the request failed, so we do not know the truth → serve the last good
 *     read, because the previous list is better evidence than nothing;
 *   - the request succeeded and contained no jobs → trust it and show none.
 *     A closed role left on the page is a false claim, and worse than an empty
 *     list next to a working link to the portal.
 */
export async function getOpenPositions(): Promise<Position[]> {
  try {
    const res = await fetch(SOURCE, {
      headers: {
        // iCIMS serves the no-JS document to a normal browser UA.
        "user-agent":
          "Mozilla/5.0 (compatible; ILS-website/1.0; +https://intllogic.com) careers-listing",
        accept: "text/html",
      },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return fallback();

    const positions = parse(await res.text());
    if (positions.length) lastGood = { positions, at: Date.now() };
    return positions;
  } catch {
    return fallback();
  }
}

export const CAREERS_PORTAL_SEARCH = `${PORTAL}/jobs/search?ss=1`;
