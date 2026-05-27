'use client';
import { useEffect, useState } from 'react';

/**
 * Loading screen.
 *
 * Frames the site as a system booting up. Background is the machina portrait
 * (very dim, with a slow cyan scan-line sweeping across), and a stack of
 * SAT-LINK-style terminal lines streams in line-by-line. After the boot log
 * finishes the AILEENA / MACHINA title fades in, then the whole screen
 * dissolves into the site.
 */

const BOOT_LINES = [
  'SAT-A7 · 2.4 GHz · uplink ok',
  'AES-256 · encryption active',
  'machina · online',
];

const LINE_DELAY = 220;
const LINE_START = 200;
const TITLE_DELAY = LINE_START + BOOT_LINES.length * LINE_DELAY + 120;
const FADE_AT = TITLE_DELAY + 520;
const DISMISS_AT = FADE_AT + 600;

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false);
  const [linesIn, setLinesIn] = useState(0);
  const [titleIn, setTitleIn] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setLinesIn(i + 1), LINE_START + i * LINE_DELAY));
    });
    timers.push(setTimeout(() => setTitleIn(true), TITLE_DELAY));
    timers.push(setTimeout(() => setFading(true), FADE_AT));
    timers.push(setTimeout(() => onDone(), DISMISS_AT));
    return () => { timers.forEach(clearTimeout); };
  }, [onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.55s ease',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'all',
        color: '#fff',
        overflow: 'hidden',
      }}
    >
      {/* Machina portrait, deeply dimmed */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/bg_pic/03.jpeg')",
          backgroundSize: 'cover',
          backgroundPosition: '32% 18%',
          opacity: 0.18,
          filter: 'grayscale(0.35) contrast(1.05) brightness(0.85)',
        }}
      />

      {/* Slow cyan scan-line across the whole screen */}
      <div aria-hidden className="loading-scan" />

      {/* Soft vignette */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      {/* Center stack: boot log + title */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 36,
          padding: '0 24px',
        }}
      >
        {/* Boot log */}
        <ul
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            fontSize: 10.5,
            letterSpacing: '0.28em',
            color: 'rgba(0,255,234,0.85)',
            textTransform: 'uppercase',
            listStyle: 'none',
            padding: 0,
            margin: 0,
            minWidth: 260,
            textAlign: 'left',
            lineHeight: 1.9,
          }}
        >
          {BOOT_LINES.map((line, i) => (
            <li
              key={line}
              style={{
                opacity: i < linesIn ? 1 : 0,
                transform: i < linesIn ? 'translateX(0)' : 'translateX(-4px)',
                transition: 'opacity 0.25s ease, transform 0.25s ease',
              }}
            >
              <span style={{ color: 'rgba(0,255,234,0.4)', marginRight: 8 }}>▸</span>
              {line}
            </li>
          ))}
        </ul>

        {/* Title — fades in after the log completes */}
        <div
          style={{
            opacity: titleIn ? 1 : 0,
            transform: titleIn ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 0.45s ease, transform 0.45s ease',
            textAlign: 'center',
            fontFamily: "'Barlow Condensed', system-ui, sans-serif",
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: '0.18em',
          }}
        >
          <div style={{ fontSize: 'clamp(1.6rem, 5vw, 2.6rem)', color: '#fff' }}>AILEENA</div>
          <div style={{ fontSize: 'clamp(1.6rem, 5vw, 2.6rem)', color: '#00ffea' }}>MACHINA</div>
        </div>
      </div>
    </div>
  );
}
