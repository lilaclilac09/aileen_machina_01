import { z } from 'zod';

export const ClipCandidateSchema = z.object({
  title: z.string().min(1),
  start_s: z.number().nonnegative(),
  end_s: z.number().positive(),
  reason: z.string().min(1),
  score: z.number().min(0).max(1),
});

export const CandidatesResponseSchema = z.object({
  candidates: z.array(ClipCandidateSchema).min(1),
});

export type ClipCandidate = z.infer<typeof ClipCandidateSchema> & {
  batchIndex?: number;
  absoluteStart_s?: number;
  absoluteEnd_s?: number;
  corrected?: boolean;
};

export type AudioBatch = {
  index: number;
  start_s: number;
  end_s: number;
  duration_s: number;
  wavPath: string;
};

export type ClipMode = 'best' | 'query';

export function slugFromYoutubeUrl(url: string): string {
  const id =
    url.match(/(?:v=|\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/)?.[1] ??
    url.match(/^([A-Za-z0-9_-]{6,})$/)?.[1];
  if (!id) throw new Error(`Could not parse YouTube video id from: ${url}`);
  return id;
}

export function computeBatches(
  totalDuration_s: number,
  batchSeconds: number,
  overlapSeconds: number,
): Omit<AudioBatch, 'wavPath'>[] {
  if (batchSeconds <= 0) throw new Error('batchSeconds must be positive');
  if (overlapSeconds < 0 || overlapSeconds >= batchSeconds) {
    throw new Error('overlapSeconds must be >= 0 and < batchSeconds');
  }

  const batches: Omit<AudioBatch, 'wavPath'>[] = [];
  let start = 0;
  let index = 0;

  while (start < totalDuration_s) {
    const end = Math.min(start + batchSeconds, totalDuration_s);
    batches.push({
      index,
      start_s: start,
      end_s: end,
      duration_s: end - start,
    });
    if (end >= totalDuration_s) break;
    start = end - overlapSeconds;
    index += 1;
  }

  return batches;
}

export function buildProposePrompt(opts: {
  mode: ClipMode;
  query?: string;
  batchIndex: number;
  batchStart_s: number;
  batchDuration_s: number;
  maxPerBatch: number;
}): string {
  const task =
    opts.mode === 'query' && opts.query
      ? `Find up to ${opts.maxPerBatch} clip-worthy moments that match this topic or quote: "${opts.query}".`
      : `Find up to ${opts.maxPerBatch} of the most clip-worthy, shareable moments in this audio segment (surprising insight, strong quote, emotional beat, or clear explanation).`;

  return [
    'You are selecting short clips from a long-form podcast or interview.',
    task,
    `This audio segment is batch ${opts.batchIndex + 1}. It starts at ${opts.batchStart_s.toFixed(1)}s in the full recording and lasts ${opts.batchDuration_s.toFixed(1)}s.`,
    'Listen to the audio. Return timestamps relative to THIS segment only (0 = segment start).',
    'Each clip should be 15–90 seconds unless the moment naturally needs slightly more.',
    'Do not cut mid-word or mid-sentence at start or end when avoidable.',
    '',
    'Respond with ONLY valid JSON (no markdown fences):',
    '{"candidates":[{"title":"...","start_s":0.0,"end_s":45.0,"reason":"...","score":0.0}]}',
    'score is 0.0–1.0 (higher = better clip). Include at least 1 candidate if anything is usable.',
  ].join('\n');
}

export function buildCorrectPrompt(opts: {
  candidate: ClipCandidate;
  windowStart_s: number;
  windowDuration_s: number;
}): string {
  return [
    'You are refining clip boundaries for a podcast excerpt.',
    `Proposed clip title: "${opts.candidate.title}"`,
    `Proposed reason: ${opts.candidate.reason}`,
    `Proposed relative times in this window: start ${opts.candidate.start_s.toFixed(2)}s, end ${opts.candidate.end_s.toFixed(2)}s.`,
    `This audio window starts at ${opts.windowStart_s.toFixed(1)}s in the full recording and lasts ${opts.windowDuration_s.toFixed(1)}s.`,
    'Listen and adjust start_s and end_s so the clip begins and ends on clean speech boundaries (not mid-word).',
    'Keep the same title unless clearly wrong. Update reason if needed.',
    '',
    'Respond with ONLY valid JSON (no markdown fences):',
    '{"candidates":[{"title":"...","start_s":0.0,"end_s":45.0,"reason":"...","score":0.0}]}',
    'Timestamps are relative to THIS window (0 = window start). Return exactly one candidate.',
  ].join('\n');
}

export function extractJsonObject(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = text.indexOf('{');
  if (start < 0) throw new Error('No JSON object found in model response');

  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  throw new Error('Unbalanced JSON object in model response');
}

export function parseCandidatesResponse(text: string): ClipCandidate[] {
  const raw = JSON.parse(extractJsonObject(text)) as unknown;
  const parsed = CandidatesResponseSchema.parse(raw);
  return parsed.candidates.map((c) => ({
    ...c,
    end_s: Math.max(c.start_s + 0.5, c.end_s),
  }));
}

export function toAbsoluteCandidate(
  candidate: ClipCandidate,
  batchStart_s: number,
  batchIndex: number,
): ClipCandidate {
  return {
    ...candidate,
    batchIndex,
    absoluteStart_s: batchStart_s + candidate.start_s,
    absoluteEnd_s: batchStart_s + candidate.end_s,
  };
}

export function dedupeCandidates(candidates: ClipCandidate[], minGap_s = 8): ClipCandidate[] {
  const sorted = [...candidates].sort((a, b) => {
    const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
    if (Math.abs(scoreDiff) > 0.01) return scoreDiff;
    return (a.absoluteStart_s ?? a.start_s) - (b.absoluteStart_s ?? b.start_s);
  });

  const kept: ClipCandidate[] = [];
  for (const c of sorted) {
    const start = c.absoluteStart_s ?? c.start_s;
    const end = c.absoluteEnd_s ?? c.end_s;
    const overlaps = kept.some((k) => {
      const ks = k.absoluteStart_s ?? k.start_s;
      const ke = k.absoluteEnd_s ?? k.end_s;
      return start < ke - minGap_s && end > ks + minGap_s;
    });
    if (!overlaps) kept.push(c);
  }
  return kept;
}

export function sanitizeFilename(title: string, index: number): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `${String(index + 1).padStart(2, '0')}-${base || 'clip'}`;
}

export const USAGE = `Inkling long-form audio clip tool

Usage:
  pnpm inkling:clips -- <youtube-url> [options]

Options:
  --best [N]              Pick best N moments (default 5)
  --query "..."           Search for a topic / quote / theme
  --batch-seconds N       Batch size in seconds (default 900)
  --overlap-seconds N     Overlap between batches (default 30)
  --pad-seconds N         Padding around candidate for correction (default 20)
  --dry-run               Stop after candidates.json (no ffmpeg render)
  --skip-download         Reuse existing work dir (requires prior download)
  --audio-only            Render .m4a instead of .mp4
  --work-dir PATH         Override output directory
  --help                  Show this help

Environment:
  INKLING_API_KEY or TOGETHER_API_KEY   Required for propose/correct passes
  INKLING_BASE_URL                      Default https://api.together.xyz/v1
  INKLING_MODEL                         Default thinkingmachines/inkling
  INKLING_REASONING_EFFORT              Optional (provider-specific)
  INKLING_MAX_TOKENS                    Default 4096

System deps: yt-dlp, ffmpeg, ffprobe
`;
