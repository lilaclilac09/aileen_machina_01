'use client';

import { useMemo, useState } from 'react';
import { recommendPairs, type PairableTrack } from '../lib/djPairRecommend';

const C = {
  text: '#fffdf8',
  dim: 'rgba(255,253,248,0.42)',
  sub: 'rgba(255,253,248,0.62)',
  cyan: '#00a89d',
  panel: '#12161b',
};

export default function DJPairPanel({
  selected,
  library,
  onLoadB,
}: {
  selected: PairableTrack | null;
  library: PairableTrack[];
  onLoadB: (id: string) => void;
}) {
  const [hard, setHard] = useState(true);
  const pairs = useMemo(
    () => (selected ? recommendPairs(selected, library, { hardTechnoBias: hard, limit: 4 }) : []),
    [selected, library, hard],
  );

  return (
    <div
      data-testid="dj-pair-panel"
      data-hard-techno={hard ? 'true' : 'false'}
      style={{
        margin: '0 0 10px',
        padding: '12px',
        borderRadius: 8,
        background: C.panel,
        border: '1px solid rgba(170,179,187,0.12)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 15, letterSpacing: '0.06em', color: C.text }}>
          Pair
        </span>
        <label
          style={{
            fontFamily: 'monospace',
            fontSize: 14,
            color: C.text,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            minHeight: 44,
          }}
        >
          <input
            data-testid="dj-hard-techno-bias"
            type="checkbox"
            checked={hard}
            onChange={(e) => setHard(e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
          Hard techno
        </label>
      </div>

      <details data-testid="dj-pair-details">
        <summary
          data-testid="dj-pair-toggle"
          style={{
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: 14,
            color: C.sub,
            marginTop: 6,
            minHeight: 36,
            listStyle: 'none',
          }}
        >
          {selected ? `Suggestions for “${selected.title}”` : 'Load a track first'}
        </summary>
        {pairs.map((p) => (
          <div
            key={p.trackId}
            data-testid="dj-pair-hit"
            data-confidence={p.confidence}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 8,
              alignItems: 'center',
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid rgba(255,253,248,0.06)',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 14, color: C.text }}>
                {p.title}
                {p.artist ? ` · ${p.artist}` : ''}
              </p>
              <p data-testid="dj-pair-feedback" style={{ margin: '4px 0 0', fontFamily: 'monospace', fontSize: 13, color: C.cyan }}>
                {p.feedback}
              </p>
            </div>
            <button
              type="button"
              data-testid="dj-pair-load-b"
              onClick={() => onLoadB(p.trackId)}
              style={{
                fontFamily: 'monospace',
                fontSize: 14,
                letterSpacing: '0.04em',
                padding: '10px 12px',
                minHeight: 44,
                borderRadius: 4,
                border: '1px solid rgba(0,168,157,0.4)',
                background: 'transparent',
                color: C.cyan,
                cursor: 'pointer',
              }}
            >
              Load B
            </button>
          </div>
        ))}
      </details>
    </div>
  );
}
