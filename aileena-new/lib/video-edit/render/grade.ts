/**
 * Color grade filter chain — cools yellow cast, lifts dark phone footage.
 * Applied after scale/pad, before format=yuv420p.
 */
import type { OutputSpec } from '../domain/types';

const DEFAULT_GRADE: NonNullable<OutputSpec['grade']> = {
  brightness: 0.06,
  contrast: 1.05,
  saturation: 1.02,
  gamma: 1.08,
  // Pull red/yellow out of shadows & mids; add a touch of blue
  shadowsRed: -0.12,
  shadowsGreen: -0.04,
  shadowsBlue: 0.08,
  midtonesRed: -0.08,
  midtonesGreen: -0.02,
  midtonesBlue: 0.06,
  highlightsRed: -0.04,
  highlightsGreen: 0,
  highlightsBlue: 0.03,
};

export function resolveGrade(spec: OutputSpec): NonNullable<OutputSpec['grade']> {
  return { ...DEFAULT_GRADE, ...(spec.grade || {}) };
}

export function gradeFilter(spec: OutputSpec): string {
  const g = resolveGrade(spec);
  const eq = `eq=brightness=${g.brightness}:contrast=${g.contrast}:saturation=${g.saturation}:gamma=${g.gamma}`;
  const cb =
    `colorbalance=` +
    `rs=${g.shadowsRed}:gs=${g.shadowsGreen}:bs=${g.shadowsBlue}:` +
    `rm=${g.midtonesRed}:gm=${g.midtonesGreen}:bm=${g.midtonesBlue}:` +
    `rh=${g.highlightsRed}:gh=${g.highlightsGreen}:bh=${g.highlightsBlue}`;
  return `${eq},${cb}`;
}

export function videoFilter(spec: OutputSpec): string {
  const { width: w, height: h, padColor, fps } = spec;
  return (
    `scale=${w}:${h}:force_original_aspect_ratio=decrease,` +
    `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=${padColor},` +
    `fps=${fps},` +
    `${gradeFilter(spec)},` +
    `format=yuv420p`
  );
}

export function photoFilter(spec: OutputSpec, frames: number): string {
  const { width: w, height: h, padColor, fps } = spec;
  return (
    `scale=${w}:${h}:force_original_aspect_ratio=decrease,` +
    `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=${padColor},` +
    `zoompan=z='min(1.08,1+0.0015*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${w}x${h}:fps=${fps},` +
    `${gradeFilter(spec)},` +
    `format=yuv420p`
  );
}
