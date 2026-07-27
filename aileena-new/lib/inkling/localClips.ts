import type { ClipCandidate } from './clips';
import { shellRun } from './media';

export type LocalSegment = {
  start_s: number;
  end_s: number;
  duration_s: number;
};

/**
 * Parse ffmpeg silencedetect stderr into silence intervals.
 */
export function parseSilenceLog(log: string): { start_s: number; end_s: number }[] {
  const starts: number[] = [];
  const ends: number[] = [];
  for (const line of log.split('\n')) {
    const s = line.match(/silence_start:\s*([0-9.]+)/);
    if (s) starts.push(Number(s[1]));
    const e = line.match(/silence_end:\s*([0-9.]+)/);
    if (e) ends.push(Number(e[1]));
  }
  const out: { start_s: number; end_s: number }[] = [];
  const n = Math.min(starts.length, ends.length);
  for (let i = 0; i < n; i += 1) {
    if (ends[i] > starts[i]) out.push({ start_s: starts[i], end_s: ends[i] });
  }
  return out;
}

/**
 * Invert silence into speech islands, then clamp to clip-friendly lengths.
 */
export function speechSegmentsFromSilence(
  totalDuration_s: number,
  silences: { start_s: number; end_s: number }[],
  opts?: { min_s?: number; max_s?: number },
): LocalSegment[] {
  const min_s = opts?.min_s ?? 12;
  const max_s = opts?.max_s ?? 75;
  const sorted = [...silences].sort((a, b) => a.start_s - b.start_s);

  const speech: LocalSegment[] = [];
  let cursor = 0;
  for (const sil of sorted) {
    if (sil.start_s > cursor + 0.4) {
      const start = cursor;
      const end = sil.start_s;
      speech.push({ start_s: start, end_s: end, duration_s: end - start });
    }
    cursor = Math.max(cursor, sil.end_s);
  }
  if (cursor < totalDuration_s - 0.4) {
    speech.push({
      start_s: cursor,
      end_s: totalDuration_s,
      duration_s: totalDuration_s - cursor,
    });
  }

  const clipped: LocalSegment[] = [];
  for (const seg of speech) {
    if (seg.duration_s < min_s) continue;
    if (seg.duration_s <= max_s) {
      clipped.push(seg);
      continue;
    }
    // Long speech island → take a centered window of max_s
    const mid = (seg.start_s + seg.end_s) / 2;
    const start = Math.max(seg.start_s, mid - max_s / 2);
    const end = Math.min(seg.end_s, start + max_s);
    clipped.push({ start_s: start, end_s: end, duration_s: end - start });
  }
  return clipped;
}

/** Evenly spaced fallback when silence detection finds nothing useful. */
export function evenlySpacedSegments(
  totalDuration_s: number,
  count: number,
  clip_s = 45,
): LocalSegment[] {
  if (totalDuration_s <= 0 || count <= 0) return [];
  const usable = Math.max(1, totalDuration_s - clip_s);
  const out: LocalSegment[] = [];
  for (let i = 0; i < count; i += 1) {
    const start = count === 1 ? Math.max(0, (totalDuration_s - clip_s) / 2) : (usable * i) / (count - 1 || 1);
    const end = Math.min(totalDuration_s, start + Math.min(clip_s, totalDuration_s));
    if (end - start >= 8) {
      out.push({ start_s: start, end_s: end, duration_s: end - start });
    }
  }
  return out;
}

/**
 * Free local clip finder: ffmpeg silencedetect → speech islands → top N by duration.
 * No Inkling / Together credits required.
 */
export function proposeLocalCandidates(
  wavPath: string,
  totalDuration_s: number,
  bestCount: number,
): ClipCandidate[] {
  let silences: { start_s: number; end_s: number }[] = [];
  try {
    // silencedetect writes to stderr; shellRun captures stdout — use 2>&1
    const log = shellRun(
      `ffmpeg -hide_banner -nostats -i "${wavPath}" -af silencedetect=noise=-28dB:d=0.45 -f null - 2>&1 || true`,
    );
    silences = parseSilenceLog(log);
  } catch {
    silences = [];
  }

  let segments = speechSegmentsFromSilence(totalDuration_s, silences);
  if (segments.length === 0) {
    segments = evenlySpacedSegments(totalDuration_s, bestCount);
  }

  const ranked = [...segments].sort((a, b) => b.duration_s - a.duration_s).slice(0, bestCount);

  return ranked.map((seg, i) => {
    const score = Math.min(1, 0.45 + seg.duration_s / 120);
    return {
      title: `Local clip ${i + 1}`,
      start_s: seg.start_s,
      end_s: seg.end_s,
      reason:
        'Free local heuristic (ffmpeg silence gaps) — not Inkling. Boundaries may cut mid-sentence.',
      score,
      absoluteStart_s: seg.start_s,
      absoluteEnd_s: seg.end_s,
      corrected: false,
    };
  });
}

export function hasInklingApiKey(): boolean {
  return Boolean(process.env.INKLING_API_KEY ?? process.env.TOGETHER_API_KEY);
}
