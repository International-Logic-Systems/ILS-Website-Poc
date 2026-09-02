import Link from "next/link";
import SectionLabel from "@/components/SectionLabel";
import MigrationHero from "@/components/MigrationHero";
import { org, solutions, services, customers, sec } from "@/lib/content";
import { getNews } from "@/lib/site-content";
import { vehicles, statusOf } from "@/lib/vehicles";
import StatusBadge from "@/components/StatusBadge";

const STATS = [
  { num: "25", sup: "+", label: "Years delivering" },
  { num: "07", sup: null, label: "Federal customers" },
  { num: "ML3", sup: null, label: "CMMI-DEV/SVC appraised" },
];

export const revalidate = 60;

export default async function Home() {
  const news = await getNews();

  return (
    <>
      {/* Hero — the only place besides the nav that runs on forest */}
      <section className="on-forest is-soft">
        <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-8 py-24 xl:grid-cols-[minmax(0,1fr)_minmax(0,540px)]">
          <div>
            <span className="kicker rise block">
              <span className="opacity-50">//</span> AI-enabled software engineering · Federal
            </span>
            <h1 className="display rise rise-1 mt-[22px] text-[clamp(38px,3.9vw,54px)] font-extrabold leading-[1.06]">
              Legacy systems, modernized at <span className="grad-text">mission speed</span>.
            </h1>
            <p className="rise rise-2 mt-6 max-w-[540px] text-[18px] leading-[1.7] text-soft">
              {org.heroLede}
            </p>
            <div className="rise rise-3 mt-9 flex flex-wrap items-center gap-4">
              <Link href="/contact" className="btn-primary">
                Schedule a capability briefing
              </Link>
              <Link href="/contracts" className="btn-ghost">
                View contract vehicles
              </Link>
            </div>
            {/* The marks a contracting officer checks first, stated up front
                rather than buried on a compliance page. */}
            <ul className="rise rise-3 mt-10 flex flex-wrap gap-x-px gap-y-px">
              {org.compliance.map((c) => (
                <li key={c} className="chip">
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="rise rise-2">
            <MigrationHero embedded />
          </div>
        </div>
      </section>

      {/* Contract vehicle strip */}
      <section className="border-b border-line bg-panel">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-8 px-8 py-10 md:grid-cols-[repeat(3,1fr)_auto]">
          {vehicles.slice(0, 3).map((v) => (
            <div key={v.slug}>
              <span className="mono-label mb-2 block">{v.short}</span>
              <span className="font-mono text-[17px] text-ink">{v.number}</span>
            </div>
          ))}
          <Link
            href="/contracts"
            className="text-[15px] font-semibold text-signal underline underline-offset-4 hover:text-signal-deep"
          >
            All vehicle detail &rarr;
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="py-28">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 px-8 md:grid-cols-3">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`px-12 ${i === 0 ? "border-l-0 !pl-0" : "border-l border-line"} max-md:!px-0 max-md:border-l-0 max-md:pb-10`}
            >
              <div className="stat-num">
                {s.num}
                {s.sup && <sup>{s.sup}</sup>}
              </div>
              <span className="kicker mt-3.5 block">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Solutions strip */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-[1180px] px-8 py-16">
          <SectionLabel code={sec("/", "SOLUTIONS", 1)} title="What we solve" />
          <div className="grid gap-px border border-line bg-line md:grid-cols-5">
            {solutions.map((s) => (
              <Link
                key={s.title}
                href="/capabilities"
                className="card-rail group bg-panel p-5 transition-colors hover:bg-raise"
              >
                <p className="display text-sm font-semibold leading-snug group-hover:text-signal">
                  {s.title}
                </p>
                <p className="mono-label mt-3">View brief →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Services preview */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-[1180px] px-8 py-16">
          <SectionLabel
            code={sec("/", "CAPABILITIES", 2)}
            title="Services built on 25+ years of delivery"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.slice(0, 6).map((s) => (
              <div key={s.title} className="hairline-card p-5">
                <p className="mono-label">{s.tags}</p>
                <h3 className="display mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-mute">{s.body}</p>
              </div>
            ))}
          </div>
          <Link href="/capabilities" className="mono-label mt-6 inline-block !text-signal hover:underline">
            All twelve service lines →
          </Link>
        </div>
      </section>

      {/* Customers + vehicles */}
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-[1180px] gap-12 px-8 py-16 md:grid-cols-2">
          <div>
            <SectionLabel code={sec("/", "CUSTOMERS", 3)} title="Trusted in production" />
            <ul className="space-y-4">
              {customers.map((c) => (
                <li key={c.name} className="hairline-card p-5">
                  <p className="display font-semibold">{c.name}</p>
                  <p className="mt-1 text-sm text-mute">{c.detail}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionLabel code={sec("/", "VEHICLES", 4)} title="Ways to buy" />
            <ul className="space-y-4">
              {vehicles.map((v) => (
                <li key={v.slug}>
                  <Link href={`/contracts/${v.slug}`} className="hairline-card card-rail group block p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="mono-label">{v.agency}</p>
                      <StatusBadge status={statusOf(v)} />
                    </div>
                    <p className="display mt-1 font-semibold group-hover:text-signal">{v.name}</p>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/contracts" className="mono-label mt-6 inline-block !text-signal hover:underline">
              Vehicle details →
            </Link>
          </div>
        </div>
      </section>

      {/* Latest record */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-[1180px] px-8 py-16">
          <SectionLabel code={sec("/", "RECORD", 5)} title="Latest from the ledger" />
          <div className="grid gap-4 md:grid-cols-3">
            {news.slice(0, 3).map((n) => (
              <div key={n.id} className="hairline-card p-5">
                <p className="kicker">{n.date}</p>
                <h3 className="display mt-2 font-semibold">{n.title}</h3>
                <p className="mt-2 text-sm text-mute">{n.body}</p>
              </div>
            ))}
          </div>
          <Link href="/news" className="mono-label mt-6 inline-block !text-signal hover:underline">
            Full record →
          </Link>
        </div>
      </section>
    </>
  );
}
