// Live federal market feeds, pulled from public open-data APIs.
//
//   USAspending.gov  — awarded contracts      no API key required
//   Federal Register — agency notices/rules   no API key required
//   SAM.gov          — open opportunities     requires SAM_API_KEY (free)
//
// Contract for every fetcher here: it never throws. A network failure, a
// timeout, or an unexpected payload returns { items: [], error } so the page
// still renders and `next build` can never be broken by an upstream outage.

const TIMEOUT_MS = 12_000;

/** Sentinel error meaning "no credential supplied", not "the call failed". */
export const NOT_CONFIGURED = "NOT_CONFIGURED";

export type FeedResult<T> = { items: T[]; error: string | null };

export type Award = {
  id: string;
  recipient: string;
  agency: string;
  subAgency: string;
  amount: number;
  popStart: string | null;
  description: string;
  naics: string;
  url: string;
};

export type Notice = {
  title: string;
  agencies: string[];
  date: string;
  type: string;
  url: string;
};

export type Opportunity = {
  title: string;
  agency: string;
  posted: string;
  deadline: string | null;
  naics: string;
  type: string;
  url: string;
};

// IT services NAICS — the codes ILS actually competes in, so the feed is
// relevant rather than a firehose of all federal spending.
const IT_NAICS = ["541511", "541512", "541513", "541519"];

// Agencies tied to ILS's customer base and contract vehicles.
const FR_AGENCIES = [
  "agriculture-department",
  "export-import-bank",
  "general-services-administration",
  "federal-aviation-administration",
  "veterans-affairs-department",
  "homeland-security-department",
  "transportation-department",
];

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/** SAM.gov wants MM/dd/yyyy rather than ISO. */
function samDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}

/**
 * Order by soonest response deadline, undated entries last.
 *
 * Sources disagree on format — SAM.gov sends ISO ("2026-09-10T17:00:00-04:00")
 * while Grants.gov sends MM/DD/YYYY — so these must be parsed to a timestamp.
 * A plain string compare would sort MM/DD/YYYY by month and put Apr 2027
 * ahead of Aug 2026.
 */
function byDeadline(a: Opportunity, b: Opportunity): number {
  const t = (s: string | null): number => {
    if (!s) return Number.POSITIVE_INFINITY;
    const ms = new Date(s).getTime();
    return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
  };
  return t(a.deadline) - t(b.deadline);
}

function reason(e: unknown): string {
  if (e instanceof Error) {
    return e.name === "TimeoutError" || e.name === "AbortError"
      ? `timed out after ${TIMEOUT_MS / 1000}s`
      : e.message;
  }
  return "unknown error";
}

/** Recently *signed* IT-services contract awards, largest first. */
export async function fetchAwards(limit = 8): Promise<FeedResult<Award>> {
  try {
    const res = await fetch("https://api.usaspending.gov/api/v2/search/spending_by_award/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        filters: {
          award_type_codes: ["A", "B", "C", "D"],
          naics_codes: { require: IT_NAICS },
          // date_signed (not action_date) is what makes these genuinely new
          // awards rather than long-running vehicles still being modified.
          time_period: [
            { start_date: isoDaysAgo(60), end_date: isoToday(), date_type: "date_signed" },
          ],
        },
        fields: [
          "Award ID",
          "Recipient Name",
          "Awarding Agency",
          "Awarding Sub Agency",
          "Award Amount",
          "Start Date",
          "Description",
          "NAICS",
        ],
        sort: "Award Amount",
        order: "desc",
        limit,
      }),
    });

    if (!res.ok) return { items: [], error: `USAspending responded ${res.status}` };

    const json: unknown = await res.json();
    const rows = (json as { results?: Record<string, unknown>[] })?.results ?? [];

    const items: Award[] = rows.map((r) => {
      const naics = r["NAICS"] as { code?: string; description?: string } | null;
      const internal = r["generated_internal_id"] as string | undefined;
      return {
        id: String(r["Award ID"] ?? "—"),
        recipient: String(r["Recipient Name"] ?? "Unknown recipient"),
        agency: String(r["Awarding Agency"] ?? "—"),
        subAgency: String(r["Awarding Sub Agency"] ?? ""),
        amount: Number(r["Award Amount"] ?? 0),
        popStart: (r["Start Date"] as string | null) ?? null,
        description: String(r["Description"] ?? ""),
        naics: naics?.code ? `${naics.code} · ${naics.description ?? ""}`.trim() : "",
        url: internal
          ? `https://www.usaspending.gov/award/${encodeURIComponent(internal)}`
          : "https://www.usaspending.gov/search",
      };
    });

    return { items, error: null };
  } catch (e) {
    return { items: [], error: reason(e) };
  }
}

