import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import SectionLabel from "@/components/SectionLabel";
import {
  vehicles,
  vehicleBySlug,
  statusOf,
  periodOf,
  formatDate,
  STATUS_LABEL,
} from "@/lib/vehicles";
import { sec } from "@/lib/content";

export const revalidate = 86400;

export function generateStaticParams() {
  return vehicles.map((v) => ({ vehicle: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vehicle: string }>;
}): Promise<Metadata> {
  const v = vehicleBySlug((await params).vehicle);
  if (!v) return { title: "Contract" };
  return { title: v.name, description: v.summary };
}

export default async function VehicleDetail({
  params,
}: {
  params: Promise<{ vehicle: string }>;
}) {
  const v = vehicleBySlug((await params).vehicle);
  if (!v) notFound();

  const status = statusOf(v);

  return (
    <>
      {/* Hero carries the identifying facts, so the contract number and period
          are visible without scrolling. */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1180px] px-8 pb-14 pt-20 md:pt-24">
          <Link href="/contracts" className="kicker hover:underline">
            ← {sec("/contracts", "CONTRACTS")}
          </Link>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <h1 className="display max-w-4xl text-[clamp(36px,4.6vw,62px)] font-extrabold leading-[1.0] tracking-[-0.03em] text-ink">
              {v.name}
            </h1>
            <StatusBadge status={status} />
          </div>

          <p className="mt-4 max-w-2xl text-[19px] leading-[1.6] text-mute">{v.fullName}</p>

          <dl className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: "Awarding agency", val: v.agency },
              { k: "Contract number", val: v.number, mono: true },
              { k: "Period of performance", val: periodOf(v) },
              { k: "Status", val: `${STATUS_LABEL[status]} · ends ${formatDate(v.end)}` },
            ].map((f) => (
              <div key={f.k} className="bg-panel px-4 py-3.5">
                <dt className="mono-label text-[11px]">{f.k}</dt>
                <dd className={`mt-1.5 text-sm text-ink ${f.mono ? "font-mono" : ""}`}>{f.val}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Overview */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1180px] px-8 py-16">
          <SectionLabel code={sec("/contracts", "OVERVIEW", 1)} title="Contract overview" />
          <div className="max-w-3xl space-y-4">
            {v.overview.map((p) => (
              <p key={p} className="text-mute">
                {p}
              </p>
            ))}
            {v.external && (
              <p>
                <a
                  href={v.external.href}
                  className="text-sm font-semibold text-signal underline underline-offset-4 hover:text-signal-deep"
                  target="_blank"
                  rel="noreferrer"
                >
                  {v.external.label} ↗
                </a>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Task areas / functional areas */}
      {v.scope && (
        <section className="border-b border-line">
          <div className="mx-auto max-w-[1180px] px-8 py-16">
            <SectionLabel code={sec("/contracts", "SCOPE", 2)} title={v.scope.label} />
            <ul className="grid gap-px border border-line bg-line sm:grid-cols-2">
              {v.scope.items.map((item) => (
                <li key={item} className="flex gap-3 bg-panel p-5 text-sm">
                  <span className="status-dot mt-2 !bg-signal" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Special item numbers */}
      {v.sins && (
        <section className="border-b border-line">
          <div className="mx-auto max-w-[1180px] px-8 py-16">
            <SectionLabel code={sec("/contracts", "SINS", 2)} title="Special item numbers" />
            <div className="grid gap-4 md:grid-cols-2">
              {v.sins.map((s) => (
                <div key={s.code} className="hairline-card p-6">
                  <p className="mono-label !text-signal">{s.code}</p>
                  <h3 className="display mt-2 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-mute">{s.body}</p>
                  {s.note && (
                    <p className="mt-3 border-t border-line pt-3 text-sm text-mute">
                      <span className="mono-label !text-ink">Note</span> {s.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Terms + documents */}
      {(v.terms || v.documents) && (
        <section className="border-b border-line">
          <div className="mx-auto grid max-w-[1180px] gap-12 px-8 py-16 md:grid-cols-2">
            <div>
              <SectionLabel code={sec("/contracts", "TERMS", 3)} title="About the contract" />
              <dl className="divide-y divide-line border-y border-line">
                <div className="flex justify-between gap-4 py-3 text-sm">
                  <dt className="text-mute">Contract number</dt>
                  <dd className="font-mono">{v.number}</dd>
                </div>
                <div className="flex justify-between gap-4 py-3 text-sm">
                  <dt className="text-mute">Period of performance</dt>
                  <dd className="text-right">{periodOf(v)}</dd>
                </div>
                {v.terms?.map((t) => (
                  <div key={t.label} className="flex justify-between gap-4 py-3 text-sm">
                    <dt className="text-mute">{t.label}</dt>
                    <dd className="text-right">{t.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {v.documents && (
              <div>
                <SectionLabel code={sec("/contracts", "DOCUMENTS", 4)} title="Contract documents" />
                <ul className="divide-y divide-line border-y border-line">
                  {v.documents.map((d) => (
                    <li key={d.href}>
                      <a
                        href={d.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-4 py-3.5 text-sm hover:text-signal"
                      >
                        <span className="font-medium">{d.label}</span>
                        <span className="mono-label shrink-0">PDF · {d.size}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Points of contact */}
      <section>
        <div className="mx-auto max-w-[1180px] px-8 py-16">
          <SectionLabel code={sec("/contracts", "CONTACT", 5)} title="Points of contact" />
          <div className="grid gap-4 md:grid-cols-3">
            {v.pocs.map((p) => (
              <div key={p.name + p.role} className="hairline-card p-6">
                <p className="display font-semibold">{p.name}</p>
                <p className="mt-1 text-sm text-mute">{p.role}</p>
                <dl className="mt-4 space-y-1.5 text-sm">
                  <div>
                    <dt className="sr-only">Email</dt>
                    <dd>
                      <a
                        href={`mailto:${p.email}`}
                        className="break-all text-signal hover:underline"
                      >
                        {p.email}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="sr-only">Phone</dt>
                    <dd className="font-mono text-mute">{p.phone}</dd>
                  </div>
                  {p.fax && (
                    <div>
                      <dt className="sr-only">Fax</dt>
                      <dd className="font-mono text-mute">Fax {p.fax}</dd>
                    </div>
                  )}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
