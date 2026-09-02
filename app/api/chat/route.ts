/**
 * Site assistant — retrieval only, no model.
 *
 * BM25 finds the passages of the site that match the question, and the answer
 * is assembled from those passages verbatim. Nothing is generated, so the
 * assistant cannot state anything the site does not, and every reply carries
 * the page it came from.
 *
 * The corpus is `server/knowledge.json`, rebuilt by `npm run knowledge` from
 * the typed content modules and the rendered pages. Sync is structural: change
 * the site, rebuild, and the assistant changes with it.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildIndex, search, tokenize, type Index, type Knowledge } from "@/lib/chat/retrieval";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Built once per server process — the corpus is static between deploys. */
let indexPromise: Promise<Index> | null = null;

function loadIndex(): Promise<Index> {
  indexPromise ??= readFile(path.join(process.cwd(), "server", "knowledge.json"), "utf8")
    .then((raw) => JSON.parse(raw) as Knowledge)
    .then((knowledge) => buildIndex(knowledge.chunks));
  return indexPromise;
}

/**
 * Fact documents are written one statement per line, so newlines are the
 * reliable boundary. Splitting prose on ". " as well would cut "U.S." and
 * "Inc." in half, so a long line is only broken where a sentence end is not
 * preceded by a known abbreviation.
 */
const LINE_SPLIT = /\n+/;
const SENTENCE_SPLIT = /(?<=[.!?])\s+(?=[A-Z(])/;
const ABBREV_TAIL = /(?:\b[A-Z]|\bInc|\bNo|\bSt|\bU\.S)\.$/;

function statements(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split(LINE_SPLIT)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.length <= 240) {
      out.push(trimmed);
      continue;
    }
    let buffer = "";
    for (const part of trimmed.split(SENTENCE_SPLIT)) {
      buffer = buffer ? `${buffer} ${part}` : part;
      if (buffer.length > 40 && !ABBREV_TAIL.test(buffer)) {
        out.push(buffer);
        buffer = "";
      }
    }
    if (buffer.trim()) out.push(buffer.trim());
  }
  return out;
}

/**
 * Pulls the sentences that actually answer the question out of the retrieved
 * passages, best first.
 *
 * Retrieval works at chunk level, but a chunk can be 500 tokens — quoting one
 * whole is not an answer. Scoring each sentence on how many query terms it
 * carries, with a bonus for identifier-shaped terms, surfaces the line holding
 * the contract number rather than the paragraph around it.
 */
/**
 * Loose term match. The corpus says "benefit" where the question says
 * "benefits", "service" where it says "services" — a plain equality test
 * misses every one of those, and a stemmer is more machinery than a prefix
 * check earns here.
 */
function matches(term: string, words: Set<string>): boolean {
  if (words.has(term)) return true;
  // "401k" in the question, "401(k)" in the corpus — which tokenizes to
  // "401" and "k", so the digits have to be compared on their own.
  const digits = /^\d{3,}/.exec(term)?.[0];
  if (digits && words.has(digits)) return true;
  if (term.length < 4) return false;
  for (const w of words) {
    if (w.length >= 4 && (w.startsWith(term) || term.startsWith(w))) return true;
  }
  return false;
}

