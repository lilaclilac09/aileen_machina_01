/** Pure mixer math — no AudioContext. Safe to unit-test in Node. */

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Crossfader 0 = A only, 50 = both, 100 = B only. Equal-power. */
export function crossfadeGains(xfade0to100: number): { a: number; b: number } {
  const t = clamp(xfade0to100, 0, 100) / 100;
  return {
    a: Math.cos((t * Math.PI) / 2),
    b: Math.sin((t * Math.PI) / 2),
  };
}

/** Channel / master fader 0–100 → 0–1, equal-power. */
export function faderGain(knob0to100: number): number {
  const x = clamp(knob0to100, 0, 100) / 100;
  return Math.sin((x * Math.PI) / 2);
}

/** Trim/gain: 75 = unity (1.0), 0 = mute, 100 ≈ 1.33. */
export function trimGain(knob0to100: number): number {
  return clamp(knob0to100, 0, 100) / 75;
}

/** Pitch slider −8…+8 % → playbackRate. */
export function pitchToRate(pitchPct: number): number {
  return 1 + clamp(pitchPct, -16, 16) / 100;
}

/**
 * 3-band EQ knob: 50 = 0 dB, 0 = −24 dB (kill-ish), 100 = +12 dB.
 * Below 2 is a hard kill.
 */
export function eqKnobToDb(knob0to100: number): number {
  const k = clamp(knob0to100, 0, 100);
  if (k < 2) return -80;
  if (k <= 50) return -24 * (1 - k / 50);
  return 12 * ((k - 50) / 50);
}

export type FilterShape =
  | { type: 'allpass'; frequency: number; Q: number }
  | { type: 'lowpass'; frequency: number; Q: number }
  | { type: 'highpass'; frequency: number; Q: number };

/** DJ filter: 50 = open, <50 low-pass, >50 high-pass. */
export function filterFromKnob(knob0to100: number): FilterShape {
  const k = clamp(knob0to100, 0, 100);
  if (Math.abs(k - 50) < 2) {
    return { type: 'allpass', frequency: 1000, Q: 0.707 };
  }
  if (k < 50) {
    const t = k / 50;
    return {
      type: 'lowpass',
      frequency: 180 * Math.pow(18_000 / 180, t),
      Q: 0.85,
    };
  }
  const t = (k - 50) / 50;
  return {
    type: 'highpass',
    frequency: 40 * Math.pow(9_000 / 40, t),
    Q: 0.85,
  };
}

/** 4/4 bar length in seconds. */
export function barsToSeconds(bars: number, bpm: number): number {
  if (!(bpm > 0) || !(bars > 0)) return 0;
  return (60 / bpm) * 4 * bars;
}

/** Pitch % so `fromBpm * fromRate` matches `toBpm * toRate`. */
export function syncPitchPct(fromBpm: number, fromPitchPct: number, toBpm: number): number | null {
  if (!(fromBpm > 0) || !(toBpm > 0)) return null;
  const target = fromBpm * pitchToRate(fromPitchPct);
  const needed = (target / toBpm - 1) * 100;
  if (!Number.isFinite(needed)) return null;
  return clamp(+needed.toFixed(2), -8, 8);
}

export function fmtMs(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function fmtSec(sec: number): string {
  return fmtMs(sec * 1000);
}
