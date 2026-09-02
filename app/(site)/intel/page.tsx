import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import SectionLabel from "@/components/SectionLabel";
import FeedPanel from "@/components/FeedPanel";
import {
  fetchAwards,
  fetchNotices,
  fetchOpportunities,
  fetchGrantOpportunities,
  formatUsd,
  NOT_CONFIGURED,
} from "@/lib/feeds";
import { sec } from "@/lib/content";

export const metadata: Metadata = {
  title: "Market Intel",
  description:
    "Live federal market feed — recent IT contract awards, open solicitations, and agency notices, pulled from USAspending.gov, SAM.gov, and the Federal Register.",
};

// The only non-static route on the site. Page-level ISR (rather than per-fetch
// caching) because USAspending is a POST and Next's Data Cache only covers GET.
export const revalidate = 3600;

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function Intel() {
  // Fired concurrently — one slow source doesn't serialize the others.
  const [awards, samOpps, notices] = await Promise.all([
    fetchAwards(8),
    fetchOpportunities(6),
    fetchNotices(8),
  ]);

  // SAM.gov needs a credential we may not have. Rather than show an empty
  // panel, fall back to keyless Grants.gov data — labelled as grants, since it
  // is a different instrument to a contract solicitation.
  const usingFallback = samOpps.error === NOT_CONFIGURED;
  const opportunities = usingFallback ? await fetchGrantOpportunities(6) : samOpps;

  const updated = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });

  return (
    <>
      <PageHero
        code={sec("/intel", "MARKET INTEL")}
        title="Federal market feed."
        lede="Live procurement signal from public federal open-data APIs — recent IT contract awards, open solicitations, and agency notices, filtered to the NAICS codes and agencies ILS competes in."
      />

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <SectionLabel code={sec("/intel", "AWARDS", 1)} title="Recent IT contract awards" />
          <FeedPanel
            label="CONTRACT AWARDS · LAST 60 DAYS"
            source="USASPENDING.GOV"
            sourceUrl="https://www.usaspending.gov/"
            count={awards.items.length}
            error={awards.error}
          >
            <ul className="divide-y divide-line">
              {awards.items.map((a) => (
                <li key={a.id} className="px-4 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="display font-medium hover:text-signal"
                    >
                      {a.recipient}
                    </a>
                    <span className="font-mono text-sm text-live">{formatUsd(a.amount)}</span>
                  </div>
                  <p className="mono-label mt-1.5">
                    {a.agency}
                    {a.subAgency && a.subAgency !== a.agency ? ` · ${a.subAgency}` : ""}
                  </p>
                  {a.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-mute">
                      {a.description.toLowerCase()}
                    </p>
                  )}
                  <p className="mono-label mt-2 text-[10px]">
                    PoP START {fmtDate(a.popStart)}
                    {a.naics ? ` · NAICS ${a.naics}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </FeedPanel>
        </div>
      </section>

      <section>
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-2">
          <div>
            <SectionLabel
              code={sec("/intel", "PIPELINE", 2)}
              title={usingFallback ? "Grant opportunities" : "Open solicitations"}
            />
            <FeedPanel
              label={
                usingFallback
                  ? "GRANTS · FORECASTED + POSTED"
                  : "SOLICITATIONS · OPEN FOR BID"
              }
              source={usingFallback ? "GRANTS.GOV" : "SAM.GOV"}
              sourceUrl={usingFallback ? "https://www.grants.gov/search-grants" : "https://sam.gov/search"}
              count={opportunities.items.length}
              error={opportunities.error}
              note={
                usingFallback
                  ? "Showing federal grant opportunities — SAM.gov contract solicitations need an API key (see below)."
                  : undefined
              }
            >
              <ul className="divide-y divide-line">
                {opportunities.items.map((o, i) => (
                  <li key={`${o.url}-${i}`} className="px-4 py-4">
                    <a
                      href={o.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="display text-sm font-medium hover:text-signal"
                    >
                      {o.title}
                    </a>
                    <p className="mono-label mt-1.5">{o.agency}</p>
                    <p className="mono-label mt-2 text-[10px]">
                      POSTED {fmtDate(o.posted)} · RESPONSE DUE {fmtDate(o.deadline)}
                      {/* Grants carry an opportunity number, not a NAICS code. */}
                      {o.naics ? ` · ${usingFallback ? "OPP NO" : "NAICS"} ${o.naics}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </FeedPanel>
          </div>

          <div>
            <SectionLabel code={sec("/intel", "REGULATORY", 3)} title="Agency notices" />
            <FeedPanel
              label="FEDERAL REGISTER · TARGET AGENCIES"
              source="FEDERALREGISTER.GOV"
              sourceUrl="https://www.federalregister.gov/"
              count={notices.items.length}
              error={notices.error}
            >
              <ul className="divide-y divide-line">
                {notices.items.map((n, i) => (
                  <li key={`${n.url}-${i}`} className="px-4 py-4">
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="display text-sm font-medium hover:text-signal"
                    >
                      {n.title}
                    </a>
                    <p className="mono-label mt-1.5">{n.agencies.join(" · ") || "—"}</p>
                    <p className="mono-label mt-2 text-[10px]">
                      {n.type.toUpperCase()} · {fmtDate(n.date)}
                    </p>
                  </li>
                ))}
              </ul>
            </FeedPanel>
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-8">
          <p className="mono-label">
            REGENERATED HOURLY · LAST BUILT {updated} UTC
            {usingFallback ? " · SAM.GOV KEY NOT SET" : ""}
          </p>
          {usingFallback && (
            <p className="mt-2 max-w-3xl text-sm text-mute">
              To switch the pipeline panel from grants to federal contract solicitations, register
              a free key at{" "}
              <a
                href="https://api.sam.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-signal hover:underline"
              >
                api.sam.gov
              </a>{" "}
              and set <code className="font-mono text-fg">SAM_API_KEY</code> in{" "}
              <code className="font-mono text-fg">.env.local</code>, then rebuild. No code change
              is required.
            </p>
          )}
          <p className="mt-2 max-w-3xl text-sm text-mute">
            Sources are public federal open-data APIs and are shown unedited. Award and
            solicitation records are authoritative only at their source — follow any link for
            official detail. ILS is not affiliated with the agencies listed.
          </p>
        </div>
      </section>
    </>
  );
}