/** Latest Federal Register documents from ILS-relevant agencies. */
export async function fetchNotices(limit = 8): Promise<FeedResult<Notice>> {
  try {
    const p = new URLSearchParams();
    p.set("per_page", String(limit));
    p.set("order", "newest");
    for (const a of FR_AGENCIES) p.append("conditions[agencies][]", a);
    for (const f of ["title", "agencies", "publication_date", "html_url", "type"]) {
      p.append("fields[]", f);
    }

    const res = await fetch(`https://www.federalregister.gov/api/v1/documents.json?${p}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });

    if (!res.ok) return { items: [], error: `Federal Register responded ${res.status}` };

    const json: unknown = await res.json();
    const rows = (json as { results?: Record<string, unknown>[] })?.results ?? [];

    const items: Notice[] = rows.map((r) => ({
      title: String(r["title"] ?? "Untitled document"),
      agencies: Array.isArray(r["agencies"])
        ? (r["agencies"] as { name?: string }[]).map((a) => a?.name ?? "").filter(Boolean)
        : [],
      date: String(r["publication_date"] ?? ""),
      type: String(r["type"] ?? "Document"),
      url: String(r["html_url"] ?? "https://www.federalregister.gov/"),
    }));

    return { items, error: null };
  } catch (e) {
    return { items: [], error: reason(e) };
  }
}

/**
 * Open solicitations from SAM.gov. This is the only source needing a
 * credential — set SAM_API_KEY in .env.local. Without it the panel renders a
 * setup prompt instead of failing.
 */
export async function fetchOpportunities(limit = 8): Promise<FeedResult<Opportunity>> {
  const key = process.env.SAM_API_KEY;
  if (!key) return { items: [], error: NOT_CONFIGURED };

  // SAM's `ncode` takes a single 6-digit code, so each NAICS is its own
  // request and the results are merged. Overridable base URL lets the
  // integration be exercised against a local mock without a live key.
  const base = process.env.SAM_API_BASE ?? "https://api.sam.gov";

  async function one(code: string): Promise<Record<string, unknown>[]> {
    const p = new URLSearchParams({
      api_key: key!,
      limit: String(limit),
      postedFrom: samDate(isoDaysAgo(30)),
      postedTo: samDate(isoToday()),
      ptype: "o", // o = Solicitation (open for bid)
      ncode: code,
    });

    const res = await fetch(`${base}/opportunities/v2/search?${p}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      // SAM's gateway answers a missing or invalid api_key with a bare 404
      // (empty body) rather than 401/403 — verified against the live host.
      if (res.status === 404 || res.status === 401 || res.status === 403) {
        throw new Error("SAM_API_KEY missing or rejected — confirm the key is active");
      }
      throw new Error(`SAM.gov responded ${res.status}`);
    }

    const json: unknown = await res.json();
    return (json as { opportunitiesData?: Record<string, unknown>[] })?.opportunitiesData ?? [];
  }

  try {
    const batches = await Promise.all(IT_NAICS.map(one));

    // Merge, drop duplicates (a notice can carry more than one NAICS), then
    // order by soonest response deadline — the useful order for a bid team.
    const seen = new Set<string>();
    const items: Opportunity[] = [];

    for (const row of batches.flat()) {
      const url = String(row["uiLink"] ?? "https://sam.gov/search");
      if (seen.has(url)) continue;
      seen.add(url);
      items.push({
        title: String(row["title"] ?? "Untitled solicitation"),
        agency:
          [row["department"], row["subTier"]].filter(Boolean).join(" / ") ||
          String(row["fullParentPathName"] ?? "—"),
        posted: String(row["postedDate"] ?? ""),
        deadline: (row["responseDeadLine"] as string | null) ?? null,
        naics: String(row["naicsCode"] ?? ""),
        type: String(row["type"] ?? ""),
        url,
      });
    }

    items.sort(byDeadline);

    return { items: items.slice(0, limit), error: null };
  } catch (e) {
    return { items: [], error: reason(e) };
  }
}

/**
 * Keyless fallback for the pipeline panel: federal *grant* opportunities from
 * Grants.gov, including forecasted (not yet open) postings. This is a
 * different instrument to a contract solicitation and is labelled as such in
 * the UI — it is not a stand-in for SAM.gov data.
 */
export async function fetchGrantOpportunities(limit = 6): Promise<FeedResult<Opportunity>> {
  try {
    const res = await fetch("https://api.grants.gov/v1/api/search2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        rows: limit,
        keyword: "information technology",
        oppStatuses: "forecasted|posted",
      }),
    });

    if (!res.ok) return { items: [], error: `Grants.gov responded ${res.status}` };

    const json: unknown = await res.json();
    const rows =
      (json as { data?: { oppHits?: Record<string, unknown>[] } })?.data?.oppHits ?? [];

    const items: Opportunity[] = rows.map((r) => ({
      title: String(r["title"] ?? "Untitled opportunity"),
      agency: String(r["agency"] ?? r["agencyCode"] ?? "—"),
      posted: String(r["openDate"] ?? ""),
      deadline: (r["closeDate"] as string | null) || null,
      naics: String(r["oppNumber"] ?? r["number"] ?? ""),
      type: String(r["oppStatus"] ?? ""),
      url: `https://www.grants.gov/search-results-detail/${String(r["id"] ?? "")}`,
    }));

    // Soonest close date first, undated last — "forecasted" includes long-open
    // BAAs, so without this the list leads with years-old postings.
    items.sort(byDeadline);

    return { items, error: null };
  } catch (e) {
    return { items: [], error: reason(e) };
  }
}

export function formatUsd(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}
