"use client";

import { useEffect, useRef, useState } from "react";

type Msg = {
  from: "you" | "ils";
  text: string;
  /** Retrieval step shown above the answer, as an agent would surface it. */
  tool?: string;
  /** True while the reply is still being typed out. */
  streaming?: boolean;
  /** Pages the answer was taken from. */
  sources?: Source[];
};

/** Pages the retriever cited, shown under the answer. */
type Source = { path: string; title: string };

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: "ils",
      text: "ILS Assistant here. I answer only from what this site publishes — contract vehicles and their status, service lines, customers, benefits and how to reach us. Every answer cites the page it came from.",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [msgs, open, thinking]);

  // Any pending think/stream timers must die with the component.
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function later(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms));
  }

  async function send() {
    const q = input.trim();
    if (!q || thinking) return;
    setInput("");
    setMsgs((m) => [...m, { from: "you", text: q }]);
    setThinking(true);

    let reply =
      "Something went wrong reaching the site index. Please try again.";
    let sources: Source[] = [];
    const tool = "search:site-content";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = (await res.json()) as { answer?: string; sources?: Source[] };
      if (data.answer) reply = data.answer;
      sources = data.sources ?? [];
    } catch {
      /* keep the fallback text */
    }

    setThinking(false);
    setMsgs((m) => [...m, { from: "ils", text: "", tool, streaming: true, sources }]);

    // Stream the retrieved text in rather than dropping it in whole — the
    // answer can be several sentences and arriving all at once reads as a wall.
    const words = reply.split(" ");
    words.forEach((_, i) => {
      later(() => {
        const partial = words.slice(0, i + 1).join(" ");
        const last = i === words.length - 1;
        setMsgs((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            from: "ils",
            text: partial,
            tool,
            streaming: !last,
            sources,
          };
          return copy;
        });
      }, i * 18);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 border border-signal-dim bg-panel px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-signal shadow-lg transition-colors hover:bg-signal hover:text-white"
        aria-expanded={open}
      >
        {open ? "Close assistant" : "ILS Assistant"}
      </button>

      {open && (
        <div className="fixed bottom-[4.25rem] right-5 z-50 flex h-[26rem] w-[min(22rem,calc(100vw-2.5rem))] flex-col border border-line bg-panel shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="mono-label flex items-center gap-2">
              <span className="status-dot" aria-hidden /> ILS ASSISTANT
            </span>
            <span className="mono-label">DEMO · LOCAL ONLY</span>
          </div>
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-3">
            {msgs.map((m, i) => (
              <div key={i} className={m.from === "you" ? "text-right" : ""}>
                <p className="mono-label mb-1">{m.from === "you" ? "YOU" : "ILS AGENT"}</p>
                {m.tool && (
                  <p className="mb-1.5">
                    <span className="agent-chip" data-state={m.streaming ? "tool" : "done"}>
                      {m.streaming ? "▸" : "✓"} {m.tool}
                    </span>
                  </p>
                )}
                <p
                  className={`inline-block max-w-[90%] border px-3 py-2 text-left text-sm ${
                    m.from === "you" ? "border-signal-dim text-fg" : "border-line bg-raise text-fg"
                  } ${m.streaming ? "streaming" : ""}`}
                >
                  {m.text}
                </p>
                {m.from === "ils" && !m.streaming && m.sources && m.sources.length > 0 && (
                  <p className="mono-label mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                    {m.sources.map((s) => (
                      <a key={s.path} href={s.path} className="!text-signal hover:underline">
                        {s.path}
                      </a>
                    ))}
                  </p>
                )}
              </div>
            ))}

            {thinking && (
              <div>
                <p className="mono-label mb-1">ILS AGENT</p>
                <span className="agent-chip" data-state="think">
                  <span className="think-dots" aria-hidden>
                    <span />
                    <span />
                    <span />
                  </span>
                  Reasoning
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2 border-t border-line p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about ILS…"
              aria-label="Ask the ILS assistant"
              className="min-w-0 flex-1 border border-line bg-panel px-3 py-2 text-sm text-fg placeholder:text-mute focus:border-signal-dim focus:outline-none"
            />
            <button
              onClick={send}
              className="border border-signal-dim px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-signal hover:bg-signal hover:text-white"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
