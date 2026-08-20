'use client';

import { useEffect, useId, useState } from 'react';
import { readCosmic, type CosmicSnapshot } from '../lib/twoLinesCosmic';

const sans = "'Nunito', system-ui, -apple-system, sans-serif";

function MoonDisc({
  illumination,
  waxing,
  ink,
}: {
  illumination: number;
  waxing: boolean;
  ink: string;
}) {
  const uid = useId().replace(/:/g, '');
  const r = 30;
  const shift = (waxing ? -1 : 1) * illumination * 2.15 * r;
  return (
    <svg
      data-testid="daily-moon"
      width="72"
      height="72"
      viewBox="0 0 64 64"
      aria-hidden
    >
      <defs>
        <radialGradient id={`g-${uid}`} cx="38%" cy="32%">
          <stop offset="0%" stopColor="#fff8ee" />
          <stop offset="55%" stopColor="#e8dcc8" />
          <stop offset="100%" stopColor="#b9a78c" />
        </radialGradient>
        <mask id={`m-${uid}`}>
          <rect width="64" height="64" fill="black" />
          <circle cx="32" cy="32" r={r} fill="white" />
          <circle cx={32 + shift} cy="32" r={r} fill="black" />
        </mask>
      </defs>
      <circle cx="32" cy="32" r={r} fill={ink} opacity="0.14" />
      <circle cx="32" cy="32" r={r} fill={`url(#g-${uid})`} mask={`url(#m-${uid})`} />
      <circle cx="32" cy="32" r={r - 0.4} fill="none" stroke={ink} strokeOpacity="0.18" />
    </svg>
  );
}

function rocketLine(rocket: CosmicSnapshot['rocket']): string {
  if (rocket.kind === 'waiting') return 'rocket waiting';
  if (rocket.kind === 'launched') return 'rocket ·';
  return `rocket ${rocket.bar} ${rocket.pct}%`;
}

export default function TwoLinesCosmicStrip({
  ink,
  accent,
}: {
  ink: string;
  accent: string;
}) {
  const [snap, setSnap] = useState<CosmicSnapshot>(() => readCosmic());

  useEffect(() => {
    const id = window.setInterval(() => setSnap(readCosmic()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const line = {
    margin: 0,
    fontFamily: sans,
    fontSize: 11,
    letterSpacing: '0.02em',
    lineHeight: 1.45,
    opacity: 0.55,
    color: ink,
  } as const;

  return (
    <aside
      className="two-lines-cosmic"
      data-testid="daily-cosmic-strip"
      aria-label="sky"
      style={{
        display: 'grid',
        justifyItems: 'center',
        gap: 6,
        paddingTop: 4,
        textAlign: 'center',
        maxWidth: 140,
        margin: '0 auto',
      }}
    >
      <MoonDisc illumination={snap.moon.illumination} waxing={snap.moon.waxing} ink={ink} />
      <p data-testid="daily-moon-phase" style={{ ...line, opacity: 0.7 }}>
        {snap.moon.name}
      </p>
      <p data-testid="daily-mars" title={`MSD ${snap.mars.msd.toFixed(2)}`} style={line}>
        mars {snap.mars.hhmm}
      </p>
      <p data-testid="daily-saturn-watch" style={line}>
        saturn watch {snap.saturnWatch}
      </p>
      <p data-testid="daily-rocket" style={{ ...line, color: accent, opacity: 0.75 }}>
        {rocketLine(snap.rocket)}
      </p>
    </aside>
  );
}
