'use client';

const TEAL = '#00a89d';
const ORANGE = '#ff9b5e';

export default function DJDeckWaveform({
  peaks,
  pos,
  dur,
  side,
  onSeek,
}: {
  peaks: number[] | null;
  pos: number;
  dur: number;
  side: 'left' | 'right';
  onSeek: (sec: number) => void;
}) {
  const color = side === 'left' ? TEAL : ORANGE;
  const bars = peaks ?? [];
  const progress = dur > 0 ? Math.min(1, pos / dur) : 0;

  return (
    <div
      data-testid={side === 'left' ? 'dj-waveform-a' : 'dj-waveform-b'}
      role="slider"
      aria-label={side === 'left' ? 'Deck A waveform' : 'Deck B waveform'}
      aria-valuemin={0}
      aria-valuemax={Math.round(dur)}
      aria-valuenow={Math.round(pos)}
      onClick={(e) => {
        if (!dur || !bars.length) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const t = (e.clientX - rect.left) / rect.width;
        onSeek(t * dur);
      }}
      style={{
        position: 'relative',
        height: 36,
        borderRadius: 4,
        background: '#0b0d10',
        border: '1px solid rgba(170,179,187,0.12)',
        cursor: bars.length ? 'pointer' : 'default',
        overflow: 'hidden',
      }}
    >
      {bars.length === 0 ? null : (
        <svg width="100%" height="36" viewBox={`0 0 ${bars.length} 36`} preserveAspectRatio="none">
          {bars.map((h, i) => {
            const barH = Math.max(1.2, h * 30);
            const played = i / bars.length <= progress;
            return (
              <rect
                key={i}
                x={i + 0.15}
                y={(36 - barH) / 2}
                width={0.7}
                height={barH}
                fill={played ? color : 'rgba(255,253,248,0.18)'}
              />
            );
          })}
          <line
            x1={progress * bars.length}
            x2={progress * bars.length}
            y1="0"
            y2="36"
            stroke="#fffdf8"
            strokeWidth="0.8"
          />
        </svg>
      )}
    </div>
  );
}