function extract(text: string, terms: Set<string>, identifiers: Set<string>): { s: string; score: number }[] {
  return statements(text)
    // A bare heading is not an answer; require enough text to carry one.
    .filter((s) => s.length >= 24)
    // "Detail page: /contracts/cio-sp3." matches every term in a question about
    // CIO-SP3 while answering none of it. Navigation is not an answer.
    .filter((s) => !/^(Detail page|Awarding agency page|More at|Search open positions)\b/i.test(s))
    .map((s) => {
      const words = new Set(tokenize(s));
      let score = 0;
      for (const t of terms) if (matches(t, words)) score += 1;
      for (const id of identifiers) if (s.toLowerCase().includes(id)) score += 3;
      // Prefer a line that states a labelled value over prose that mentions it.
      if (/^[A-Z][A-Za-z /-]{2,34}:/.test(s)) score += 0.75;
      // Floor the divisor at 10: without it a two-word heading beats the full
      // statement underneath it purely for being short.
      return { s, score: score / Math.sqrt(Math.max(10, words.size)) };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
}

const STOP = new Set([
  "a", "an", "and", "any", "are", "as", "at", "be", "by", "can", "did", "do", "does",
  "for", "from", "give", "has", "have", "how", "i", "in", "is", "it", "its", "list", "many",
  "me", "much", "of", "on", "or", "our", "please", "provide", "tell", "that", "the",
  "their", "there", "they", "this", "to", "us", "was", "we", "what", "when", "where", "which",
  "who", "whom", "why", "with", "you", "your", "yours",
]);

const NO_MATCH =
  "I could not find that on the ILS site. I answer only from what these pages publish — try asking about our contract vehicles and their status, service lines, certifications, customers, benefits, or how to get in touch.";

export async function POST(request: Request): Promise<Response> {
  let question = "";
  try {
    const body = (await request.json()) as { question?: unknown };
    question = typeof body.question === "string" ? body.question.trim() : "";
  } catch {
    return Response.json({ error: "Expected JSON with a question." }, { status: 400 });
  }

  if (!question) return Response.json({ error: "A question is required." }, { status: 400 });
  if (question.length > 400) question = question.slice(0, 400);

  // The retrieval tokenizer keeps question words like "do", "who" and "your",
  // and on a corpus this small that is enough for the longest page to outrank
  // the page that actually answers. Strip them before searching, not after.
  const allTerms = tokenize(question);
  const content = allTerms.filter((t) => !STOP.has(t));
  const terms = new Set(content.length ? content : allTerms);

  const index = await loadIndex();
  // Scan wide: a labelled value like "Prompt payment terms" can sit in a chunk
  // that ranks fourth or fifth for a question dominated by the vehicle name.
  const results = search(index, [...terms].join(" "), { limit: 8, minScore: 0.15 });

  if (!results.length) {
    return Response.json({ answer: NO_MATCH, sources: [], matched: false });
  }
  const identifiers = new Set(
    [...terms].filter((t) => /\d/.test(t) && t.length >= 4).map((t) => t.toLowerCase()),
  );

  // Take the best sentences across the top few chunks, keeping each chunk's
  // strongest line so a two-part question can be answered from two pages.
  // Fact chunks are authored one statement per line and carry the identifiers;
  // page chunks are rendered prose where headings and nav text run together.
  // Read the facts first and fall back to pages only for what they miss.
  const ordered = [
    ...results.filter((r) => r.chunk.source === "facts"),
    ...results.filter((r) => r.chunk.source !== "facts"),
  ];

  // "What benefits do you offer" wants the list, not the best line from it. A
  // question with no identifier in it is treated as a list question and allowed
  // more statements off the strongest chunk.
  const listy = !identifiers.size && /\b(what|which|list|all|any)\b/i.test(question);

  const picked: { s: string; score: number; path: string; title: string }[] = [];
  const facts = ordered.filter((r) => r.chunk.source === "facts");

  facts.forEach(({ chunk }, rank) => {
    const take = rank === 0 ? (listy ? 6 : 3) : 2;
    for (const hit of extract(chunk.text, terms, identifiers).slice(0, take)) {
      picked.push({ ...hit, path: chunk.path, title: chunk.title });
    }
  });

  // Rendered-page chunks run headings and nav text together, so they are a last
  // resort — used only when the typed facts had nothing to say.
  if (picked.length < 2) {
    for (const { chunk } of ordered.filter((r) => r.chunk.source !== "facts").slice(0, 2)) {
      for (const hit of extract(chunk.text, terms, identifiers).slice(0, 2)) {
        picked.push({ ...hit, path: chunk.path, title: chunk.title });
      }
    }
  }

  picked.sort((a, b) => b.score - a.score);

  // Everything must be in the same league as the best line. Without this a
  // strong answer drags two weak, unrelated sentences along behind it.
  const floor = picked.length ? picked[0].score * 0.45 : 0;

  const seen = new Set<string>();
  const chosen = picked
    .filter((p) => p.score >= floor)
    .filter((p) => {
      const key = p.s.slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, listy ? 7 : 3);

  if (!chosen.length) return Response.json({ answer: NO_MATCH, sources: [], matched: false });

  const sources = [...new Map(chosen.map((c) => [c.path, { path: c.path, title: c.title }])).values()];

  return Response.json({
    answer: chosen.map((c) => c.s).join(" "),
    sources,
    matched: true,
  });
}
