/**
 * BM25 retrieval over the knowledge corpus.
 *
 * The corpus is ~9k tokens across ~55 chunks, so an inverted index in memory
 * beats a vector database on every axis that matters here: no embedding call in
 * the request path, no index to keep in sync with the site, and exact matching
 * on the identifiers people actually search for — a contract number is a
 * literal string, and lexical search finds it where a nearest-neighbour lookup
 * can miss it.
 */

export type Chunk = {
  id: string;
  source: 'curated' | 'facts' | 'page';
  title: string;
  path: string;
  heading: string | null;
  headings: string[];
  text: string;
  tokens: number;
};

export type Knowledge = { chunkCount: number; totalTokens: number; chunks: Chunk[] };

type Document = {
  chunk: Chunk;
  frequencies: Map<string, number>;
  length: number;
  headingTerms: Set<string>;
};

export type Index = {
  documents: Document[];
  documentFrequency: Map<string, number>;
  averageLength: number;
  size: number;
};

export type Result = { chunk: Chunk; score: number };

const K1 = 1.5; // term-frequency saturation
const B = 0.75; // length normalisation

/**
 * Tie-breaking weight by source, mirroring the build step's dedup priority.
 *
 * Page prose and the typed data often describe the same fact, and BM25 scores
 * them within a point of each other. When that happens the structured record
 * should win: it is the only one that states a missing value as "NOT
 * PUBLISHED" rather than the softer "to be supplied" the page renders, and that
 * distinction is what stops the model treating a gap as noise. Small enough
 * that it only settles near-ties, never overrides a clearly better match.
 */
const SOURCE_WEIGHT: Record<Chunk['source'], number> = {
  curated: 1.15,
  facts: 1.1,
  page: 1,
};

/**
 * Words carrying no retrieval signal. Deliberately short: an aggressive list
 * would strip "who", "how" and "not", which change what a question is asking.
 */
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'for', 'from',
  'has', 'have', 'in', 'into', 'is', 'it', 'its', 'of', 'on', 'or', 'that',
  'the', 'their', 'there', 'they', 'this', 'to', 'was', 'were', 'will', 'with',
]);

/**
 * Splits text into search terms.
 *
 * Identifiers are kept whole *and* split on their separators, so a query for
 * "693KA9-18-A-00102" matches the chunk holding it, and a query for the bare
 * "00102" still finds the same chunk.
 */
/**
 * Deliberately crude suffix stripping, not a Porter stemmer.
 *
 * The corpus is ~9k tokens of contract and marketing prose; the only variants
 * that actually cost recall here are plurals and -ing/-ed forms. A full stemmer
 * would also conflate words this corpus needs kept apart, and would be far more
 * machinery than the gain justifies.
 */
function stemOf(token: string): string | null {
  if (token.length < 5 || /\d/.test(token)) return null;
  for (const [suffix, min] of [
    ["ies", 5],
    ["ing", 6],
    ["ed", 6],
    ["es", 5],
    ["s", 4],
  ] as const) {
    if (token.length > min && token.endsWith(suffix)) {
      const base = token.slice(0, -suffix.length);
      return suffix === "ies" ? `${base}y` : base;
    }
  }
  return null;
}

export function tokenize(text: string | null | undefined): string[] {
  if (!text) return [];
  const terms: string[] = [];

  for (const raw of String(text).toLowerCase().split(/[^a-z0-9\-/]+/)) {
    const token = raw.replace(/^[-/]+|[-/]+$/g, '');
    if (!token || STOPWORDS.has(token)) continue;

    terms.push(token);
    if (/[-/]/.test(token)) {
      for (const part of token.split(/[-/]+/)) {
        if (part.length > 1 && !STOPWORDS.has(part)) terms.push(part);
      }
    }

    // Both forms are emitted, never the stem alone: the exact token keeps its
    // weight, and the stem is what lets "apply" reach "applying" and
    // "benefits" reach "benefit". Without it the index only matches the
    // grammatical form the writer happened to use.
    const stem = stemOf(token);
    if (stem && stem !== token) terms.push(stem);

    // "401k" in a question against "401(k)" in the copy, which tokenizes to
    // "401" and "k". Indexing the digit run bridges the two.
    const digits = /^\d{3,}/.exec(token)?.[0];
    if (digits && digits !== token) terms.push(digits);
  }

  return terms;
}

