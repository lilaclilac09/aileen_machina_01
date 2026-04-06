'use client';
import { useState, useMemo, useRef } from 'react';

type Track = {
  id: string;
  title: string;
  bpm: number;
  key: string;
  dur: number;
  thumb: string;
};

type ViewMode = 'list' | 'playlist';
type SortField = 'title' | 'bpm' | 'key';
type SortDir = 'asc' | 'desc';

const BARS = 48;
function generateWaveform(seed: string, bars: number): number[] {
  let h = 0;
  for (const c of seed) h = (h << 5) - h + c.charCodeAt(0);
  const out: number[] = [];
  for (let i = 0; i < bars; i++) {
    h = ((h * 1103515245) + 12345) & 0x7fffffff;
    const env = Math.sin((i / bars) * Math.PI) * 0.45 + 0.55;
    out.push(0.06 + ((h % 100) / 100) * env * 0.94);
  }
  return out;
}

const C = {
  bg:      '#111114',
  deck:    '#18181c',
  panel:   '#1e1e24',
  border:  'rgba(255,255,255,0.15)',
  muted:   'rgba(255,255,255,0.22)',
  dim:     'rgba(255,255,255,0.14)',
  cyan:    '#06b6d4',
  green:   '#22c55e',
  orange:  '#f97316',
  blue:    '#3b82f6',
  text:    'rgba(255,255,255,0.96)',
  sub:     'rgba(255,255,255,0.52)',
};

export default function TrackLibraryBrowser({ tracks, onLoadTrack, onSetDragTrack }: { 
  tracks: Track[];
  onLoadTrack?: (side: 'left' | 'right', track: Track) => void;
  onSetDragTrack?: (track: Track) => void;
}) {
  const [mode, setMode] = useState<ViewMode>('list');
  const [playlistIdx, setPlaylistIdx] = useState(0);

  return (
    <div style={{ marginTop: 20 }}>
      {/* ── View Switcher ── */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16,
        alignItems: 'center',
      }}>
        <button
          onClick={() => setMode('list')}
          style={{
            padding: '10px 16px',
            borderRadius: 6,
            border: 'none',
            background: mode === 'list' ? `${C.cyan}25` : C.deck,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: mode === 'list' ? `0 0 20px ${C.cyan}50, inset 0 0 16px ${C.cyan}25` : 'inset 0 1px 3px rgba(0,0,0,0.5)',
          }}
        >
          <svg width="26" height="16" style={{ display: 'block' }}>
            {[0.6, 0.8, 1, 0.7, 0.5, 0.9, 1, 0.4].map((h, i) => (
              <rect key={i} x={i * 3.25} y={(16 - h * 14) / 2} width={2.3} height={h * 14}
                fill={mode === 'list' ? C.cyan : C.sub} rx="0.6" />
            ))}
          </svg>
        </button>

        <button
          onClick={() => setMode('playlist')}
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            border: 'none',
            background: mode === 'playlist'
              ? `radial-gradient(circle at 35% 35%, ${C.cyan}32, rgba(6, 182, 212, 0.08))`
              : C.deck,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: mode === 'playlist' ? `0 0 24px ${C.cyan}55, inset 0 0 24px ${C.cyan}30` : 'inset 0 1px 3px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="22" height="22" style={{ display: 'block' }}>
            <circle cx="11" cy="11" r="9.5" fill="none" stroke={mode === 'playlist' ? C.cyan : C.sub} strokeWidth="1.6" opacity="0.75" />
            <circle cx="11" cy="11" r="6" fill="none" stroke={mode === 'playlist' ? C.cyan : C.sub} strokeWidth="1.1" opacity="0.5" />
            <circle cx="11" cy="11" r="2.8" fill={mode === 'playlist' ? C.cyan : C.sub} opacity="0.85" />
          </svg>
        </button>
      </div>

      {/* ── Content ── */}
      {mode === 'list' ? (
        <ListView tracks={tracks} onLoadTrack={onLoadTrack} onSetDragTrack={onSetDragTrack} />
      ) : (
        <PlaylistCarousel
          tracks={tracks}
          activeIdx={playlistIdx}
          setActiveIdx={setPlaylistIdx}
          dragging={false}
          handlePointerDown={() => {}}
          handlePointerMove={() => {}}
          handlePointerUp={() => {}}
          onLoadTrack={onLoadTrack}
          onSetDragTrack={onSetDragTrack}
        />
      )}
    </div>
  );
}

