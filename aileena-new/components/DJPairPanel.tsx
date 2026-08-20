'use client';

import { useMemo, useState } from 'react';
import { recommendPairs, type PairableTrack } from '../lib/djPairRecommend';
import { isMixableTrack } from '../lib/djMixable';

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
  const mixableLib = useMemo(
    () => library.filter((t) => isMixableTrack(t)),
    [library],
  );
  const pairs = useMemo(() => {
    if (!selected || mixableLib.length < 2) return [];
    return recommendPairs(selected, mixableLib, { hardTechnoBias: hard, limit: 3 });
  }, [selected, mixableLib, hard]);
  const empty = !selected || mixableLib.length < 2 || pairs.length === 0;

  return (
    <div
      data-testid="dj-pair-panel"
      data-hard-techno={hard ? 'true' : 'false'}
      data-pair-empty={empty ? 'true' : 'false'}
      style={{
        margin: '0 0 10px',
        padding: '8px 10px',
        borderRadius: 8,
        background: C.panel,
        border: '1px solid rgba(170,179,187,0.12)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.06em', color: C.sub }}>
          Pair
        </span>
        <label
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            color: C.dim,
            display: 'flex',
            gap: 6,
            alignItems: 'center',
          }}
        >
          <input
            data-testid="dj-hard-techno-bias"
            type="checkbox"
            checked={hard}
            onChange={(e) => setHard(e.target.checked)}
            style={{ width: 14, height: 14 }}
          />
          Hard
        </label>
      </div>

      {empty ? (
        <p
          data-testid="dj-pair-empty"
          style={{ margin: '8px 0 0', fontFamily: 'monospace', fontSize: 12, color: '#f5a524' }}
        >
          ⚡ Need two tracks.
        </p>
      ) : (
        <div data-testid="dj-pair-details">
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
              }}
            >
              <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 13, color: C.text }}>
                {p.title}
              </p>
              <button
                type="button"
                data-testid="dj-pair-load-b"
                onClick={() => onLoadB(p.trackId)}
                style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  letterSpacing: '0.04em',
                  padding: '6px 10px',
                  minHeight: 32,
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
        </div>
      )}
    </div>
  );
}
