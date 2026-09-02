/**
 * Chunking for the knowledge builder. Pure and filesystem-free so the unit
 * tests can drive it directly.
 */

/**
 * Estimates BPE tokens without pulling in a tokenizer.
 *
 * Word- and character-based estimates bracket real Claude tokenisation for
 * English prose, so we take the larger of the two. Over-estimating is the safe
 * direction: it keeps chunks under the budget rather than silently over it.
 */
export function estimateTokens(text) {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(Math.ceil(words * 1.35), Math.ceil(text.length / 4.2));
}

/** Splits on blank lines, dropping empties. */
export function splitParagraphs(text) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/** Splits on sentence boundaries, keeping the terminator with its sentence. */
export function splitSentences(text) {
  return text
    .split(/(?<=[.!?;:])\s+(?=[A-Z\u2022(])|\n/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

/**
 * Last-resort split on word boundaries.
 *
 * Reached only by a run of text carrying no sentence terminator at all. Real
 * page copy always has them, but the budget is a hard guarantee — an
 * over-budget chunk would silently eat the context window the Lambda has to
 * spend — so this backstop exists rather than trusting the corpus to behave.
 */
function hardSplit(text, maxTokens) {
  const words = text.split(/\s+/).filter(Boolean);
  const pieces = [];
  let buffer = [];

  for (const word of words) {
    buffer.push(word);
    if (estimateTokens(buffer.join(' ')) >= maxTokens) {
      pieces.push(buffer.join(' '));
      buffer = [];
    }
  }
  if (buffer.length) pieces.push(buffer.join(' '));
  return pieces;
}

/**
 * Breaks a paragraph that is larger than the budget into sentence-aligned
 * pieces. A paragraph that fits is returned untouched.
 */
function fitParagraph(paragraph, maxTokens) {
  if (estimateTokens(paragraph) <= maxTokens) return [paragraph];

  const pieces = [];
  let buffer = '';
  for (const sentence of splitSentences(paragraph)) {
    const candidate = buffer ? `${buffer} ${sentence}` : sentence;
    if (buffer && estimateTokens(candidate) > maxTokens) {
      pieces.push(buffer);
      buffer = sentence;
    } else {
      buffer = candidate;
    }
  }
  if (buffer) pieces.push(buffer);

  return pieces.flatMap((piece) =>
    estimateTokens(piece) > maxTokens ? hardSplit(piece, maxTokens) : piece,
  );
}

/** Flattens sections into heading-tagged units no larger than the budget. */
function toUnits(sections, maxTokens) {
  const units = [];
  for (const section of sections) {
    const paragraphs = splitParagraphs(section.text ?? '');
    if (!paragraphs.length && section.heading) {
      units.push({ heading: section.heading, text: '', tokens: 0 });
      continue;
    }
    for (const paragraph of paragraphs) {
      for (const piece of fitParagraph(paragraph, maxTokens)) {
        units.push({ heading: section.heading, text: piece, tokens: estimateTokens(piece) });
      }
    }
  }
  return units;
}

/**
 * Packs a document's sections into chunks of roughly `maxTokens`.
 *
 * Packing stops at a heading boundary once the chunk carries enough text to
 * stand on its own, so a chunk is normally about a single subject. Short
 * sections are allowed to run together rather than becoming chunks too thin to
 * be worth retrieving.
 */
export function chunkDocument(doc, { maxTokens = 500, minTokens = 90 } = {}) {
  const units = toUnits(doc.sections ?? [], maxTokens);
  const draft = [];
  let parts = [];
  let headings = [];
  let tokens = 0;
  let openHeading = null;

  const flush = () => {
    const text = parts.join('\n\n').trim();
    if (text) draft.push({ headings: [...new Set(headings)], text, tokens: estimateTokens(text) });
    parts = [];
    headings = [];
    tokens = 0;
    openHeading = null;
  };

  for (const unit of units) {
    const changesHeading = headings.length > 0 && unit.heading && !headings.includes(unit.heading);
    if (parts.length && (tokens + unit.tokens > maxTokens || (changesHeading && tokens >= minTokens))) {
      flush();
    }
    if (unit.heading) headings.push(unit.heading);
    if (unit.text) {
      // A chunk may span more than one heading. The headings were lifted out of
      // the body when the page was split, so without putting them back the two
      // sections read as one continuous passage — which is how a reader (or a
      // model) ends up attributing one customer's engagement to another. The
      // first heading is omitted because it is already the chunk's label.
      if (parts.length && unit.heading && unit.heading !== openHeading) {
        parts.push(unit.heading);
        tokens += estimateTokens(unit.heading);
      }
      parts.push(unit.text);
      tokens += unit.tokens;
      openHeading = unit.heading ?? openHeading;
    }
  }
  flush();

  return absorbRunts(draft, { maxTokens, minTokens }).map((chunk, index) => ({
    id: `${doc.source}:${doc.path}#${index}`,
    source: doc.source,
    title: doc.title,
    path: doc.path,
    heading: chunk.headings[0] ?? null,
    headings: chunk.headings,
    text: chunk.text,
    tokens: chunk.tokens,
  }));
}

/**
 * Folds undersized chunks back into a neighbour.
 *
 * The packer stops at heading boundaries and at the token ceiling, and both can
 * leave a tail of a line or two behind. A chunk that small is worse than
 * useless: it rarely carries enough words to score on its own, and if it does
 * win a slot in the top results it spends one on a fragment. Merging backwards
 * is preferred, so the fragment rejoins the section it was cut from.
 */
/** The heading to reinstate between two chunks being joined, if any. */
function bridge(previous, next) {
  const previousLast = previous.headings[previous.headings.length - 1];
  const nextFirst = next.headings[0];
  return nextFirst && nextFirst !== previousLast ? `${nextFirst}\n\n` : '';
}

function absorbRunts(chunks, { maxTokens, minTokens }) {
  if (chunks.length < 2) return chunks;

  const merged = [];
  for (const chunk of chunks) {
    const previous = merged[merged.length - 1];
    const tooSmall = chunk.tokens < minTokens;
    if (previous && tooSmall && previous.tokens + chunk.tokens <= maxTokens) {
      // Same reason as in the packer: crossing a heading boundary without
      // naming it fuses two subjects into one undifferentiated passage.
      previous.text = `${previous.text}\n\n${bridge(previous, chunk)}${chunk.text}`;
      previous.tokens = estimateTokens(previous.text);
      previous.headings = [...new Set([...previous.headings, ...chunk.headings])];
      continue;
    }
    merged.push({ ...chunk });
  }

  // A runt in first position has no predecessor to join, so it folds forwards.
  if (merged.length > 1 && merged[0].tokens < minTokens) {
    const [first, second] = merged;
    if (first.tokens + second.tokens <= maxTokens) {
      second.text = `${first.text}\n\n${bridge(first, second)}${second.text}`;
      second.tokens = estimateTokens(second.text);
      second.headings = [...new Set([...first.headings, ...second.headings])];
      merged.shift();
    }
  }

  return merged;
}

/** Source authority, highest first. A duplicate is resolved in favour of the lower number. */
export const SOURCE_PRIORITY = { curated: 0, facts: 1, page: 2 };

/** Reduces text to a comparable bag of significant words. */
function signature(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2),
  );
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return shared / (a.size + b.size - shared);
}

/**
 * Drops chunks that restate one already kept.
 *
 * Reading both the rendered pages and the typed data means the same fact
 * arrives twice — once as page prose, once as a structured record. Keeping both
 * copies would spend the context budget saying the same thing twice, so the
 * more authoritative source wins and the near-duplicate is discarded.
 */
export function dedupeChunks(chunks, { threshold = 0.8 } = {}) {
  const ranked = [...chunks].sort(
    (a, b) => (SOURCE_PRIORITY[a.source] ?? 9) - (SOURCE_PRIORITY[b.source] ?? 9),
  );

  const kept = [];
  const signatures = [];

  for (const chunk of ranked) {
    const sig = signature(`${chunk.heading ?? ''} ${chunk.text}`);
    const duplicate = signatures.some((existing) => jaccard(sig, existing) >= threshold);
    if (duplicate) continue;
    kept.push(chunk);
    signatures.push(sig);
  }

  return kept;
}
