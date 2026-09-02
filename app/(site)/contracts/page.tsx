import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import StatusBadge from "@/components/StatusBadge";
import { vehicles, statusOf, periodOf } from "@/lib/vehicles";
import { sec } from "@/lib/content";

export const metadata: Metadata = { title: "Contracts" };

// Status is computed from the period of performance at render time, so the
// listing re-checks itself daily rather than freezing at build.
export const revalidate = 86400;

export default function Contracts() {
  return (
    <>
      <PageHero
        code={sec("/contracts", "CONTRACTS")}
        title="Three ways to put us on contract."
        lede="Contract numbers, periods of performance, awarded task areas and the people who answer for each vehicle. Status is derived from the period of performance, not asserted."
      />

      <section>
        <div className="mx-auto max-w-[1180px] px-8 py-16">
          <ul className="grid gap-4 lg:grid-cols-3">
            {vehicles.map((v) => (
              <li key={v.slug}>
                <Link
                  href={`/contracts/${v.slug}`}
                  className="hairline-card card-rail group flex h-full flex-col p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="mono-label">{v.short}</span>
                    <StatusBadge status={statusOf(v)} />
                  </div>

                  <h2 className="display mt-3 text-lg font-semibold group-hover:text-signal">
                    {v.name}
                  </h2>
                  <p className="mono-label mt-1 !normal-case !tracking-normal">{v.agency}</p>

                  <p className="mt-4 flex-1 text-sm text-mute">{v.summary}</p>

                  <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-mute">Contract</dt>
                      <dd className="font-mono text-ink">{v.number}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-mute">Period</dt>
                      <dd className="text-right text-ink">{periodOf(v)}</dd>
                    </div>
                  </dl>

                  <span className="mono-label mt-5 !text-signal group-hover:underline">
                    Full detail →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
