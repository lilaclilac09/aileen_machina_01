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
        padding: '10px 12px',
        borderRadius: 8,
        background: C.panel,
        border: '1px solid rgba(170,179,187,0.12)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.34rem', letterSpacing: '0.28em', color: C.dim }}>
          PAIR · metadata only
        </p>
        <label style={{ fontFamily: 'monospace', fontSize: '0.4rem', color: C.sub, display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            data-testid="dj-hard-techno-bias"
            type="checkbox"
            checked={hard}
            onChange={(e) => setHard(e.target.checked)}
          />
          hard techno bias
        </label>
      </div>
      <p style={{ margin: '6px 0 0', fontFamily: 'monospace', fontSize: '0.4rem', color: C.dim, lineHeight: 1.45 }}>
        based on metadata, not full audio analysis
        {selected ? ` · from “${selected.title}”` : ' · load a crate track first'}
      </p>
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
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid rgba(255,253,248,0.06)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.55rem', color: C.text }}>
              {p.title}
              {p.artist ? ` · ${p.artist}` : ''}
              {p.bpm ? ` · ${p.bpm}` : ''}
            </p>
            <p style={{ margin: '2px 0 0', fontFamily: 'monospace', fontSize: '0.4rem', color: C.dim }}>
              {p.confidence} · {p.why}
            </p>
            <p data-testid="dj-pair-feedback" style={{ margin: '2px 0 0', fontFamily: 'monospace', fontSize: '0.4rem', color: C.cyan }}>
              {p.feedback}
            </p>
          </div>
          <button
            type="button"
            data-testid="dj-pair-load-b"
            onClick={() => onLoadB(p.trackId)}
            style={{
              fontFamily: 'monospace',
              fontSize: '0.38rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '8px 10px',
              minHeight: 36,
              borderRadius: 3,
              border: '1px solid rgba(0,168,157,0.4)',
              background: 'transparent',
              color: C.cyan,
              cursor: 'pointer',
            }}
          >
            load B · ref
          </button>
        </div>
      ))}
    </div>
  );
}
