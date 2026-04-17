'use client';
import { useState, useRef, useMemo, useEffect } from 'react';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

type Track = {
  id: string;
  title: string;
  bpm: number;
  key: string;
  dur: number;
  thumb: string;
};

type ViewMode = 'list' | 'playlist';

/* ─── Duration formatter ─────────────────────────────────── */
function fmtDur(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/* ─── Waveform generator (same seed logic as DJStation) ──── */
const WAVE_BARS = 48;
function generateWaveform(seed: string): number[] {
  let h = 0;
  for (const c of seed) h = (h << 5) - h + c.charCodeAt(0);
  const out: number[] = [];
  for (let i = 0; i < WAVE_BARS; i++) {
    h = ((h * 1103515245) + 12345) & 0x7fffffff;
    const env = Math.sin((i / WAVE_BARS) * Math.PI) * 0.45 + 0.55;
    out.push(0.06 + ((h % 100) / 100) * env * 0.94);
  }
  return out;
}

/* ─── Design tokens — 2-material system ─────────────────── */
const T = {
  // Material A: dark matte chassis
  chassis:  '#11161c',
  chassisHi:'#171c22',
  edge:     'rgba(255,255,255,0.03)',   // top surface catch-light
  border:   'rgba(255,255,255,0.05)',
  rowTop:   'rgba(255,255,255,0.03)',   // slot divider top
  rowBot:   'rgba(0,0,0,0.28)',         // slot divider bottom

  // Material B: cyan illuminated control
  cyanCore: '#79d8ff',
  cyanSoft: '#58b9df',
  cyanGlow: 'rgba(92,210,255,0.18)',
  cyanDim:  'rgba(92,210,255,0.07)',

  // Typography Layer 1 — instrument / status
  // Deck labels, mode names, key readouts, current view
  // weight 600, tracking 0.10em, cold white — "panel silkscreen"
  l1: '#e8f3ff',

  // Typography Layer 2 — structure / group labels
  // Column headers, browser tabs, section names
  // weight 500, tracking 0.10em, 25% weaker — "structural annotation"
  l2: '#93a4b5',

  // Typography Layer 3 — content readout
  l3t: '#dbe7f3',   // track title: weight 500, tracking 0.01em
  l3m: '#7f90a1',   // meta / time: weight 400, tracking 0.03em

  // Functional state colors
  green:  '#22c55e',
  orange: '#f97316',
  deckA:  '#79d8ff',   // cyan
  deckB:  '#89a8e0',   // cold blue-violet
};

export default function TrackLibraryBrowser({ tracks, onLoadTrack, onSetDragTrack,
  playingLeft, playingRight, leftPos, leftDur, rightPos, rightDur }: {
  tracks: Track[];
  onLoadTrack?: (side: 'left' | 'right', track: Track) => void;
  onSetDragTrack?: (track: Track) => void;
  playingLeft?: string | null;
  playingRight?: string | null;
  leftPos?: number;
  leftDur?: number;
  rightPos?: number;
  rightDur?: number;
}) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<ViewMode>('playlist');
  const [playlistIdx, setPlaylistIdx] = useState(0);
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? tracks.filter(t =>
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        String(t.bpm).includes(query) ||
        t.key.toLowerCase().includes(query.toLowerCase()))
    : tracks;

  return (
    <div style={{ marginTop: 20 }}>
      {/* ── Content ── */}
      {mode === 'list' ? (
        <ListView
          tracks={filtered} query={query} onQuery={setQuery}
          onLoadTrack={onLoadTrack}
          onSetDragTrack={onSetDragTrack}
          playingLeft={playingLeft} playingRight={playingRight}
          leftPos={leftPos} leftDur={leftDur}
          rightPos={rightPos} rightDur={rightDur}
          isMobile={isMobile}
        />
      ) : (
        <PlaylistCarousel
          tracks={tracks}
          activeIdx={playlistIdx}
          setActiveIdx={setPlaylistIdx}
          onLoadTrack={onLoadTrack}
          onSetDragTrack={onSetDragTrack}
          isMobile={isMobile}
        />
      )}

      {/* ── View switcher — chassis inset track ── */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 6 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          background: 'rgba(0,0,0,0.38)',
          border: `1px solid ${T.border}`,
          boxShadow: `inset 0 2px 4px rgba(0,0,0,0.5), 0 1px 0 ${T.edge}`,
          borderRadius: 10, padding: 3, gap: 2,
        }}>
          {([
            {
              m: 'playlist' as ViewMode,
              icon: (active: boolean) => {
                const ink = active ? T.cyanCore : T.l2;
                return (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="0" y="0" width="7" height="7" rx="1.5" fill={ink}/>
                    <rect x="9" y="0" width="7" height="7" rx="1.5" fill={ink}/>
                    <rect x="0" y="9" width="7" height="7" rx="1.5" fill={ink}/>
                    <rect x="9" y="9" width="7" height="7" rx="1.5" fill={ink}/>
                  </svg>
                );
              },
            },
            {
              m: 'list' as ViewMode,
              icon: (active: boolean) => {
                const ink    = active ? T.cyanCore : T.l2;
                const stroke = active ? `${T.cyanSoft}88` : `${T.l2}55`;
                const fill   = active ? T.cyanDim : 'rgba(255,255,255,0.04)';
                return (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="0" y="0.5" width="16" height="6" rx="1.5" fill={fill} stroke={stroke} strokeWidth="1.1"/>
                    <rect x="1.5" y="2"   width="3"  height="3"  rx="0.6" fill={ink}/>
                    <line x1="6.5" y1="3.5" x2="13.5" y2="3.5" stroke={ink} strokeWidth="1.3" strokeLinecap="round"/>
                    <rect x="0" y="9.5" width="16" height="6" rx="1.5" fill={fill} stroke={stroke} strokeWidth="1.1"/>
                    <rect x="1.5" y="11" width="3"  height="3"  rx="0.6" fill={ink}/>
                    <line x1="6.5" y1="12.5" x2="13.5" y2="12.5" stroke={ink} strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                );
              },
            },
          ] as const).map(({ m, icon }) => {
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  width: 46, height: 34,
                  borderRadius: 7, border: active ? `1px solid ${T.cyanGlow}` : '1px solid transparent',
                  cursor: 'pointer',
                  background: active ? T.cyanDim : 'transparent',
                  boxShadow: active
                    ? `inset 0 2px 5px rgba(0,0,0,0.4), 0 0 6px ${T.cyanGlow}`
                    : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.18s, box-shadow 0.18s, border-color 0.18s',
                }}
              >
                {icon(active)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── LIST VIEW ─────────────────────────────────────────── */
function ListView({
  tracks, query, onQuery, onLoadTrack, onSetDragTrack,
  playingLeft, playingRight, leftPos, leftDur, rightPos, rightDur, isMobile,
}: {
  tracks: Track[]; query: string; onQuery: (q: string) => void;
  onLoadTrack?: (side: 'left' | 'right', track: Track) => void;
  onSetDragTrack?: (track: Track) => void;
  playingLeft?: string | null; playingRight?: string | null;
  leftPos?: number; leftDur?: number;
  rightPos?: number; rightDur?: number;
  isMobile?: boolean;
}) {
  const [sortField, setSortField] = useState<'title' | 'bpm'>('title');
  const [sortDir,   setSortDir]   = useState<'asc' | 'desc'>('asc');

  function toggleSort(field: 'title' | 'bpm') {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  const sorted = [...tracks].sort((a, b) => {
    const av = sortField === 'title' ? a.title.toLowerCase() : a.bpm;
    const bv = sortField === 'title' ? b.title.toLowerCase() : b.bpm;
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  return (
    <div style={{ overflow: 'hidden', background: T.chassis }}>
      {/* ── Search + sort bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px 8px 12px',
        borderBottom: `1px solid ${T.border}`,
        background: T.chassisHi,
        boxShadow: `0 1px 0 ${T.edge}`,
      }}>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="5" cy="5" r="4" stroke={T.l2} strokeWidth="1.2"/>
          <line x1="8.5" y1="8.5" x2="11" y2="11" stroke={T.l2} strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <input
          value={query}
          onChange={e => onQuery(e.target.value)}
          placeholder="SEARCH TITLE · BPM · KEY"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'monospace', fontSize: '0.30rem',
            fontWeight: 500, letterSpacing: '0.10em',
            color: query ? T.l3t : T.l2,
          }}
        />
        {query && (
          <button onClick={() => onQuery('')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: T.l2, fontSize: '0.8rem', lineHeight: 1, padding: '0 2px',
          }}>×</button>
        )}
        <div style={{ width: 1, height: 10, background: T.border, flexShrink: 0 }} />
        {/* Sort toggles — layer 2 / layer 1 active */}
        {([{ f: 'title', l: 'A–Z' }, { f: 'bpm', l: 'BPM' }] as const).map(({ f, l }) => {
          const active = sortField === f;
          return (
            <button key={f} onClick={() => toggleSort(f)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
              fontFamily: 'monospace', fontSize: '0.28rem',
              fontWeight: active ? 600 : 500,
              letterSpacing: '0.12em',
              color: active ? T.cyanSoft : T.l2,
              display: 'flex', alignItems: 'center', gap: 3,
              transition: 'color 0.15s',
            }}>
              {l}
              {active && <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
            </button>
          );
        })}
      </div>

      {/* ── Column headers — layer 2 ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr 120px 54px 52px',
        padding: '5px 8px 5px 0',
        background: T.chassisHi,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <span style={{
          fontFamily: 'monospace', fontSize: '0.26rem',
          fontWeight: 500, letterSpacing: '0.12em',
          color: T.l2, paddingLeft: 14,
        }}>#</span>
        <span style={{
          fontFamily: 'monospace', fontSize: '0.26rem',
          fontWeight: 500, letterSpacing: '0.12em',
          color: T.l2, textTransform: 'uppercase',
        }}>TRACK</span>
        <span style={{
          fontFamily: 'monospace', fontSize: '0.26rem',
          fontWeight: 500, letterSpacing: '0.12em',
          color: T.l2, textTransform: 'uppercase',
        }}>INFO</span>
        <span style={{
          fontFamily: 'monospace', fontSize: '0.26rem',
          fontWeight: 500, letterSpacing: '0.12em',
          color: T.l2, textAlign: 'right', paddingRight: 8, textTransform: 'uppercase',
        }}>DUR</span>
        <span style={{
          fontFamily: 'monospace', fontSize: '0.26rem',
          fontWeight: 500, letterSpacing: '0.12em',
          color: T.l2, textTransform: 'uppercase', textAlign: 'center',
        }}>LOAD</span>
      </div>

      {/* ── Track rows ── */}
      {tracks.length === 0 && (
        <p style={{
          fontFamily: 'monospace', fontSize: '0.30rem',
          fontWeight: 400, letterSpacing: '0.15em',
          color: T.l2, padding: '14px 14px',
        }}>
          NO RESULTS
        </p>
      )}
      {sorted.map((track, i) => {
        const isLeft  = track.id === playingLeft;
        const isRight = track.id === playingRight;
        return (
          <ListTrackRow
            key={track.id} index={i + 1} track={track}
            isPlayingLeft={isLeft} isPlayingRight={isRight}
            pos={isLeft ? (leftPos ?? 0) : isRight ? (rightPos ?? 0) : 0}
            dur={isLeft ? (leftDur ?? 0) : isRight ? (rightDur ?? 0) : 0}
            onSetDragTrack={onSetDragTrack}
            onLoadTrack={onLoadTrack}
            isMobile={isMobile}
          />
        );
      })}
    </div>
  );
}

function ListTrackRow({ index, track, isPlayingLeft, isPlayingRight, pos, dur,
  onSetDragTrack, onLoadTrack, isMobile }: {
  index: number; track: Track;
  isPlayingLeft: boolean; isPlayingRight: boolean;
  pos: number; dur: number;
  onSetDragTrack?: (track: Track) => void;
  onLoadTrack?: (side: 'left' | 'right', track: Track) => void;
  isMobile?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const isPlaying = isPlayingLeft || isPlayingRight;
  const deckLabel = isPlayingLeft ? 'A' : isPlayingRight ? 'B' : null;
  const deckColor = isPlayingLeft ? T.deckA : T.deckB;
  const progress  = dur > 0 ? Math.min(1, pos / dur) : 0;
  const bars      = useMemo(() => generateWaveform(track.id), [track.id]);
  const beatMs    = 60000 / track.bpm;

  return (
    <div
      draggable={!isMobile}
      onDragStart={() => onSetDragTrack?.(track)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr 120px 54px 52px',
        alignItems: 'center',
        paddingRight: 8,
        minHeight: 52,
        background: isPlaying
          ? 'rgba(92,210,255,0.05)'
          : hov ? 'rgba(255,255,255,0.018)' : T.chassis,
        borderTop: `1px solid ${T.rowTop}`,
        boxShadow: `inset 0 -1px 0 ${T.rowBot}`,
        borderLeft: isPlaying ? `2px solid ${deckColor}` : `2px solid transparent`,
        cursor: 'grab',
        transition: 'background 0.12s, border-left-color 0.18s',
      }}
    >
      {/* Index / deck badge */}
      <span style={{
        fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 600,
        letterSpacing: '0.06em', color: isPlaying ? deckColor : T.l2,
        textAlign: 'center', transition: 'color 0.2s',
      }}>
        {deckLabel ?? String(index).padStart(2, '0')}
      </span>

      {/* Title + waveform stacked */}
      <div style={{ minWidth: 0, paddingRight: 12 }}>
        <span style={{
          display: 'block',
          fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 500,
          letterSpacing: '0.02em',
          color: isPlaying ? T.l1 : T.l3t,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 5,
          transition: 'color 0.2s',
        }}>
          {track.title}
        </span>
        {/* Waveform */}
        <svg width="100%" height="20" viewBox={`0 0 ${WAVE_BARS * 2.5} 20`}
          preserveAspectRatio="none" style={{ display: 'block' }}>
          {bars.map((h, i) => {
            const barH   = Math.max(1.5, h * 18);
            const x      = i * 2.5;
            const played = i / WAVE_BARS < progress;
            const color  = !isPlaying
              ? 'rgba(255,255,255,0.18)'
              : played
                ? (isPlayingLeft ? T.cyanCore : T.cyanSoft)
                : `${deckColor}44`;
            return (
              <rect
                key={i}
                x={x} y={(20 - barH) / 2} width={1.6} height={barH}
                fill={color} rx="0.5"
                style={isPlaying && played ? {
                  animation: `waveGlow ${beatMs}ms ease-in-out infinite`,
                  animationDelay: `${(i / WAVE_BARS) * beatMs * 0.5}ms`,
                } : undefined}
              />
            );
          })}
          {/* Playhead */}
          {isPlaying && dur > 0 && (
            <line
              x1={progress * WAVE_BARS * 2.5} y1={0}
              x2={progress * WAVE_BARS * 2.5} y2={20}
              stroke={deckColor} strokeWidth="1.5"
              style={{ filter: `drop-shadow(0 0 2px ${deckColor})` }}
            />
          )}
        </svg>
      </div>

      {/* BPM · KEY */}
      <span style={{
        fontFamily: 'monospace', fontSize: '0.70rem', fontWeight: 400,
        letterSpacing: '0.06em', color: isPlaying ? T.cyanSoft : T.l3m,
        whiteSpace: 'nowrap', paddingRight: 12,
        transition: 'color 0.2s',
      }}>
        {track.bpm} · {track.key}
      </span>

      {/* Duration */}
      <span style={{
        fontFamily: 'monospace', fontSize: '0.70rem', fontWeight: 400,
        letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums',
        color: isPlaying ? T.cyanSoft : T.l3m,
        textAlign: 'right', paddingRight: 8, transition: 'color 0.2s',
      }}>
        {fmtDur(track.dur)}
      </span>

      {/* Load A / B */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onLoadTrack?.('left', track); }}
          style={{
            width: 26, height: 26, borderRadius: 4, cursor: 'pointer',
            background: isPlayingLeft ? `${T.deckA}22` : 'transparent',
            border: `1px solid ${isPlayingLeft ? T.deckA : 'rgba(255,255,255,0.12)'}`,
            fontFamily: 'monospace', fontSize: '0.60rem', fontWeight: 700,
            color: isPlayingLeft ? T.deckA : T.l2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          } as React.CSSProperties}>A</button>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onLoadTrack?.('right', track); }}
          style={{
            width: 26, height: 26, borderRadius: 4, cursor: 'pointer',
            background: isPlayingRight ? `${T.deckB}22` : 'transparent',
            border: `1px solid ${isPlayingRight ? T.deckB : 'rgba(255,255,255,0.12)'}`,
            fontFamily: 'monospace', fontSize: '0.60rem', fontWeight: 700,
            color: isPlayingRight ? T.deckB : T.l2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          } as React.CSSProperties}>B</button>
      </div>
    </div>
  );
}

/* ─── PLAYLIST CAROUSEL ───────────────────────────────────── */
function PlaylistCarousel({
  tracks,
  activeIdx,
  setActiveIdx,
  onLoadTrack,
  onSetDragTrack,
  isMobile,
}: {
  tracks: Track[];
  activeIdx: number;
  setActiveIdx: (i: number) => void;
  onLoadTrack?: (side: 'left' | 'right', track: Track) => void;
  onSetDragTrack?: (track: Track) => void;
  isMobile?: boolean;
}) {
  const [ptrStart, setPtrStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const isDragging = dragOffset !== 0 || ptrStart !== null;
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = tracks[activeIdx];

  function onCardHover(i: number, rel: number) {
    if (isDragging || rel === 0) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setActiveIdx(i), 280);
  }
  function onCardLeave() {
    if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; }
  }

  function onPtrDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setPtrStart(e.clientX);
    setDragOffset(0);
  }
  function onPtrMove(e: React.PointerEvent<HTMLDivElement>) {
    if (ptrStart === null) return;
    setDragOffset(e.clientX - ptrStart);
  }
  function onPtrUp() {
    if (ptrStart === null) return;
    if (dragOffset < -55 && activeIdx < tracks.length - 1) setActiveIdx(activeIdx + 1);
    else if (dragOffset > 55 && activeIdx > 0) setActiveIdx(activeIdx - 1);
    setPtrStart(null);
    setDragOffset(0);
  }

  const CARD    = isMobile ? 108 : 154;
  const SPACING = isMobile ? 88  : 128;

  return (
    <div style={{ padding: '16px 0 8px' }}>
      {/* ── Coverflow stage ── */}
      <div style={{ position: 'relative', height: CARD + 24 }}>
        {/* Prev arrow */}
        <button
          onClick={() => activeIdx > 0 && setActiveIdx(activeIdx - 1)}
          style={{
            position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
            zIndex: 30, background: 'none', border: 'none', cursor: 'pointer',
            color: activeIdx > 0 ? T.l2 : T.border,
            fontSize: '1.4rem', lineHeight: 1, padding: '6px 10px',
            transition: 'color 0.2s',
          }}
        >‹</button>
        {/* Next arrow */}
        <button
          onClick={() => activeIdx < tracks.length - 1 && setActiveIdx(activeIdx + 1)}
          style={{
            position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
            zIndex: 30, background: 'none', border: 'none', cursor: 'pointer',
            color: activeIdx < tracks.length - 1 ? T.l2 : T.border,
            fontSize: '1.4rem', lineHeight: 1, padding: '6px 10px',
            transition: 'color 0.2s',
          }}
        >›</button>

        {/* Cards */}
        <div
          onPointerDown={onPtrDown}
          onPointerMove={onPtrMove}
          onPointerUp={onPtrUp}
          onPointerCancel={onPtrUp}
          style={{ position: 'absolute', inset: 0, cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none' }}
        >
          {tracks.map((track, i) => {
            const rel = i - activeIdx;
            const abs = Math.abs(rel);
            if (abs > 3) return null;

            const scale   = 1 - abs * 0.18;
            const opacity = 1 - abs * 0.3;
            const tx      = rel * SPACING + dragOffset * 0.55;
            const zIndex  = 20 - abs;

            return (
              <div
                key={track.id}
                draggable={!isMobile}
                onDragStart={e => { e.stopPropagation(); onSetDragTrack?.(track); }}
                onMouseEnter={() => onCardHover(i, rel)}
                onMouseLeave={onCardLeave}
                onClick={() => rel !== 0 && setActiveIdx(i)}
                style={{
                  position: 'absolute',
                  width: CARD, height: CARD,
                  top: '50%', left: '50%',
                  transform: `translateX(calc(-50% + ${tx}px)) translateY(-50%) scale(${scale})`,
                  transition: isDragging ? 'opacity 0.15s, box-shadow 0.3s' : 'all 0.42s cubic-bezier(0.4,0,0.2,1)',
                  zIndex, opacity,
                  cursor: rel === 0 ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
                }}
              >
                {/* Card face */}
                <div style={{
                  width: '100%', height: '100%',
                  borderRadius: 7,
                  overflow: 'hidden',
                  // Active: cyan illuminated control material — contained glow, not bloom
                  border: rel === 0
                    ? `1.5px solid ${T.cyanSoft}`
                    : `1px solid ${T.border}`,
                  boxShadow: rel === 0
                    ? `0 0 16px ${T.cyanGlow}, 0 10px 32px rgba(0,0,0,0.7)`
                    : '0 4px 18px rgba(0,0,0,0.5)',
                  position: 'relative',
                  transition: 'border-color 0.35s, box-shadow 0.35s',
                }}>
                  <img
                    src={track.thumb} alt={track.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    draggable={false}
                  />
                  {/* Caption + load buttons on active card */}
                  {rel === 0 && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      padding: '22px 6px 6px',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 100%)',
                    }}>
                      <p style={{
                        fontFamily: 'monospace',
                        fontSize: '0.30rem',
                        fontWeight: 600,
                        letterSpacing: '0.10em',
                        color: T.l1,
                        textTransform: 'uppercase',
                        textAlign: 'center',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        margin: '0 0 4px',
                      }}>{track.title}</p>
                      {/* Load A / B — tap-friendly on mobile */}
                      {onLoadTrack && (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button
                            onPointerDown={e => e.stopPropagation()}
                            onClick={e => { e.stopPropagation(); onLoadTrack('left', track); }}
                            style={{
                              flex: 1, height: 28, borderRadius: 4, cursor: 'pointer',
                              background: 'rgba(121,216,255,0.15)',
                              border: `1px solid ${T.cyanSoft}88`,
                              fontFamily: 'monospace', fontSize: '0.60rem', fontWeight: 700,
                              letterSpacing: '0.1em', color: T.cyanCore,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              touchAction: 'manipulation',
                              WebkitTapHighlightColor: 'transparent',
                            } as React.CSSProperties}>A</button>
                          <button
                            onPointerDown={e => e.stopPropagation()}
                            onClick={e => { e.stopPropagation(); onLoadTrack('right', track); }}
                            style={{
                              flex: 1, height: 28, borderRadius: 4, cursor: 'pointer',
                              background: 'rgba(137,168,224,0.15)',
                              border: `1px solid ${T.deckB}88`,
                              fontFamily: 'monospace', fontSize: '0.60rem', fontWeight: 700,
                              letterSpacing: '0.1em', color: T.deckB,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              touchAction: 'manipulation',
                              WebkitTapHighlightColor: 'transparent',
                            } as React.CSSProperties}>B</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Position indicators — chassis dots ── */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 14 }}>
        {tracks.map((_, i) => (
          <div
            key={i}
            onClick={() => setActiveIdx(i)}
            style={{
              width: i === activeIdx ? 20 : 5,
              height: 4,
              borderRadius: 2,
              // Active: cyan live control material. Idle: chassis border
              background: i === activeIdx ? T.cyanSoft : T.border,
              boxShadow: i === activeIdx ? `0 0 6px ${T.cyanGlow}` : 'none',
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      {/* ── Track readout below indicators — Layer 1 + Layer 3 meta ── */}
      {active && (
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'center',
          gap: '1em', marginTop: 10, marginBottom: 0,
        }}>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.36rem',
            fontWeight: 600,
            letterSpacing: '0.10em',
            color: T.l1,
            textTransform: 'uppercase',
          }}>
            {active.title}
          </span>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.28rem',
            fontWeight: 400,
            letterSpacing: '0.08em',
            color: T.l3m,
          }}>
            {active.bpm} BPM · {active.key} · {fmtDur(active.dur)}
          </span>
        </div>
      )}
    </div>
  );
}
