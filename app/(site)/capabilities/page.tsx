import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import SectionLabel from "@/components/SectionLabel";
import { solutions, services, sec } from "@/lib/content";

export const metadata: Metadata = { title: "Capabilities" };

export default function Capabilities() {
  return (
    <>
      <PageHero
        code={sec("/capabilities", "CAPABILITIES")}
        title="From legacy assessment to zero-downtime cutover."
        lede="Twelve service lines, one delivery model. ILS assesses what an agency runs today, plans the route off it, and builds the replacement — COBOL and mainframe through to cloud-native services — with AI-accelerated engineering compressing the work at every step."
      />
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <SectionLabel code={sec("/capabilities", "SOLUTIONS", 1)} title="How we engage" />
          <div className="space-y-px border border-line bg-line">
            {solutions.map((s) => (
              <div key={s.title} className="grid gap-3 bg-panel p-6 md:grid-cols-[280px_1fr]">
                <h3 className="display font-medium">{s.title}</h3>
                <p className="text-sm text-mute">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <SectionLabel code={sec("/capabilities", "SERVICES", 2)} title="What we build and run" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div key={s.title} className="hairline-card p-5">
                <p className="mono-label">{s.tags}</p>
                <h3 className="display mt-2 text-lg font-medium">{s.title}</h3>
                <p className="mt-2 text-sm text-mute">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <SectionLabel code={sec("/capabilities", "STATEMENT", 3)} title="Capability statement" />
          <div className="hairline-card flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <p className="display font-medium">ILS Capability Statement 2025</p>
              <p className="mt-1 text-sm text-mute">Vehicles, NAICS codes, past performance and points of contact, on two pages.</p>
            </div>
            <a
              href="https://intllogic.com/text/2025%20ILS%20Capability%20Statement.pdf"
              className="border border-signal-dim px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-signal hover:bg-signal hover:text-white"
            >
              Download PDF · 371 KB
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
