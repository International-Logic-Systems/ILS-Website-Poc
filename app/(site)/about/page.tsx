import type { Metadata } from "next";
import Image from "next/image";
import PageHero from "@/components/PageHero";
import SectionLabel from "@/components/SectionLabel";
import { cmmi, org, sec } from "@/lib/content";

export const metadata: Metadata = { title: "About" };

const pillars = [
  {
    title: "Who we are",
    body: "A government contractor in the Washington, DC area, ILS brings deep industry experience and talented professionals to every engagement. We are committed to delivering innovative solutions to our clients.",
  },
  {
    title: "What we do",
    body: "ILS provides integrated IT services and flexible solutions to government and private organizations — from agile program management and software development to AI, business intelligence, and legacy modernization.",
  },
  {
    title: "Our mission",
    body: "Provide state-of-the-art services and unparalleled performance, founded on more than 25 years of best practices, dependability, and solid infrastructure. Integrity is emphasized in all relationships with clients, partners, and suppliers.",
  },
];

const creds = [
  {
    name: `CMMI ${cmmi.level}`,
    detail: `Appraised at ${cmmi.level} against both CMMI for Development (CMMI-DEV) and CMMI for Services (CMMI-SVC). Appraisal #${cmmi.appraisalNumber}, valid to ${cmmi.expiresLabel}.`,
  },
  { name: "ISO 9001:2015", detail: "Quality Management System governing software development and service delivery. Recertified August 2024 by BSI Group." },
  { name: "ISO/IEC 27001:2022", detail: "Information Security Management System covering planning, program management, and software operations. Recertified August 2024 by BSI Group." },
];

export default function About() {
  return (
    <>
      <PageHero code={sec("/about", "ABOUT")} title="We're proud of who we are." lede={org.sub} />
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid gap-px border border-line bg-line md:grid-cols-3">
            {pillars.map((p) => (
              <div key={p.title} className="bg-panel p-6">
                <h2 className="display text-xl font-medium">{p.title}</h2>
                <p className="mt-3 text-sm text-mute">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <SectionLabel code={sec("/about", "APPRAISAL", 1)} title="CMMI appraisal" />

          <div className="hairline-card flex flex-wrap items-start justify-between gap-8 p-8">
            <div className="max-w-xl">
              <p className="display text-xl font-bold">
                {cmmi.unit} appraised at CMMI {cmmi.level}
              </p>
              <p className="mono-label mt-2">{cmmi.models.join(" · ")}</p>
              <p className="mt-3 text-sm text-mute">
                CMMI is a performance model for improving capability and aligning delivery to
                business goals. An appraisal at {cmmi.level} means processes are well characterised
                and understood, described in standards, procedures, tools and methods, and improved
                over time.
              </p>
              {/* Crediting the Partner organization is required, and ISACA must
                  never be named as the appraiser. */}
              {cmmi.leadAppraiser && (
                <p className="mt-4 text-sm text-mute">
                  The appraisal was performed by <strong>{cmmi.leadAppraiser}</strong>.
                </p>
              )}
              <p className="mt-2 text-sm text-mute">
                {/* Verifiable rather than asserted: the identifier and the public record. */}
                Appraisal&nbsp;#{cmmi.appraisalNumber} · valid to {cmmi.expiresLabel}
              </p>
              <a
                href={cmmi.parsUrl}
                target="_blank"
                rel="noreferrer"
                className="mono-label mt-4 inline-block !text-signal hover:underline"
              >
                Verify in the Published Appraisal Results directory ↗
              </a>
            </div>

            {/* The Appraisal Mark is shown only when the supplied PNG is in
                place — it may not be recreated, recoloured or redrawn. */}
            {cmmi.markSrc && (
              <a
                href={cmmi.parsUrl}
                target="_blank"
                rel="noreferrer"
                title="Verify this appraisal in the Published Appraisal Results directory"
                className="shrink-0"
              >
                {/* Supplied PNG, unaltered. Height is the guidelines' floor and
                    the file is never enlarged past its native 701×254. Margin
                    equals the mark height, their minimum clear space. */}
                <Image
                  src={cmmi.markSrc}
                  alt={cmmi.markAlt}
                  width={701}
                  height={254}
                  className="m-[56px] h-[56px] w-auto"
                  unoptimized
                />
              </a>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <SectionLabel code={sec("/about", "CREDENTIALS", 2)} title="Certified. Appraised. Current." />
          <div className="grid gap-4 md:grid-cols-3">
            {creds.map((c) => (
              <div key={c.name} className="hairline-card p-5">
                <p className="mono-label flex items-center gap-2">
                  <span className="status-dot" aria-hidden /> ACTIVE
                </p>
                <h3 className="display mt-2 font-medium">{c.name}</h3>
                <p className="mt-2 text-sm text-mute">{c.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