/* ─── LIST VIEW ─────────────────────────────────────────── */
function ListView({ 
  tracks,
  onLoadTrack,
  onSetDragTrack 
}: {
  tracks: Track[];
  onLoadTrack?: (side: 'left' | 'right', track: Track) => void;
  onSetDragTrack?: (track: Track) => void;
}) {
  return (
    <div style={{ borderRadius: 8, border: 'none', overflow: 'hidden', background: C.bg }}>
      {/* Headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr 150px',
        gap: 0,
        padding: '12px 14px',
        background: '#0f0f12',
        borderBottom: 'none',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.32rem', letterSpacing: '0.3em', color: C.dim, fontWeight: 800 }}>#</span>
        <span style={{ fontFamily: 'monospace', fontSize: '0.32rem', letterSpacing: '0.3em', color: C.dim, fontWeight: 800, textTransform: 'uppercase' }}>TRACK</span>
      </div>

      {/* Rows */}
      {tracks.map((track, i) => (
        <ListTrackRow key={track.id} index={i + 1} track={track} onLoadTrack={onLoadTrack} onSetDragTrack={onSetDragTrack} />
      ))}
    </div>
  );
}

function ListTrackRow({ index, track, onLoadTrack, onSetDragTrack }: {
  index: number;
  track: Track;
  onLoadTrack?: (side: 'left' | 'right', track: Track) => void;
  onSetDragTrack?: (track: Track) => void;
}) {
  const [hov, setHov] = useState(false);
  const bars = useMemo(() => generateWaveform(track.id, BARS), [track.id]);
  const dur = Math.floor(track.dur);
  const m = Math.floor(dur / 60);
  const s = dur % 60;

  return (
    <div
      draggable={true}
      onDragStart={() => onSetDragTrack?.(track)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr 150px',
        alignItems: 'center',
        gap: 0,
        padding: '11px 14px',
        background: hov ? '#1c1c24' : '#111114',
        borderBottom: 'none',
        transition: 'background 0.08s',
        cursor: 'grab',
      }}
    >
      <span style={{ fontFamily: 'monospace', fontSize: '0.4rem', color: C.cyan, letterSpacing: '0.15em', fontWeight: 900 }}>
        {String(index).padStart(2, '0')}
      </span>

      {/* Track */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: 3, overflow: 'hidden', flexShrink: 0, border: 'none', boxShadow: 'inset 0 0 8px rgba(6,182,212,0.2)' }}>
          <img src={track.thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontFamily: 'monospace', fontSize: '0.52rem', fontWeight: 900,
            letterSpacing: '0.06em', color: C.text,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {track.title}
          </p>
          <p style={{
            fontFamily: 'monospace', fontSize: '0.34rem', letterSpacing: '0.12em',
            color: C.orange, marginTop: 2, fontWeight: 700,
          }}>
            {track.key}
          </p>
        </div>
      </div>

      {/* Waveform */}
      <div style={{ width: 140, height: 32, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${Math.max(3, h * 30)}px`,
              borderRadius: 1,
              background: `${C.cyan}D0`,
            }}
          />
        ))}
      </div>


    </div>
  );
}

/* ─── PLAYLIST CAROUSEL ───────────────────────────────────── */
function PlaylistCarousel({
  tracks,
  activeIdx,
  setActiveIdx,
  dragging,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  onLoadTrack,
  onSetDragTrack,
}: {
  tracks: Track[];
  activeIdx: number;
  setActiveIdx: (i: number) => void;
  dragging: boolean;
  handlePointerDown: (e: React.PointerEvent) => void;
  handlePointerMove: (e: React.PointerEvent) => void;
  handlePointerUp: () => void;
  onLoadTrack?: (side: 'left' | 'right', track: Track) => void;
  onSetDragTrack?: (track: Track) => void;
}) {
  const active = tracks[activeIdx];

  return (
    <div style={{
      marginTop: 20,
      padding: '20px 16px',
      position: 'relative',
    }}>
      {/* ── Simple grid carousel ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: 6,
          marginBottom: 20,
        }}
      >
        {tracks.map((track, i) => {
          const isActive = i === activeIdx;

          return (
            <div
              key={track.id}
              draggable={true}
              onDragStart={() => onSetDragTrack?.(track)}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => setActiveIdx(i)}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: 4,
                overflow: 'hidden',
                cursor: 'grab',
                border: 'none',
                transition: 'all 0.15s ease',
                opacity: isActive ? 1 : 0.7,
              }}
            >
              <img
                src={track.thumb}
                alt={track.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ── Now playing info ── */}
      {active && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            paddingTop: 16,
            borderTop: 'none',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: '0.44rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: C.cyan,
                margin: '0 0 4px 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              {active.title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
