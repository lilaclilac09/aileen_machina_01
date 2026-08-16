'use client';

/** Deck-side sticker notes — not a manual. */
export const DJ_SET_STICKERS = [
  { n: '1', label: 'load', hint: 'add two tracks' },
  { n: '2', label: 'cue', hint: 'set your start' },
  { n: '3', label: 'blend', hint: 'ride the fader' },
  { n: '4', label: 'record', hint: 'capture master' },
  { n: '5', label: 'export', hint: 'download + post' },
] as const;

export const DJ_SET_STICKER_FOOTER =
  'real audio only. Spotify is reference unless preview is available.';

const C = {
  text: '#fffdf8',
  dim: 'rgba(255,253,248,0.42)',
  sub: 'rgba(255,253,248,0.62)',
  cyan: '#00a89d',
  panel: '#14181e',
};

export default function DJSetStickers() {
  return (
    <div data-testid="dj-set-tutorial" style={{ margin: '0 0 10px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 152px), 1fr))',
          gap: 6,
        }}
      >
        {DJ_SET_STICKERS.map((s) => (
          <div
            key={s.label}
            data-testid={`dj-sticker-${s.label}`}
            style={{
              minWidth: 0,
              padding: '7px 8px 6px',
              borderRadius: 3,
              background: C.panel,
              border: '1px solid rgba(0,168,157,0.28)',
              boxShadow: 'inset 0 1px 0 rgba(255,253,248,0.04)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: 'monospace',
                fontSize: '0.52rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: C.cyan,
                lineHeight: 1.2,
              }}
            >
              {s.n} {s.label}
            </p>
            <p
              style={{
                margin: '3px 0 0',
                fontFamily: 'monospace',
                fontSize: '0.62rem',
                letterSpacing: '0.02em',
                color: C.sub,
                lineHeight: 1.25,
              }}
            >
              {s.hint}
            </p>
          </div>
        ))}
      </div>
      <p
        data-testid="dj-spotify-preview-note"
        style={{
          margin: '6px 0 0',
          fontFamily: 'monospace',
          fontSize: '0.5rem',
          letterSpacing: '0.04em',
          color: C.dim,
          lineHeight: 1.3,
        }}
      >
        {DJ_SET_STICKER_FOOTER}
      </p>
    </div>
  );
}
