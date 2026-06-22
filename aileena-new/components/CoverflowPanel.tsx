'use client';

import { useState } from 'react';
import {
  COVERFLOW_RANGES,
  type CoverflowSettings,
} from '../lib/useCoverflowSettings';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

type Group = { label: string; keys: (keyof CoverflowSettings)[] };

const GROUPS: Group[] = [
  { label: 'Layout', keys: ['gap', 'translateX', 'translateY', 'depth', 'perspective'] },
  { label: 'Rotation', keys: ['rotateX', 'rotateY', 'rotateZ'] },
  { label: 'Visual', keys: ['scaleMin', 'opacityMin'] },
  { label: 'Physics', keys: ['stiffness', 'damping', 'mass', 'velocityE'] },
];

export default function CoverflowPanel({
  settings,
  update,
  reset,
  open,
  onToggle,
}: {
  settings: CoverflowSettings;
  update: <K extends keyof CoverflowSettings>(key: K, value: CoverflowSettings[K]) => void;
  reset: () => void;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <ToggleButton open={open} onToggle={onToggle} />
      <aside
        aria-label="Coverflow tuner"
        style={{
          position: 'fixed',
          top: 'clamp(70px, 12vh, 110px)',
          right: open ? 14 : -360,
          bottom: 14,
          width: 320,
          maxWidth: 'calc(100vw - 28px)',
          background: 'rgba(10, 10, 10, 0.78)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(255, 167, 38, 0.22)',
          borderRadius: 4,
          boxShadow:
            '0 30px 60px -20px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 167, 38, 0.08)',
          color: '#fff',
          fontFamily: nunito,
          zIndex: 60,
          transition: 'right 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            padding: '14px 18px 12px',
            borderBottom: '1px solid rgba(255, 167, 38, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: mono,
              fontSize: '0.62rem',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#ffa726',
              fontWeight: 600,
            }}
          >
            Coverflow
          </span>
          <button
            type="button"
            onClick={reset}
            style={{
              appearance: 'none',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.55)',
              padding: '3px 9px',
              borderRadius: 999,
              fontFamily: mono,
              fontSize: '0.55rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
            aria-label="Reset to defaults"
          >
            Reset
          </button>
        </header>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '4px 18px 18px',
          }}
        >
          {GROUPS.map((g) => (
            <section key={g.label} style={{ marginTop: 16 }}>
              <p
                style={{
                  fontFamily: mono,
                  fontSize: '0.52rem',
                  letterSpacing: '0.32em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                  margin: '0 0 10px',
                  fontWeight: 600,
                }}
              >
                {g.label}
              </p>
              {g.keys.map((k) => (
                <Slider
                  key={k}
                  name={k}
                  value={settings[k]}
                  onChange={(v) => update(k, v)}
                />
              ))}
            </section>
          ))}
        </div>
      </aside>
    </>
  );
}

function ToggleButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-pressed={open}
      aria-label={open ? 'Hide Coverflow panel' : 'Show Coverflow panel'}
      style={{
        position: 'fixed',
        left: 14,
        bottom: 14,
        zIndex: 60,
        appearance: 'none',
        border: '1px solid rgba(255, 167, 38, 0.35)',
        background: hover ? 'rgba(255, 167, 38, 0.12)' : 'rgba(10, 10, 10, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: '#ffa726',
        padding: '8px 14px',
        borderRadius: 999,
        fontFamily: mono,
        fontSize: '0.58rem',
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 6px 18px -8px rgba(0,0,0,0.6)',
        transition: 'background 0.18s ease, border-color 0.18s ease',
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: open ? '#ffa726' : 'rgba(255,167,38,0.4)',
          boxShadow: open ? '0 0 8px rgba(255,167,38,0.85)' : 'none',
        }}
      />
      Coverflow {open ? '⌄' : '⌃'}
    </button>
  );
}

function Slider({
  name,
  value,
  onChange,
}: {
  name: keyof CoverflowSettings;
  value: number;
  onChange: (v: number) => void;
}) {
  const range = COVERFLOW_RANGES[name];
  const display = formatValue(name, value);
  return (
    <label
      style={{
        display: 'block',
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontFamily: mono,
            fontSize: '0.6rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: mono,
            fontSize: '0.62rem',
            color: '#ffa726',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {display}
        </span>
      </div>
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: '#ffa726',
          cursor: 'pointer',
        }}
      />
    </label>
  );
}

function formatValue(name: keyof CoverflowSettings, value: number): string {
  if (name === 'opacityMin' || name === 'scaleMin' || name === 'mass' || name === 'velocityE') {
    return value.toFixed(2);
  }
  if (name === 'rotateX' || name === 'rotateY' || name === 'rotateZ') {
    return `${value.toFixed(0)}°`;
  }
  if (name === 'depth' || name === 'perspective') {
    return `${value.toFixed(0)}px`;
  }
  return value.toFixed(0);
}
