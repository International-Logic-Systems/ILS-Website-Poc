import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { sec } from "@/lib/content";
import { getNews } from "@/lib/site-content";

export const metadata: Metadata = { title: "News" };

// Rendered on demand so an admin publish is live on the next request. The
// publish route revalidates this path explicitly.
export const revalidate = 60;

export default async function News() {
  const news = await getNews();

  return (
    <>
      <PageHero
        code={sec("/news", "RECORD")}
        title="The record, in order."
        lede="Major events from years past up to today — certifications, awards, and deliveries."
      />
      <section>
        <div className="mx-auto max-w-4xl px-5 py-16">
          <ol className="relative space-y-8 border-l border-line pl-8">
            {news.map((n) => (
              <li key={n.id} className="relative">
                <span className="absolute -left-[2.35rem] top-1.5 h-2 w-2 rounded-full bg-signal" aria-hidden />
                <p className="kicker">{n.date}</p>
                <h2 className="display mt-1 text-lg font-medium">{n.title}</h2>
                <p className="mt-2 text-sm text-mute">{n.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
