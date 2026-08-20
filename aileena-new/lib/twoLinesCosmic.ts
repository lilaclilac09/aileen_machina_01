/**
 * Quiet cosmic strip for /daily (two lines).
 * Moon + Mars MTC are approximate formulas. Saturn is a playful watch, not ephemeris.
 */

const SYNODIC_DAYS = 29.530588853;
/** Known new moon (UTC). */
const KNOWN_NEW_MS = Date.UTC(2000, 0, 6, 18, 14, 0);
/** Saturn sidereal day — watch period only. */
const SATURN_WATCH_MS = (10 * 3600 + 33 * 60 + 38) * 1000;

/**
 * Watched launch ISO. Override with NEXT_LAUNCH_DATE.
 * Set NEXT_LAUNCH_DATE=off to show “rocket waiting”.
 * Start of the progress window: NEXT_LAUNCH_START or 120 days before launch.
 */
export function launchIso(): string {
  const raw = (process.env['NEXT_LAUNCH_DATE'] ?? '2026-11-15T16:00:00.000Z').trim();
  if (!raw || raw === 'off' || raw === 'none') return '';
  return raw;
}

export function launchStartIso(launch: string): string {
  const raw = (process.env['NEXT_LAUNCH_START'] ?? '').trim();
  if (raw) return raw;
  if (!launch) return '';
  const t = Date.parse(launch);
  if (!Number.isFinite(t)) return '';
  return new Date(t - 120 * 86400000).toISOString();
}

function pad2(n: number): string {
  return String(Math.floor(n)).padStart(2, '0');
}

export type MoonPhase = {
  name: string;
  ageDays: number;
  illumination: number;
  waxing: boolean;
};

export function moonPhaseAt(date: Date = new Date()): MoonPhase {
  const days = (date.getTime() - KNOWN_NEW_MS) / 86400000;
  const age = ((days % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS;
  const t = age / SYNODIC_DAYS;
  const illumination = (1 - Math.cos(2 * Math.PI * t)) / 2;
  const waxing = t < 0.5;
  let name = 'new';
  if (age < 1.845) name = 'new';
  else if (age < 7.382) name = 'waxing crescent';
  else if (age < 9.228) name = 'first quarter';
  else if (age < 13.765) name = 'waxing gibbous';
  else if (age < 15.611) name = 'full';
  else if (age < 22.149) name = 'waning gibbous';
  else if (age < 23.995) name = 'last quarter';
  else if (age < 27.687) name = 'waning crescent';
  else name = 'new';
  return { name, ageDays: age, illumination, waxing };
}

/** Mars Sol Date + Mars Coordinated Time (approx; TT−UTC ≈ 69.184s). */
export function marsClockAt(date: Date = new Date()): { sol: number; hhmm: string; msd: number } {
  const jdUtc = date.getTime() / 86400000 + 2440587.5;
  const jdTt = jdUtc + 69.184 / 86400;
  const msd = (jdTt - 2451549.5) / 1.0274912517 + 44796.0 - 0.00096;
  const frac = ((msd % 1) + 1) % 1;
  const hours = frac * 24;
  const hh = Math.floor(hours);
  const mm = Math.floor((hours - hh) * 60);
  return { sol: Math.floor(msd), hhmm: `${pad2(hh)}:${pad2(mm)}`, msd };
}

/** Playful 10h33m watch — not Saturn longitude or local solar time. */
export function saturnWatchAt(date: Date = new Date()): string {
  const t = ((date.getTime() % SATURN_WATCH_MS) + SATURN_WATCH_MS) % SATURN_WATCH_MS;
  const hours = t / 3600000;
  const hh = Math.floor(hours);
  const mm = Math.floor((hours - hh) * 60);
  return `${pad2(hh)}:${pad2(mm)}`;
}

export type RocketProgress =
  | { kind: 'waiting' }
  | { kind: 'progress'; pct: number; bar: string }
  | { kind: 'launched' };

export function rocketProgressAt(date: Date = new Date(), launch = launchIso()): RocketProgress {
  if (!launch) return { kind: 'waiting' };
  const end = Date.parse(launch);
  if (!Number.isFinite(end)) return { kind: 'waiting' };
  if (date.getTime() >= end) return { kind: 'launched' };
  const start = Date.parse(launchStartIso(launch));
  const origin = Number.isFinite(start) ? start : end - 120 * 86400000;
  const span = Math.max(1, end - origin);
  const pct = Math.max(0, Math.min(99, Math.round(((date.getTime() - origin) / span) * 100)));
  const ticks = 4;
  const filled = Math.round((pct / 100) * ticks);
  const bar = `${'▰'.repeat(filled)}${'▱'.repeat(ticks - filled)}`;
  return { kind: 'progress', pct, bar };
}

export type CosmicSnapshot = {
  moon: MoonPhase;
  mars: { sol: number; hhmm: string; msd: number };
  saturnWatch: string;
  rocket: RocketProgress;
};

export function readCosmic(date: Date = new Date()): CosmicSnapshot {
  return {
    moon: moonPhaseAt(date),
    mars: marsClockAt(date),
    saturnWatch: saturnWatchAt(date),
    rocket: rocketProgressAt(date),
  };
}
