"use client";

import { useState } from "react";
import PageHero from "@/components/PageHero";
import { org, sec } from "@/lib/content";

const INQUIRIES = "inquiries@intllogic.com";

type State = "idle" | "sending" | "sent";

const field =
  "mt-2 w-full border border-line bg-panel px-3 py-2.5 text-sm focus:border-signal-dim focus:outline-none";

export default function Contact() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;

    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    setState("sending");
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        // Say what went wrong and what to do instead, never just "failed".
        setError(json.error ?? `We could not send that. Please write to ${INQUIRIES} directly.`);
        setState("idle");
        return;
      }
      setState("sent");
    } catch {
      setError(`We could not reach the server. Please write to ${INQUIRIES} directly.`);
      setState("idle");
    }
  }

  return (
    <>
      <PageHero
        code={sec("/contact", "CONTACT")}
        title="Start a conversation."
        lede={`Tell us about your mission. Your message goes straight to our team at ${INQUIRIES}, and we reply to the address you give us.`}
      />
      <section>
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1fr_360px]">
          {state === "sent" ? (
            <div className="hairline-card p-8">
              <p className="mono-label flex items-center gap-2">
                <span className="status-dot" aria-hidden /> SENT
              </p>
              <h2 className="display mt-3 text-2xl font-bold">Thank you — your message is on its way.</h2>
              <p className="mt-2 text-sm text-mute">
                It has gone to our team at {INQUIRIES}. We reply to the address you gave us, usually
                within one business day.
              </p>
              <button
                onClick={() => setState("idle")}
                className="mono-label mt-6 !text-signal hover:underline"
              >
                Send another →
              </button>
            </div>
          ) : (
            <form className="hairline-card space-y-5 p-8" onSubmit={submit} noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mono-label">Name</span>
                  <input name="name" required autoComplete="name" className={field} />
                </label>
                <label className="block">
                  <span className="mono-label">Organization / agency</span>
                  <input name="org" autoComplete="organization" className={field} />
                </label>
              </div>
              <label className="block">
                <span className="mono-label">Email</span>
                <input name="email" type="email" required autoComplete="email" className={field} />
              </label>
              <label className="block">
                <span className="mono-label">How can we help?</span>
                <textarea name="message" required rows={5} className={field} />
              </label>

              {/* Honeypot. Hidden from people, irresistible to bots. */}
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />

              {error && (
                <p role="alert" className="border border-[#dd958e] bg-[#fce9e7] px-4 py-3 text-sm text-[#9e1c15]">
                  {error}{" "}
                  <a href={`mailto:${INQUIRIES}`} className="font-semibold underline">
                    Email us instead
                  </a>
                </p>
              )}

              <button
                type="submit"
                disabled={state === "sending"}
                className="border border-signal bg-signal px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-85 disabled:opacity-60"
              >
                {state === "sending" ? "Sending…" : "Send inquiry"}
              </button>
            </form>
          )}

          <aside>
            <p className="mono-label mb-3">Inquiries</p>
            <a href={`mailto:${INQUIRIES}`} className="text-sm text-signal hover:underline">
              {INQUIRIES}
            </a>
            <p className="mono-label mb-3 mt-8">Headquarters</p>
            {org.hq.map((line) => (
              <p key={line} className="text-sm text-mute">
                {line}
              </p>
            ))}
            <p className="mono-label mb-3 mt-8">Elsewhere</p>
            <div className="flex flex-col gap-2">
              <a href={org.social.linkedin} className="text-sm text-mute hover:text-signal">
                LinkedIn
              </a>
              <a href={org.social.twitter} className="text-sm text-mute hover:text-signal">
                X / Twitter
              </a>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
