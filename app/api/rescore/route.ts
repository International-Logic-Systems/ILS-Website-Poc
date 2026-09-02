/**
 * POST /api/rescore — rescore one opportunity against the ILS profile.
 *
 * Server-side so the API key never reaches the browser. When
 * `ANTHROPIC_API_KEY` is absent the handler returns a simulated score instead
 * of failing: the demo has to work on a plane with no network, and a button
 * that errors on stage is worse than one that admits it is simulating.
 */

import Anthropic from '@anthropic-ai/sdk';
import { ILS_PROFILE_PROMPT } from '@/lib/admin/ils-profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL = 'claude-haiku-4-5-20251001';

type Body = {
  title?: string;
  agency?: string;
  subAgency?: string;
  naics?: string;
  setAside?: string;
  route?: string;
  summary?: string;
  responseDeadline?: string;
  currentScore?: number;
};

/** Clamp whatever comes back into the range the badge can render. */
function clampScore(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * The offline path.
 *
 * Nudges the existing score by a few points rather than inventing a new one,
 * so a simulated rescore still looks like a considered second opinion instead
 * of a random number. Deterministic per opportunity title.
 */
function simulate(body: Body): { fitScore: number; rationale: string } {
  const base = body.currentScore ?? 60;
  const seed = [...(body.title ?? '')].reduce((a, c) => a + c.charCodeAt(0), 0);
  const drift = (seed % 7) - 3;
  const fitScore = clampScore(base + drift, base);

  return {
    fitScore,
    rationale: `Simulated rescore — no ANTHROPIC_API_KEY is configured, so this did not call a model. The score moved from ${base} to ${fitScore} against the same ILS profile: NAICS ${body.naics ?? 'n/a'}, ${body.setAside ?? 'set-aside unstated'}, ordered through ${body.route ?? 'an undetermined route'}. Set the key and this button scores the opportunity for real.`,
  };
}

export async function POST(request: Request): Promise<Response> {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  if (!body.title) {
    return Response.json({ error: 'An opportunity title is required.' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ ...simulate(body), source: 'simulated' as const });
  }

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: ILS_PROFILE_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Score this opportunity for ILS.

Title: ${body.title}
Agency: ${body.agency ?? 'Not stated'}
Sub-agency: ${body.subAgency ?? 'Not stated'}
NAICS: ${body.naics ?? 'Not stated'}
Set-aside: ${body.setAside ?? 'Not stated'}
Ordering route: ${body.route ?? 'Not stated'}
Response deadline: ${body.responseDeadline ?? 'Not stated'}

Summary:
${body.summary ?? 'No summary provided.'}

Reply with ONLY a JSON object, no prose and no code fence:
{"fitScore": <integer 0-100>, "rationale": "<two or three sentences naming the specific ILS vehicles, NAICS codes, certifications or past performance that drove the score. Name the single biggest gap explicitly.>"}`,
        },
      ],
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();

    /* Models occasionally wrap JSON in a fence despite being asked not to. */
    const json = text.replace(/^```(?:json)?\s*|\s*```$/g, '');
    const parsed = JSON.parse(json) as { fitScore?: number; rationale?: string };

    return Response.json({
      fitScore: clampScore(parsed.fitScore, body.currentScore ?? 60),
      rationale:
        parsed.rationale?.trim() ||
        'The model returned a score without a rationale. Treat the score as provisional.',
      source: 'anthropic' as const,
    });
  } catch (error) {
    /* Never fail the demo on a network blip — fall back and say what happened. */
    const detail = error instanceof Error ? error.message : 'Unknown error';
    console.error('[rescore] falling back to simulation:', detail);
    return Response.json({ ...simulate(body), source: 'simulated' as const });
  }
}
