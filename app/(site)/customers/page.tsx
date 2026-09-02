import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { customers, sec } from "@/lib/content";

export const metadata: Metadata = { title: "Customers" };

export default function Customers() {
  return (
    <>
      <PageHero
        code={sec("/customers", "CUSTOMERS")}
        title="Trusted where failure isn't an option."
        lede="ILS delivers for federal agencies and national infrastructure operators — in production, at scale."
      />
      <section>
        <div className="mx-auto max-w-6xl space-y-4 px-5 py-16">
          {customers.map((c) => (
            <a key={c.name} href={c.url} className="hairline-card card-rail block p-6">
              <p className="display text-xl font-medium">{c.name}</p>
              <p className="mt-2 max-w-2xl text-sm text-mute">{c.detail}</p>
              <p className="mono-label mt-4 text-signal">Visit agency →</p>
            </a>
          ))}
          <blockquote className="border-l-2 border-signal p-6">
            <p className="display text-lg">
              “ILS made a smooth transition of the business requirement to partnering the technical considerations in a
              changing environment.”
            </p>
            <p className="mono-label mt-3">Customer testimonial</p>
          </blockquote>
        </div>
      </section>
    </>
  );
}