function termFrequencies(terms: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const term of terms) counts.set(term, (counts.get(term) ?? 0) + 1);
  return counts;
}

/** Builds the inverted index. Called once per process, never per request. */
export function buildIndex(chunks: Chunk[]): Index {
  const documents: Document[] = chunks.map((chunk) => {
    // Heading and title are folded into the indexed text so a chunk sitting
    // under "Contract Vehicles" scores on that phrase even when the body never
    // spells it out.
    const searchable = [chunk.title, ...(chunk.headings ?? []), chunk.heading, chunk.text]
      .filter(Boolean)
      .join('\n');
    const terms = tokenize(searchable);
    return {
      chunk,
      frequencies: termFrequencies(terms),
      length: terms.length,
      headingTerms: new Set(tokenize([chunk.title, chunk.heading].filter(Boolean).join(' '))),
    };
  });

  const documentFrequency = new Map<string, number>();
  for (const document of documents) {
    for (const term of document.frequencies.keys()) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
  }

  const totalLength = documents.reduce((sum, document) => sum + document.length, 0);

  return {
    documents,
    documentFrequency,
    averageLength: documents.length ? totalLength / documents.length : 0,
    size: documents.length,
  };
}

/** Inverse document frequency, floored so a common term cannot score negative. */
function idf(index: Index, term: string): number {
  const df = index.documentFrequency.get(term) ?? 0;
  if (!df) return 0;
  return Math.max(0.01, Math.log(1 + (index.size - df + 0.5) / (df + 0.5)));
}

/**
 * Scores every chunk against the question and returns the best ones.
 *
 * On top of BM25 the scorer adds two adjustments that matter for this corpus:
 * a term matching a chunk's title or heading counts for more than the same term
 * buried in the body, and an exact identifier match is boosted hard, because
 * someone typing a contract number wants that record and nothing else.
 */
export function search(
  index: Index,
  query: string,
  { limit = 8, minScore = 0.1 }: { limit?: number; minScore?: number } = {},
): Result[] {
  const queryTerms = tokenize(query);
  if (!queryTerms.length || !index.size) return [];

  const unique = [...new Set(queryTerms)];
  const identifiers = new Set(unique.filter((term) => /\d/.test(term) && term.length >= 4));
  const scored: Result[] = [];

  for (const document of index.documents) {
    let score = 0;

    for (const term of unique) {
      const frequency = document.frequencies.get(term);
      if (!frequency) continue;

      const normalised =
        (frequency * (K1 + 1)) /
        (frequency + K1 * (1 - B + (B * document.length) / (index.averageLength || 1)));
      let contribution = idf(index, term) * normalised;

      if (document.headingTerms.has(term)) contribution *= 1.6;
      if (identifiers.has(term)) contribution *= 2.5;

      score += contribution;
    }

    score *= SOURCE_WEIGHT[document.chunk.source] ?? 1;

    if (score > minScore) scored.push({ chunk: document.chunk, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id))
    .slice(0, limit);
}

/**
 * Renders retrieved chunks as the CONTEXT block the model reads.
 *
 * Each chunk is labelled with its page title and URL path so the model can cite
 * a real page. Without the path it would either cite nothing or invent a URL.
 */
export function renderContext(results: Result[]): string {
  if (!results.length) return 'No matching ILS information was found.';

  return results
    .map(({ chunk }, index) => {
      const heading = chunk.heading ? ` — ${chunk.heading}` : '';
      return [
        `<document index="${index + 1}">`,
        `<title>${chunk.title}${heading}</title>`,
        `<url>${chunk.path}</url>`,
        '<content>',
        chunk.text,
        '</content>',
        '</document>',
      ].join('\n');
    })
    .join('\n\n');
}
