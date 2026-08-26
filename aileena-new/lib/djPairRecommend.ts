/**
 * Pair recommendations from carousel metadata.
 * Heuristic only — not beat-grid / waveform / key analysis.
 */

export type PairConfidence = 'strong' | 'decent' | 'experimental';

export type PairableTrack = {
  id: string;
  title: string;
  artist?: string;
  bpm: number;
  key: string;
  dur: number;
  source?: string;
  mixable?: boolean;
  audioSrc?: string | null;
};

export type PairCandidate = {
  trackId: string;
  title: string;
  artist?: string;
  bpm: number;
  key: string;
  why: string;
  confidence: PairConfidence;
  feedback: string;
  score: number;
};

const HARD_WORDS = /\b(techno|schranz|industrial|warehouse|acid|hardcore|peak.?time|kick)\b/i;
const DARK_WORDS = /\b(dark|hard|heavy|drive|pressure|steel|iron|machine)\b/i;

export function bpmSpread(a: number, b: number): number | null {
  if (!(a > 0) || !(b > 0)) return null;
  return Math.abs(a - b);
}

function energyHint(t: PairableTrack): number {
  let n = 0;
  const blob = `${t.title} ${t.artist ?? ''}`;
  if (HARD_WORDS.test(blob)) n += 2;
  if (DARK_WORDS.test(blob)) n += 1;
  if (t.bpm >= 140) n += 2;
  else if (t.bpm >= 132) n += 1;
  return n;
}

function confidenceFromScore(score: number, bpmKnown: boolean): PairConfidence {
  if (!bpmKnown) return 'experimental';
  if (score >= 7) return 'strong';
  if (score >= 4) return 'decent';
  return 'experimental';
}

function whyLine(opts: {
  bpmDiff: number | null;
  sameKey: boolean;
  energyLift: boolean;
  hardBias: boolean;
  technoIsh: boolean;
}): string {
  const bits: string[] = [];
  if (opts.bpmDiff != null && opts.bpmDiff <= 2) bits.push('similar marked BPM');
  else if (opts.bpmDiff != null && opts.bpmDiff <= 6) bits.push('close marked tempo');
  else if (opts.bpmDiff != null) bits.push('wider tempo gap');
  if (opts.sameKey) bits.push('same key mark');
  if (opts.energyLift) bits.push(opts.hardBias ? 'higher drive' : 'energy lift');
  if (opts.technoIsh) bits.push('techno-compatible tags');
  if (!bits.length) bits.push('thin metadata overlap');
  return bits.join(' · ');
}

function feedbackLine(confidence: PairConfidence, bpmDiff: number | null, energyLift: boolean, hardBias: boolean): string {
  if (hardBias && energyLift && (bpmDiff == null || bpmDiff <= 8)) {
    return 'hard techno bias approves.';
  }
  if (confidence === 'strong' && bpmDiff != null && bpmDiff <= 2) {
    return 'good pair — similar drive, safe blend';
  }
  if (energyLift && confidence !== 'experimental') {
    return 'harder second track, nice energy lift';
  }
  if (confidence === 'decent') {
    return 'techno-safe: steady kick, close tempo';
  }
  if (bpmDiff != null && bpmDiff > 8) {
    return 'messy but fun — keep the crossfade short';
  }
  return 'not clean, but club-useful';
}

export function recommendPairs(
  selected: PairableTrack,
  library: PairableTrack[],
  opts: { hardTechnoBias?: boolean; limit?: number } = {},
): PairCandidate[] {
  const hard = !!opts.hardTechnoBias;
  const limit = opts.limit ?? 4;
  const out: PairCandidate[] = [];

  for (const t of library) {
    if (t.id === selected.id) continue;
    const bpmDiff = bpmSpread(selected.bpm, t.bpm);
    const bpmKnown = bpmDiff != null;
    const sameKey = !!(selected.key && t.key && selected.key !== '—' && selected.key === t.key);
    const eSel = energyHint(selected);
    const eNext = energyHint(t);
    const energyLift = eNext > eSel || (t.bpm > 0 && selected.bpm > 0 && t.bpm - selected.bpm >= 6);
    const technoIsh = HARD_WORDS.test(`${t.title} ${t.artist ?? ''}`) || HARD_WORDS.test(`${selected.title} ${selected.artist ?? ''}`);

    let score = 0;
    if (bpmDiff != null) {
      if (bpmDiff <= 2) score += 5;
      else if (bpmDiff <= 4) score += 4;
      else if (bpmDiff <= 6) score += 3;
      else if (bpmDiff <= 10) score += 1;
      else score -= 1;
    }
    if (sameKey) score += 1;
    if (Math.abs((t.dur || 0) - (selected.dur || 0)) <= 30) score += 1;

    if (hard) {
      if (t.bpm >= 140) score += 3;
      else if (t.bpm >= 132) score += 2;
      else if (t.bpm > 0 && t.bpm < 128) score -= 2;
      if (eNext >= 2) score += 2;
      if (technoIsh) score += 1;
    } else if (energyLift) {
      score += 1;
    }

    const confidence = confidenceFromScore(score, bpmKnown);
    out.push({
      trackId: t.id,
      title: t.title,
      artist: t.artist,
      bpm: t.bpm,
      key: t.key,
      why: whyLine({ bpmDiff, sameKey, energyLift, hardBias: hard, technoIsh }),
      confidence,
      feedback: feedbackLine(confidence, bpmDiff, energyLift, hard),
      score,
    });
  }

  out.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return out.slice(0, Math.min(5, Math.max(2, limit)));
}
