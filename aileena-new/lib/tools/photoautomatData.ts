/**
 * Published figures for the analog Berlin photo booths. The shot clock and the street stage read these;
 * nothing here is tuned by eye.
 *
 * - fotoautomata.blogspot.com: the strip is 4 cm wide with four frames; the cabinet stands on about 2 m².
 * - Operator reply quoted at digitalcosmonaut.com/111-places-in-berlin-fotoautomat: the first flash comes
 *   5–10 s after the start, the next ones about 7 s apart.
 * - en.wikipedia.org/wiki/Fotoautomat: the strip spends about four minutes in the chemistry.
 * - boothbeacon.org: developer, stop, fixer, water wash; fixed-focus lens 60–80 cm from the glass.
 */
export const BOOTH = {
  stripWidthM: 0.04,
  footprintM2: 2,
  firstFlashS: 5,
  flashGapS: 7,
  developS: 240,
  /** No per-bath times are published, so the clock gives each bath an equal share. */
  baths: ['developer', 'stop', 'fixer', 'wash'],
  lensDistanceM: [0.6, 0.8],
} as const;

export type BoothBath = (typeof BOOTH.baths)[number];

/** Which bath the strip is in at a machine time, and how far through the whole run it is. */
export function bathAt(machineS: number): { bath: number; progress: number } {
  const clamped = Math.max(0, Math.min(BOOTH.developS, machineS));
  const share = BOOTH.developS / BOOTH.baths.length;
  return {
    bath: Math.min(BOOTH.baths.length - 1, Math.floor(clamped / share)),
    progress: clamped / BOOTH.developS,
  };
}

/** Milliseconds from the start of the session to each flash. */
export function flashTimesMs(shots: number): number[] {
  return Array.from({ length: shots }, (_, n) => (BOOTH.firstFlashS + n * BOOTH.flashGapS) * 1000);
}

export function clockLabel(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
