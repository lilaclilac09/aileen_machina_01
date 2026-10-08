'use client';

import { useMemo, useRef, useState } from 'react';
import {
  VOCAL_LANGS,
  VOCAL_SAMPLES,
  vocalToDeckTrack,
  type VocalLang,
  type VocalSample,
} from '../lib/djVocalSamples';
import type { DeckTrack } from '../lib/djSetlist';

const T = {
  text: '#fffdf8',
  dim: 'rgba(255,253,248,0.42)',
  muted: 'rgba(255,253,248,0.22)',
  cyan: '#00a89d',
  cyanDim: 'rgba(0,168,157,0.16)',
  cyanGlow: 'rgba(0,168,157,0.35)',
  border: 'rgba(170,179,187,0.14)',
};

export default function VocalSampleRack({
  onLoadNext,
  onSetDragTrack,
}: {
  onLoadNext?: (track: DeckTrack) => void;
  onSetDragTrack?: (track: DeckTrack) => void;
}) {
  const [lang, setLang] = useState<VocalLang>('fr');
  const clips = useMemo(
    () => VOCAL_SAMPLES.filter((s) => s.lang === lang),
    [lang],
  );

  return (
    <section
      id="vocals"
      data-testid="dj-vocals"
      aria-label="人声"
      style={{
        marginTop: 22,
        padding: '14px 12px 12px',
        borderRadius: 10,
        background: '#12161b',
        border: `1px solid ${T.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'monospace',
            fontSize: '0.42rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: T.dim,
          }}
        >
          人声
        </p>
        <div role="tablist" aria-label="language" style={{ display: 'flex', gap: 6 }}>
          {VOCAL_LANGS.map((item) => {
            const on = item.id === lang;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={on}
                data-testid={`dj-vocals-lang-${item.id}`}
                onClick={() => setLang(item.id)}
                style={{
                  minHeight: 32,
                  padding: '0 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontSize: '0.62rem',
                  letterSpacing: '0.12em',
                  color: on ? T.cyan : T.dim,
                  background: on ? T.cyanDim : 'transparent',
                  border: `1px solid ${on ? T.cyanGlow : T.border}`,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'grid', gap: 6 }}>
        {clips.length === 0 ? (
          <li
            data-testid="dj-vocals-empty"
            style={{
              fontFamily: 'monospace',
              fontSize: '0.68rem',
              letterSpacing: '0.08em',
              color: T.muted,
              padding: '8px 2px',
            }}
          >
            —
          </li>
        ) : (
          clips.map((clip) => (
            <VocalClipRow
              key={clip.id}
              clip={clip}
              onLoadNext={onLoadNext}
              onSetDragTrack={onSetDragTrack}
            />
          ))
        )}
      </ul>
    </section>
  );
}

function VocalClipRow({
  clip,
  onLoadNext,
  onSetDragTrack,
}: {
  clip: VocalSample;
  onLoadNext?: (track: DeckTrack) => void;
  onSetDragTrack?: (track: DeckTrack) => void;
}) {
  const lastClick = useRef(0);

  function load() {
    onLoadNext?.(vocalToDeckTrack(clip));
  }

  return (
    <li>
      <a
        href={clip.href}
        target="_blank"
        rel="noreferrer"
        draggable
        data-testid={`dj-vocals-clip-${clip.id}`}
        data-track-id={clip.id}
        aria-label={`${clip.source}. Double-click to load a deck.`}
        onDragStart={(e) => {
          const track = vocalToDeckTrack(clip);
          onSetDragTrack?.(track);
          try {
            e.dataTransfer.setData('text/plain', clip.id);
            e.dataTransfer.effectAllowed = 'copy';
          } catch {
            /* some browsers throw on setData during tests */
          }
        }}
        onClick={(e) => {
          if (e.detail > 1) {
            e.preventDefault();
            return;
          }
        }}
        onDoubleClick={(e) => {
          e.preventDefault();
          const now = Date.now();
          if (now - lastClick.current < 80) return;
          lastClick.current = now;
          load();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '7px 10px 7px 7px',
          borderRadius: 6,
          border: `1px solid ${T.border}`,
          color: T.text,
          textDecoration: 'none',
          cursor: 'grab',
        }}
      >
        <img
          src={clip.thumb}
          alt=""
          draggable={false}
          data-testid={`dj-vocals-cover-${clip.id}`}
          style={{
            width: 44,
            height: 44,
            borderRadius: 3,
            objectFit: 'cover',
            flexShrink: 0,
            background: '#0b0d10',
          }}
        />
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '0.72rem',
            letterSpacing: '0.02em',
            lineHeight: 1.45,
          }}
        >
          {clip.source}
        </span>
      </a>
    </li>
  );
}
