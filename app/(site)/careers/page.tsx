import type { Metadata } from "next";
import { Banknote, Clock, Stethoscope, PiggyBank, GraduationCap, UserPlus } from "lucide-react";
import PageHero from "@/components/PageHero";
import SectionLabel from "@/components/SectionLabel";
import { benefits, careersPortal, sec } from "@/lib/content";
import { getOpenPositions } from "@/lib/careers-feed";

export const metadata: Metadata = { title: "Careers" };

/** Openings are read from iCIMS hourly; the portal stays the system of record. */
export const revalidate = 3600;

const ICONS = {
  compensation: Banknote,
  timeoff: Clock,
  medical: Stethoscope,
  retirement: PiggyBank,
  education: GraduationCap,
  referral: UserPlus,
} as const;

export default async function Careers() {
  const positions = await getOpenPositions();

  return (
    <>
      <PageHero
        code={sec("/careers", "CAREERS")}
        title="Join the team behind the record."
        lede="At ILS, we understand the value of good talent. Our staff members play a vital role in delivering excellent products and services to our customers."
      />

      <section className="border-b border-line">
        <div className="mx-auto max-w-[1180px] px-8 py-16">
          <SectionLabel
            code={sec("/careers", "OPENINGS", 1)}
            title={
              positions.length
                ? `${positions.length} open position${positions.length === 1 ? "" : "s"}`
                : "Current openings"
            }
          />

          {positions.length > 0 ? (
            <>
              <ul className="grid gap-4">
                {positions.map((p) => (
                  <li key={p.id}>
                    {/* Straight through to that posting on the portal, where the
                        application actually happens. */}
                    <a
                      href={p.href}
                      target="_blank"
                      rel="noreferrer"
                      className="hairline-card card-rail group block p-6"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                        <h3 className="display text-lg font-bold group-hover:text-signal">
                          {p.title}
                        </h3>
                        <span className="mono-label shrink-0">
                          {[p.location, p.category].filter(Boolean).join(" · ")}
                        </span>
                      </div>
                      {p.summary && (
                        <p className="mt-3 max-w-3xl text-sm text-mute">{p.summary}…</p>
                      )}
                      <span className="mono-label mt-4 inline-block !text-signal group-hover:underline">
                        View and apply on our careers portal ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mono-label mt-6">
                Listings come straight from our applicant tracking system.
              </p>
            </>
          ) : (
            // No invented roles: if the portal cannot be reached, say so and
            // send people to the one place that is always right.
            <div className="hairline-card p-8">
              <p className="display text-lg font-semibold">
                We could not load our openings just now.
              </p>
              <p className="mt-2 text-sm text-mute">
                Every current role is listed on our careers portal — the search below always shows
                what is genuinely open.
              </p>
            </div>
          )}

          <div className="hairline-card mt-6 flex flex-wrap items-center justify-between gap-6 p-8">
            <div className="max-w-xl">
              <p className="display text-lg font-semibold">
                We are actively seeking team members looking for challenging, rewarding work.
              </p>
              <p className="mt-2 text-sm text-mute">
                Every opening lives in our applicant tracking system, so what you see there is
                always current. The link goes straight to the search results.
              </p>
            </div>
            <a
              href={careersPortal}
              target="_blank"
              rel="noreferrer"
              className="btn-primary !text-white"
            >
              Search open positions ↗
            </a>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[1180px] px-8 py-16">
          <SectionLabel code={sec("/careers", "BENEFITS", 2)} title="Employee benefits" />
          <p className="max-w-3xl text-mute">
            At ILS, we appreciate our employees&apos; hard work and dedication. We are committed to
            providing a comprehensive benefits package to support the needs of our employees and
            their families.
          </p>

          <ul className="mt-10 grid gap-px border border-line bg-line md:grid-cols-2">
            {benefits.map((b) => {
              const Icon = ICONS[b.icon];
              return (
                <li key={b.title} className="bg-panel p-6">
                  <div className="flex items-center gap-3">
                    <Icon className="size-5 shrink-0 text-signal" aria-hidden />
                    <h3 className="display text-lg font-semibold">{b.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-mute">{b.body}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
