import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import SectionLabel from "@/components/SectionLabel";
import LinkedInIcon from "@/components/LinkedInIcon";
import { leadership, org, sec } from "@/lib/content";

export const metadata: Metadata = {
  title: "Leadership",
  description:
    "The leadership team at International Logic Systems, Inc. — executive and delivery leadership behind 25+ years of federal software and AI programs.",
};

export default function Leadership() {
  return (
    <>
      <PageHero
        code={sec("/leadership", "LEADERSHIP")}
        title="The people accountable for delivery."
        lede={`Executive and delivery leadership at ${org.short} — the team behind our CMMI Level 3 appraisal, ISO certifications, and 25+ years of federal past performance.`}
      />

      <section>
        <div className="mx-auto max-w-[1180px] px-8 py-16">
          <SectionLabel code={sec("/leadership", "TEAM", 1)} title="Leadership team" />

          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {leadership.map((person, i) => (
              <li
                key={person.name}
                // Rail on every card here by choice: the team tiles read as a
                // set, and one card lighting up while its neighbours stay dead
                // looked broken. The LinkedIn link inside is the target once a
                // profile URL is filled in.
                className={`hairline-card card-rail rise rise-${i + 1} flex flex-col p-7`}
              >
                <div className="flex items-center gap-4">
                  {/* Monogram stands in until real portraits are supplied. */}
                  <span className="monogram" aria-hidden>
                    {person.initials}
                  </span>
                  <div className="min-w-0">
                    <h3 className="display text-xl font-bold leading-tight">{person.name}</h3>
                    <p className="kicker mt-1.5">{person.role}</p>
                  </div>
                </div>

                <div className="mt-7 flex items-center justify-between gap-3 border-t border-line pt-5">
                  <span className="mono-label">{org.short} leadership</span>

                  {person.linkedin ? (
                    <a
                      href={person.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mono-label flex items-center gap-2 !text-signal transition-colors hover:underline"
                    >
                      <LinkedInIcon className="h-3.5 w-3.5" />
                      LinkedIn ↗
                    </a>
                  ) : (
                    // Shown inert rather than hidden: the row keeps its height,
                    // so a card with a profile and one without stay the same
                    // shape in the grid.
                    <span
                      className="mono-label flex items-center gap-2 opacity-40"
                      title="LinkedIn profile not yet published"
                    >
                      <LinkedInIcon className="h-3.5 w-3.5" />
                      LinkedIn
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
