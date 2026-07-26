'use client';

import { useState } from 'react';
import {
  COVERFLOW_RANGES,
  type CoverflowSettings,
} from '../lib/useCoverflowSettings';

const nunito = "'Nunito', system-ui, -apple-system, sans-serif";
const mono = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

export type CoverflowPanelStrings = {
  title: string;
  reset: string;
  show: string;
  hide: string;
  panelAriaLabel: string;
  groups: {
    layout: string;
    rotation: string;
    visual: string;
    physics: string;
  };
};

type GroupKey = keyof CoverflowPanelStrings['groups'];
type Group = { key: GroupKey; keys: (keyof CoverflowSettings)[] };

const GROUPS: Group[] = [
  { key: 'layout', keys: ['gap', 'translateX', 'translateY', 'depth', 'perspective'] },
  { key: 'rotation', keys: ['rotateX', 'rotateY', 'rotateZ'] },
  { key: 'visual', keys: ['scaleMin', 'opacityMin'] },
  { key: 'physics', keys: ['stiffness', 'damping', 'mass', 'velocityE'] },
];

export default function CoverflowPanel({
  settings,
  update,
  reset,
  open,
  onToggle,
  hydrated,
  isMobile,
  t,
}: {
  settings: CoverflowSettings;
  update: <K extends keyof CoverflowSettings>(key: K, value: CoverflowSettings[K]) => void;
  reset: () => void;
  open: boolean;
  onToggle: () => void;
  hydrated: boolean;
  isMobile: boolean;
  t: CoverflowPanelStrings;
}) {
  // Hold chrome until localStorage is read — avoids iOS flash of defaults
  // then snap to saved values (felt like a "reset").
  if (!hydrated) return null;

  return (
    <>
      <ToggleButton open={open} onToggle={onToggle} isMobile={isMobile} t={t} />
      <aside
        aria-label={t.panelAriaLabel}
        style={
          isMobile
            ? {
                position: 'fixed',
                left: 10,
                right: 10,
                bottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
                maxHeight: 'min(52vh, 420px)',
                background: 'rgba(255, 255, 255, 0.96)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(17, 17, 17, 0.12)',
                borderRadius: 12,
                boxShadow:
                  '0 24px 56px -28px rgba(17, 17, 17, 0.28), 0 0 0 1px rgba(17, 17, 17, 0.04)',
                color: '#111',
                fontFamily: nunito,
                zIndex: 60,
                transform: open ? 'translateY(0)' : 'translateY(120%)',
                transition: 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                // Keep the drawer out of Safari's rubber-band / home-indicator fight.
                touchAction: 'pan-y',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              }
            : {
                position: 'fixed',
                top: 'clamp(70px, 12vh, 110px)',
                right: open ? 14 : -360,
                bottom: 14,
                width: 320,
                maxWidth: 'calc(100vw - 28px)',
                background: 'rgba(255, 255, 255, 0.94)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(17, 17, 17, 0.12)',
                borderRadius: 4,
                boxShadow:
                  '0 24px 56px -28px rgba(17, 17, 17, 0.28), 0 0 0 1px rgba(17, 17, 17, 0.04)',
                color: '#111',
                fontFamily: nunito,
                zIndex: 60,
                transition: 'right 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }
        }
        aria-hidden={!open}
      >
        <header
          style={{
            padding: isMobile ? '12px 14px 10px' : '14px 18px 12px',
            borderBottom: '1px solid rgba(17, 17, 17, 0.09)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: mono,
              fontSize: '0.62rem',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#008f84',
              fontWeight: 600,
            }}
          >
            {t.title}
          </span>
          <ResetButton reset={reset} label={t.reset} confirm={isMobile} />
        </header>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: isMobile ? '2px 14px 16px' : '4px 18px 18px',
            overscrollBehavior: 'contain',
          }}
        >
          {GROUPS.map((g, index) => (
            <GroupSection
              key={g.key}
              group={g}
              label={t.groups[g.key]}
              settings={settings}
              update={update}
              defaultOpen={!isMobile || index === 0}
              compact={isMobile}
            />
          ))}
        </div>
      </aside>
    </>
  );
}

function ResetButton({
  reset,
  label,
  confirm,
}: {
  reset: () => void;
  label: string;
  confirm: boolean;
}) {
  const onClick = () => {
    if (confirm && typeof window !== 'undefined') {
      const ok = window.confirm('Reset coverflow settings to defaults? Your saved tweaks will be cleared.');
      if (!ok) return;
    }
    reset();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        appearance: 'none',
        border: '1px solid rgba(17,17,17,0.14)',
        background: 'transparent',
        color: 'rgba(17,17,17,0.55)',
        padding: '3px 9px',
        borderRadius: 999,
        fontFamily: mono,
        fontSize: '0.55rem',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        // Avoid fat-finger reset while scrubbing nearby sliders on iOS.
        minHeight: 28,
        minWidth: 52,
      }}
      aria-label={label}
    >
      {label}
    </button>
  );
}

function GroupSection({
  group,
  label,
  settings,
  update,
  defaultOpen,
  compact,
}: {
  group: Group;
  label: string;
  settings: CoverflowSettings;
  update: <K extends keyof CoverflowSettings>(key: K, value: CoverflowSettings[K]) => void;
  defaultOpen: boolean;
  compact: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section style={{ marginTop: compact ? 10 : 16 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          appearance: 'none',
          border: 0,
          background: 'transparent',
          padding: 0,
          margin: '0 0 8px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            fontFamily: mono,
            fontSize: '0.52rem',
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'rgba(17,17,17,0.42)',
            fontWeight: 600,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: mono,
            fontSize: '0.55rem',
            color: 'rgba(17,17,17,0.35)',
            letterSpacing: '0.12em',
          }}
        >
          {open ? '−' : '+'}
        </span>
      </button>
      {open
        ? group.keys.map((k) => (
            <Slider key={k} name={k} value={settings[k]} onChange={(v) => update(k, v)} />
          ))
        : null}
    </section>
  );
}

function ToggleButton({
  open,
  onToggle,
  isMobile,
  t,
}: {
  open: boolean;
  onToggle: () => void;
  isMobile: boolean;
  t: CoverflowPanelStrings;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-pressed={open}
      aria-label={open ? t.hide : t.show}
      style={{
        position: 'fixed',
        // Bottom-right on mobile so it doesn't fight home indicator + left chrome.
        right: isMobile ? 14 : undefined,
        left: isMobile ? undefined : 14,
        bottom: isMobile ? 'max(14px, env(safe-area-inset-bottom, 14px))' : 14,
        zIndex: 61,
        appearance: 'none',
        border: '1px solid rgba(0, 143, 132, 0.34)',
        background: hover ? 'rgba(0, 143, 132, 0.08)' : '#fff',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: '#008f84',
        padding: isMobile ? '10px 14px' : '8px 14px',
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
        boxShadow: '0 6px 18px -10px rgba(17,17,17,0.32)',
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
          background: open ? '#008f84' : 'rgba(0,143,132,0.38)',
          boxShadow: open ? '0 0 8px rgba(0,143,132,0.55)' : 'none',
        }}
      />
      {t.title} {open ? '⌄' : '⌃'}
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
            color: 'rgba(17,17,17,0.68)',
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: mono,
            fontSize: '0.62rem',
            color: '#008f84',
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
        onInput={(e) => onChange(Number((e.target as HTMLInputElement).value))}
        style={{
          width: '100%',
          accentColor: '#008f84',
          cursor: 'pointer',
          // iOS: keep horizontal scrub from scrolling the page / closing drawer.
          touchAction: 'none',
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
