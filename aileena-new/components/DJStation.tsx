'use client';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

/* ─── Palette ────────────────────────────────────────────── */
const C = {
  bg:      '#111114',
  deck:    '#18181c',
  panel:   '#1e1e24',
  border:  'rgba(255,255,255,0.07)',
  muted:   'rgba(255,255,255,0.22)',
  dim:     'rgba(255,255,255,0.12)',
  green:   '#22c55e',   // ready / ok
  orange:  '#f97316',   // warning
  blue:    '#3b82f6',   // selected
  cyan:    '#06b6d4',   // playback
  text:    'rgba(255,255,255,0.88)',
  sub:     'rgba(255,255,255,0.38)',
};

/* ─── Track catalogue ────────────────────────────────────── */
const TRACKS = [
  { id: '4DBeUcBD2zVZzhf2oX1PLc', title: "I Can't Quit",   bpm: 124, key: '2A', dur: 195, thumb: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e028508f29ab91bfcce74f86ef5' },
  { id: '56NkIxSZZiMpFP5ZNSxtnT', title: 'Someday',        bpm: 120, key: '4A', dur: 212, thumb: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02a388a3f20d1bf2123249cc79' },
  { id: '3CYFxT3dBwOd9Ap0zKXHk7', title: 'GALA',           bpm: 128, key: '6B', dur: 178, thumb: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02c1456e351abb6d5b1a8ffbef' },
  { id: '2pIUpMhHL6L9Z5lnKxJJr9', title: 'Attention',      bpm: 122, key: '8A', dur: 200, thumb: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e029d28fd01859073a3ae6ea209' },
  { id: '1qbEfJ6F5Ryn1RYfJheZem', title: 'Late Night Job', bpm: 118, key: '3A', dur: 225, thumb: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e023108f7d165756b51d81ea3ba' },
  { id: '7b1uaIR2va05jHG5fnVbMu', title: 'Lab Rat 3',      bpm: 130, key: '5B', dur: 185, thumb: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02fad7ae8dfc681c2f9f8333ef' },
  { id: '2lFp0xJL7yGD7CtiQPqpwb', title: '700358bc5',      bpm: 126, key: '7A', dur: 210, thumb: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0214e8b7396634f604692c67ff' },
  { id: '3rw4HfYW3XJMSm11Z5Qn4c', title: 'Roses + Thorns', bpm: 116, key: '9B', dur: 198, thumb: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0225de4144381ec14d111c5380' },
];
type Track = typeof TRACKS[0];

/* ─── Waveform helper ────────────────────────────────────── */
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

/* ─── Spotify IFrame API types ───────────────────────────── */
interface SpotifyController {
  togglePlay(): void;
  loadUri(uri: string): void;
  addListener(event: string, cb: (e: { data: PlayUpdate }) => void): void;
}
interface PlayUpdate { isPaused: boolean; position: number; duration: number }
interface IFrameAPI {
  createController(el: HTMLElement, opts: { uri?: string; width: string; height: string }, cb: (c: SpotifyController) => void): void;
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/* ─── Main ───────────────────────────────────────────────── */
export default function DJStation() {
  const [leftTrack,    setLeftTrack]    = useState<Track | null>(TRACKS[0]);
  const [rightTrack,   setRightTrack]   = useState<Track | null>(TRACKS[3]);
  const [leftPlaying,  setLeftPlaying]  = useState(false);
  const [rightPlaying, setRightPlaying] = useState(false);
  const [leftPos,      setLeftPos]      = useState(0);
  const [rightPos,     setRightPos]     = useState(0);
  const [leftDur,      setLeftDur]      = useState(0);
  const [rightDur,     setRightDur]     = useState(0);
  const [leftPitch,    setLeftPitch]    = useState(0);
  const [rightPitch,   setRightPitch]   = useState(0);
  const [xfade,        setXfade]        = useState(50);
  const [dropSide,     setDropSide]     = useState<'left'|'right'|null>(null);
  const [query,        setQuery]        = useState('');

  const leftContainerRef  = useRef<HTMLDivElement>(null);
  const rightContainerRef = useRef<HTMLDivElement>(null);
  const leftCtrl          = useRef<SpotifyController | null>(null);
  const rightCtrl         = useRef<SpotifyController | null>(null);
  const dragTrack         = useRef<Track | null>(null);
  const prevXfade         = useRef(50);

  /* ── Spotify API ── */
  useEffect(() => {
    const win = window as any;
    const initControllers = (api: IFrameAPI) => {
      if (leftContainerRef.current && !leftCtrl.current) {
        api.createController(leftContainerRef.current,
          { uri: `spotify:track:${TRACKS[0].id}`, width: '100%', height: '80' },
          ctrl => {
            leftCtrl.current = ctrl;
            ctrl.addListener('playback_update', e => {
              setLeftPlaying(!e.data.isPaused);
              if (e.data.duration > 0) {
                setLeftPos(e.data.position);
                setLeftDur(e.data.duration);
              }
            });
          });
      }
      if (rightContainerRef.current && !rightCtrl.current) {
        api.createController(rightContainerRef.current,
          { uri: `spotify:track:${TRACKS[3].id}`, width: '100%', height: '80' },
          ctrl => {
            rightCtrl.current = ctrl;
            ctrl.addListener('playback_update', e => {
              setRightPlaying(!e.data.isPaused);
              if (e.data.duration > 0) {
                setRightPos(e.data.position);
                setRightDur(e.data.duration);
              }
            });
          });
      }
    };

    if (win.SpotifyIframeApi) { initControllers(win.SpotifyIframeApi); return; }
    const prev = win.onSpotifyIframeApiReady;
    win.onSpotifyIframeApiReady = (api: IFrameAPI) => {
      win.SpotifyIframeApi = api;
      initControllers(api);
      prev?.(api);
    };
    if (!document.querySelector('script[src*="spotify-iframe-api"]')) {
      const s = document.createElement('script');
      s.src = 'https://open.spotify.com/embed/iframe-api/v1';
      s.async = true;
      document.head.appendChild(s);
    }
  }, []);

  const loadTrack = useCallback((side: 'left'|'right', track: Track) => {
    if (side === 'left') { setLeftTrack(track); setLeftPos(0); setLeftDur(0); leftCtrl.current?.loadUri(`spotify:track:${track.id}`); }
    else                 { setRightTrack(track); setRightPos(0); setRightDur(0); rightCtrl.current?.loadUri(`spotify:track:${track.id}`); }
  }, []);

  const handleXfade = useCallback((v: number) => {
    const prev = prevXfade.current;
    setXfade(v); prevXfade.current = v;
    if (v <= 8  && prev > 8  && rightPlaying) rightCtrl.current?.togglePlay();
    if (v >= 92 && prev < 92 && leftPlaying)  leftCtrl.current?.togglePlay();
  }, [leftPlaying, rightPlaying]);

  /* BPM sync suggestion */
  const bpmHint = useMemo(() => {
    if (!leftTrack || !rightTrack) return null;
    const diff = rightTrack.bpm * (1 + rightPitch / 100) - leftTrack.bpm * (1 + leftPitch / 100);
    if (Math.abs(diff) < 0.5) return { type: 'sync' as const, diff };
    return { type: 'hint' as const, diff };
  }, [leftTrack, rightTrack, leftPitch, rightPitch]);

  /* Filtered crate */
  const filteredTracks = useMemo(() =>
    TRACKS.filter(t =>
      !query || t.title.toLowerCase().includes(query.toLowerCase()) ||
      String(t.bpm).includes(query) || t.key.toLowerCase().includes(query.toLowerCase())
    ), [query]);

  const leftDim  = xfade > 80 ? (100 - xfade) / 20 : 1;
  const rightDim = xfade < 20 ? xfade / 20 : 1;

  return (
    <div style={{ userSelect: 'none', width: '100%', background: C.bg }}>

      {/* ── Spotify embed containers (functional audio) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
        {(['left','right'] as const).map(side => {
          const track = side === 'left' ? leftTrack : rightTrack;
          const ref   = side === 'left' ? leftContainerRef : rightContainerRef;
          return (
            <div key={side} style={{
              borderRadius: 6, overflow: 'hidden', background: '#0a0a0c',
              border: `1px solid ${C.border}`, position: 'relative',
            }}>
              <div ref={ref} style={{ minHeight: 80 }} />
              {!track && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', background: '#0a0a0c',
                }}>
                  <p style={{ fontSize: '0.34rem', letterSpacing: '0.4em', color: C.dim, textTransform: 'uppercase' }}>
                    {side === 'left' ? 'DECK A' : 'DECK B'} — EMPTY
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Main console ── */}
      <div style={{
        borderRadius: 10, padding: '10px 10px 8px',
        background: C.panel,
        border: `1px solid ${C.border}`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
        {/* system bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${C.border}`, paddingBottom: 6, marginBottom: 8,
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.34rem', letterSpacing: '0.5em', color: C.dim, textTransform: 'uppercase' }}>
            AILEENA DJ
          </span>
          {bpmHint && (
            <span style={{
              fontFamily: 'monospace', fontSize: '0.34rem', letterSpacing: '0.3em',
              color: bpmHint.type === 'sync' ? C.green : C.orange,
              textTransform: 'uppercase',
              border: `1px solid ${bpmHint.type === 'sync' ? C.green : C.orange}40`,
              padding: '2px 6px', borderRadius: 3,
            }}>
              {bpmHint.type === 'sync' ? '⟺ SYNC' : `${bpmHint.diff > 0 ? '+' : ''}${bpmHint.diff.toFixed(1)} BPM`}
            </span>
          )}
          <span style={{ fontFamily: 'monospace', fontSize: '0.34rem', letterSpacing: '0.4em', color: C.dim }}>
            {leftTrack?.bpm ?? '--'} / {rightTrack?.bpm ?? '--'} BPM
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 1fr', gap: 8 }}>
          <DeckPanel
            side="left" track={leftTrack} playing={leftPlaying}
            pos={leftPos} dur={leftDur || (leftTrack?.dur ?? 0) * 1000}
            pitch={leftPitch} dim={leftDim} dropActive={dropSide === 'left'}
            onDragOver={e => { e.preventDefault(); setDropSide('left'); }}
            onDragLeave={() => setDropSide(null)}
            onDrop={e => { e.preventDefault(); if (dragTrack.current) loadTrack('left', dragTrack.current); setDropSide(null); }}
            onToggle={() => leftCtrl.current?.togglePlay()}
            onPitch={setLeftPitch}
          />

          <MixerPanel xfade={xfade} onXfade={handleXfade} />

          <DeckPanel
            side="right" track={rightTrack} playing={rightPlaying}
            pos={rightPos} dur={rightDur || (rightTrack?.dur ?? 0) * 1000}
            pitch={rightPitch} dim={rightDim} dropActive={dropSide === 'right'}
            onDragOver={e => { e.preventDefault(); setDropSide('right'); }}
            onDragLeave={() => setDropSide(null)}
            onDrop={e => { e.preventDefault(); if (dragTrack.current) loadTrack('right', dragTrack.current); setDropSide(null); }}
            onToggle={() => rightCtrl.current?.togglePlay()}
            onPitch={setRightPitch}
          />
        </div>
      </div>

      {/* ── Crate / Track Strip ── */}
      <CrateStrip
        tracks={filteredTracks}
        query={query}
        onQuery={setQuery}
        loadedLeft={leftTrack}
        loadedRight={rightTrack}
        onDragStart={t => { dragTrack.current = t; }}
        onDragEnd={() => { dragTrack.current = null; }}
        onLoad={loadTrack}
      />
    </div>
  );
}

/* ─── Deck Panel ─────────────────────────────────────────── */
function DeckPanel({ side, track, playing, pos, dur, pitch, dim, dropActive,
  onDragOver, onDragLeave, onDrop, onToggle, onPitch }: {
  side: 'left'|'right'; track: Track|null; playing: boolean;
  pos: number; dur: number; pitch: number; dim: number; dropActive: boolean;
  onDragOver(e: React.DragEvent): void; onDragLeave(): void; onDrop(e: React.DragEvent): void;
  onToggle(): void; onPitch(v: number): void;
}) {
  const D    = 172;   // disc diameter px
  const R    = D / 2;
  const r    = R - 7; // ring radius
  const circ = 2 * Math.PI * r;
  const prog = dur > 0 ? Math.min(1, pos / dur) : 0;
  const offset = circ * (1 - prog);
  const remaining = dur > 0 ? fmt(Math.max(0, dur - pos)) : (track ? `-${fmt((track.dur) * 1000)}` : '--:--');
  const elapsed   = dur > 0 ? fmt(pos) : '0:00';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5,
      opacity: 0.4 + 0.6 * dim, transition: 'opacity 0.4s ease' }}>

      {/* Platter drop zone */}
      <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} style={{
        position: 'relative', height: D + 16, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: C.deck,
        border: dropActive ? `1px solid ${C.cyan}` : `1px solid ${C.border}`,
        boxShadow: dropActive ? `inset 0 0 20px ${C.cyan}15` : 'inset 0 2px 12px rgba(0,0,0,0.6)',
        transition: 'border 0.15s, box-shadow 0.15s',
      }}>
        {!track ? (
          <p style={{ fontSize: '0.34rem', letterSpacing: '0.5em', textTransform: 'uppercase',
            color: dropActive ? C.cyan : C.dim }}>
            {dropActive ? '↓ DROP' : 'drag record'}
          </p>
        ) : (
          <div style={{ position: 'relative', width: D, height: D }}>
            {/* Disc body */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'radial-gradient(circle at 50% 50%, #2a2a30 0%, #1a1a1e 55%, #111114 100%)',
              border: `1px solid rgba(255,255,255,0.1)`,
              animation: playing ? 'turntableSpin 2.4s linear infinite' : 'none',
              overflow: 'hidden',
            }}>
              {/* Groove rings */}
              {[22,33,44,55,66,77].map(r => (
                <div key={r} style={{ position: 'absolute', borderRadius: '50%', inset: `${r}%`,
                  border: '1px solid rgba(255,255,255,0.045)' }} />
              ))}
              {/* Album art */}
              <div style={{ position: 'absolute', inset: '18%', borderRadius: '50%', overflow: 'hidden',
                border: `1.5px solid rgba(255,255,255,0.15)`,
                boxShadow: playing ? `0 0 16px ${C.cyan}50` : 'none',
                transition: 'box-shadow 0.8s ease',
              }}>
                <img src={track.thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {/* Spindle */}
              <div style={{
                position: 'absolute', width: 9, height: 9,
                top: 'calc(50% - 4.5px)', left: 'calc(50% - 4.5px)',
                borderRadius: '50%', zIndex: 5,
                background: '#e8e8e8',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.7)',
              }} />
            </div>

            {/* Progress ring (SVG — does NOT rotate) */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              viewBox={`0 0 ${D} ${D}`}>
              {/* Track ring */}
              <circle cx={R} cy={R} r={r} fill="none"
                stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
              {/* Progress fill */}
              <circle cx={R} cy={R} r={r} fill="none"
                stroke={C.cyan} strokeWidth="5"
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: `${R}px ${R}px`,
                  transition: 'stroke-dashoffset 0.3s linear',
                  filter: `drop-shadow(0 0 4px ${C.cyan}80)`,
                }} />
            </svg>

            {/* Tonearm */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
              viewBox={`0 0 ${D} ${D}`}>
              <defs>
                <filter id={`dsh-${side}`}><feDropShadow dx="0" dy="1.5" stdDeviation="2" floodOpacity="0.9"/></filter>
              </defs>
              {/* Arm */}
              <line
                x1={side === 'right' ? D * 0.1 : D * 0.9}
                y1={D * 0.09}
                x2={playing ? D * 0.5 : (side === 'right' ? D * 0.25 : D * 0.75)}
                y2={playing ? D * 0.48 : D * 0.30}
                stroke="#5a5a64" strokeWidth="4" strokeLinecap="round"
                filter={`url(#dsh-${side})`}
                style={{ transition: 'all 1.5s cubic-bezier(0.4,0,0.2,1)' }}
              />
              <line
                x1={side === 'right' ? D * 0.1 : D * 0.9}
                y1={D * 0.09}
                x2={playing ? D * 0.5 : (side === 'right' ? D * 0.25 : D * 0.75)}
                y2={playing ? D * 0.48 : D * 0.30}
                stroke="rgba(255,255,255,0.13)" strokeWidth="1.2" strokeLinecap="round"
                style={{ transition: 'all 1.5s cubic-bezier(0.4,0,0.2,1)' }}
              />
              {/* Pivot */}
              <circle cx={side === 'right' ? D * 0.1 : D * 0.9} cy={D * 0.09} r={10}
                fill="#28282e" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
              <circle cx={side === 'right' ? D * 0.1 : D * 0.9} cy={D * 0.09} r={4}
                fill={playing ? C.cyan : `${C.cyan}55`}
                style={{ filter: playing ? `drop-shadow(0 0 4px ${C.cyan})` : 'none', transition: 'all 0.5s' }}/>
              {/* Headshell */}
              <rect
                x={(playing ? D * 0.5 : (side === 'right' ? D * 0.25 : D * 0.75)) - 8}
                y={(playing ? D * 0.48 : D * 0.30) - 5}
                width="16" height="10" rx="2.5"
                fill="#2e2e36" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8"
                style={{ transition: 'all 1.5s cubic-bezier(0.4,0,0.2,1)' }}
              />
              {/* Stylus */}
              <line
                x1={playing ? D * 0.5 : (side === 'right' ? D * 0.25 : D * 0.75)}
                y1={(playing ? D * 0.48 : D * 0.30) + 5}
                x2={(playing ? D * 0.5 : (side === 'right' ? D * 0.25 : D * 0.75)) - 1}
                y2={(playing ? D * 0.48 : D * 0.30) + 14}
                stroke="rgba(190,195,215,0.7)" strokeWidth="1.2"
                style={{ transition: 'all 1.5s cubic-bezier(0.4,0,0.2,1)' }}
              />
            </svg>
          </div>
        )}
      </div>

      {/* Info row */}
      <div style={{
        borderRadius: 5, padding: '5px 8px',
        background: C.deck, border: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', gap: 3,
      }}>
        <p style={{ fontSize: '0.44rem', letterSpacing: '0.12em',
          color: playing ? C.cyan : C.text,
          fontFamily: 'monospace', textTransform: 'uppercase',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          transition: 'color 0.5s',
        }}>{track?.title ?? 'NO TRACK'}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.34rem', color: C.cyan, letterSpacing: '0.1em' }}>
            {elapsed}
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.34rem', color: C.sub, letterSpacing: '0.1em' }}>
            {remaining}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        borderRadius: 6, padding: '7px 7px',
        background: C.deck, border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Play/Pause */}
          <button onClick={onToggle} style={{
            width: 38, height: 38, borderRadius: '50%', cursor: 'pointer',
            background: playing ? `${C.green}20` : '#252530',
            border: playing ? `1px solid ${C.green}60` : `1px solid ${C.border}`,
            boxShadow: playing ? `0 0 12px ${C.green}40` : 'inset 0 2px 5px rgba(0,0,0,0.5)',
            color: playing ? C.green : C.sub,
            fontSize: '0.8rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}>{playing ? '⏸' : '▶'}</button>
          {/* CUE */}
          <button style={{
            width: 38, height: 38, borderRadius: '50%', cursor: 'pointer',
            background: '#252530', border: `1px solid ${C.border}`,
            color: C.dim, fontSize: '0.34rem', letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>CUE</button>
        </div>
        <PitchFader pitch={pitch} onChange={onPitch} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <VU active={playing} />
          <MKnob size={22} />
          <span style={{ fontFamily: 'monospace', fontSize: '0.28rem', letterSpacing: '0.3em', color: C.dim }}>GAIN</span>
          {/* Pitch readout */}
          <span style={{
            fontFamily: 'monospace', fontSize: '0.36rem', letterSpacing: '0.1em',
            color: Math.abs(pitch) > 0.5 ? C.orange : C.sub,
            transition: 'color 0.3s',
          }}>
            {pitch >= 0 ? '+' : ''}{pitch.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Mixer Panel ────────────────────────────────────────── */
function MixerPanel({ xfade, onXfade }: { xfade: number; onXfade(v: number): void }) {
  return (
    <div style={{
      borderRadius: 6, padding: '8px 6px',
      background: C.deck, border: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    }}>
      {/* BPM */}
      <div style={{ width: '100%', textAlign: 'center', borderRadius: 4, padding: '3px 0',
        background: '#080a0c', border: `1px solid rgba(0,220,80,0.15)` }}>
        <p style={{ fontFamily: 'monospace', fontSize: '0.28rem', color: 'rgba(0,200,80,0.4)', letterSpacing: '0.3em' }}>BPM</p>
        <p style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: C.green, lineHeight: 1.1,
          textShadow: `0 0 10px ${C.green}90` }}>128</p>
      </div>

      {/* EQ */}
      <p style={{ fontFamily: 'monospace', fontSize: '0.28rem', letterSpacing: '0.4em', color: C.dim }}>EQ</p>
      {['HI','MID','LO'].map(l => (
        <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <MKnob size={24} />
          <span style={{ fontFamily: 'monospace', fontSize: '0.26rem', letterSpacing: '0.35em', color: C.dim }}>{l}</span>
        </div>
      ))}

      {/* Crossfader */}
      <div style={{ width: '100%' }}>
        <p style={{ fontFamily: 'monospace', fontSize: '0.26rem', letterSpacing: '0.35em', color: C.dim,
          textAlign: 'center', marginBottom: 4 }}>XFADE</p>
        <div style={{
          position: 'relative', height: 18, borderRadius: 3,
          background: `linear-gradient(to right, ${C.cyan}25, rgba(20,20,24,0.9) 50%, ${C.orange}20)`,
          border: `1px solid ${C.border}`,
          boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.7)',
        }}>
          <input type="range" min={0} max={100} value={xfade} onChange={e => onXfade(+e.target.value)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0 }} />
          {/* Fader cap */}
          <div style={{
            position: 'absolute', width: 16, height: 28, left: `calc(${xfade}% - 8px)`,
            borderRadius: 3, pointerEvents: 'none', top: -5,
            background: 'linear-gradient(to bottom, #ddd, #aaa 40%, #888)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.8)',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
          }}>
            {[0,1,2].map(i => <div key={i} style={{ width: '55%', height: 1,
              background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.2)' }} />)}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.24rem', color: `${C.cyan}80` }}>A</span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.24rem', color: `${C.orange}80` }}>B</span>
        </div>
      </div>

      <p style={{ fontFamily: 'monospace', fontSize: '0.26rem', letterSpacing: '0.3em', color: C.dim }}>MASTER</p>
      <MKnob size={28} lit />
    </div>
  );
}

/* ─── Crate / Track Strip ────────────────────────────────── */
function CrateStrip({ tracks, query, onQuery, loadedLeft, loadedRight, onDragStart, onDragEnd, onLoad }: {
  tracks: Track[];
  query: string;
  onQuery(q: string): void;
  loadedLeft: Track | null;
  loadedRight: Track | null;
  onDragStart(t: Track): void;
  onDragEnd(): void;
  onLoad(side: 'left'|'right', t: Track): void;
}) {
  return (
    <div style={{ marginTop: 10 }}>
      {/* Crate header + search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '6px 10px', borderRadius: '6px 6px 0 0',
        background: C.panel, border: `1px solid ${C.border}`, borderBottom: 'none',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.32rem', letterSpacing: '0.45em', color: C.dim, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          CRATE
        </span>
        <input
          value={query} onChange={e => onQuery(e.target.value)}
          placeholder="search title · bpm · key"
          style={{
            flex: 1, background: 'transparent',
            border: 'none', outline: 'none',
            fontFamily: 'monospace', fontSize: '0.36rem', letterSpacing: '0.2em',
            color: C.text,
          }}
        />
        <span style={{ fontFamily: 'monospace', fontSize: '0.28rem', letterSpacing: '0.3em', color: C.dim }}>
          {tracks.length} tracks
        </span>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr 110px 52px 38px 52px 60px',
        gap: 0, padding: '4px 10px',
        background: '#0f0f12', border: `1px solid ${C.border}`, borderTop: 'none', borderBottom: 'none',
      }}>
        {['#','TITLE','WAVEFORM','BPM','KEY','DUR','DECK'].map(h => (
          <span key={h} style={{ fontFamily: 'monospace', fontSize: '0.26rem', letterSpacing: '0.35em',
            color: C.dim, textTransform: 'uppercase' }}>{h}</span>
        ))}
      </div>

      {/* Track rows */}
      <div style={{ border: `1px solid ${C.border}`, borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
        {tracks.map((track, i) => (
          <TrackRow
            key={track.id}
            index={i + 1}
            track={track}
            isLeft={loadedLeft?.id === track.id}
            isRight={loadedRight?.id === track.id}
            onDragStart={() => onDragStart(track)}
            onDragEnd={onDragEnd}
            onLoadLeft={() => onLoad('left', track)}
            onLoadRight={() => onLoad('right', track)}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Track Row ──────────────────────────────────────────── */
const BARS = 52;
function TrackRow({ index, track, isLeft, isRight, onDragStart, onDragEnd, onLoadLeft, onLoadRight }: {
  index: number; track: Track; isLeft: boolean; isRight: boolean;
  onDragStart(): void; onDragEnd(): void;
  onLoadLeft(): void; onLoadRight(): void;
}) {
  const [hov, setHov] = useState(false);
  const bars = useMemo(() => generateWaveform(track.id, BARS), [track.id]);
  const active = isLeft || isRight;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr 110px 52px 38px 52px 60px',
        alignItems: 'center', gap: 0,
        padding: '5px 10px',
        background: hov ? '#1c1c24' : active ? '#16161e' : '#111114',
        borderBottom: `1px solid ${C.border}`,
        cursor: 'grab',
        transition: 'background 0.15s',
      }}
    >
      {/* Index */}
      <span style={{ fontFamily: 'monospace', fontSize: '0.3rem', color: C.dim, letterSpacing: '0.2em' }}>
        {String(index).padStart(2, '0')}
      </span>

      {/* Title + thumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: 3, overflow: 'hidden', flexShrink: 0,
          border: active ? `1px solid ${isLeft ? C.cyan : C.blue}` : `1px solid ${C.border}` }}>
          <img src={track.thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontFamily: 'monospace', fontSize: '0.38rem', letterSpacing: '0.1em',
            color: active ? (isLeft ? C.cyan : C.blue) : C.text,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            transition: 'color 0.3s',
          }}>{track.title}</p>
        </div>
      </div>

      {/* Waveform */}
      <svg width="110" height="26" style={{ display: 'block' }}>
        {bars.map((h, i) => {
          const barH = Math.max(2, h * 24);
          const x = (i / BARS) * 110;
          const barW = (110 / BARS) * 0.7;
          return (
            <rect key={i}
              x={x} y={(26 - barH) / 2} width={barW} height={barH}
              fill={active ? `${isLeft ? C.cyan : C.blue}CC` : 'rgba(255,255,255,0.2)'}
              rx="0.5"
            />
          );
        })}
      </svg>

      {/* BPM */}
      <span style={{ fontFamily: 'monospace', fontSize: '0.42rem', letterSpacing: '0.05em',
        color: C.text, textAlign: 'center' as const }}>
        {track.bpm}
      </span>

      {/* Key */}
      <span style={{ fontFamily: 'monospace', fontSize: '0.38rem', letterSpacing: '0.05em',
        color: C.sub, textAlign: 'center' as const }}>
        {track.key}
      </span>

      {/* Duration */}
      <span style={{ fontFamily: 'monospace', fontSize: '0.38rem', letterSpacing: '0.05em',
        color: C.sub }}>
        {fmt(track.dur * 1000)}
      </span>

      {/* Load A / B buttons */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={e => { e.stopPropagation(); onLoadLeft(); }} style={{
          padding: '2px 5px', borderRadius: 3, border: `1px solid ${C.cyan}50`,
          background: isLeft ? `${C.cyan}25` : 'transparent',
          color: isLeft ? C.cyan : C.sub,
          fontFamily: 'monospace', fontSize: '0.28rem', cursor: 'pointer',
          letterSpacing: '0.1em',
        }}>A</button>
        <button onClick={e => { e.stopPropagation(); onLoadRight(); }} style={{
          padding: '2px 5px', borderRadius: 3, border: `1px solid ${C.blue}50`,
          background: isRight ? `${C.blue}25` : 'transparent',
          color: isRight ? C.blue : C.sub,
          fontFamily: 'monospace', fontSize: '0.28rem', cursor: 'pointer',
          letterSpacing: '0.1em',
        }}>B</button>
      </div>
    </div>
  );
}

/* ─── Atoms ──────────────────────────────────────────────── */
function MKnob({ size = 28, lit }: { size?: number; lit?: boolean }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, cursor: 'pointer' }}>
      {lit && <div style={{ position: 'absolute', inset: -4, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.cyan}20 0%, transparent 70%)`, filter: 'blur(4px)' }} />}
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        background: 'radial-gradient(circle at 33% 28%, #484850 0%, #282830 45%, #141418 100%)',
        boxShadow: `0 ${size * .1}px ${size * .25}px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)`,
        border: `1px solid ${C.border}`, position: 'relative',
      }}>
        <div style={{
          position: 'absolute', width: Math.max(2, size * .09), height: Math.max(3, size * .24),
          borderRadius: 2, top: size * .08, left: '50%', transform: 'translateX(-50%)',
          background: lit ? C.cyan : 'rgba(255,255,255,0.38)',
          boxShadow: lit ? `0 0 6px ${C.cyan}` : 'none',
        }} />
      </div>
    </div>
  );
}

function PitchFader({ pitch, onChange }: { pitch: number; onChange(v: number): void }) {
  const pct = 50 - (pitch / 8) * 44;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 }}>
      <p style={{ fontFamily: 'monospace', fontSize: '0.26rem', letterSpacing: '0.4em', color: C.dim }}>PITCH</p>
      <div style={{ position: 'relative', width: 14, height: 78 }}>
        <div style={{ position: 'absolute', left: 5, width: 4, height: '100%', borderRadius: 3,
          background: '#070708', border: `1px solid ${C.border}`,
          boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.8)' }} />
        <div style={{ position: 'absolute', left: 2, width: 10, top: '50%', height: 1,
          background: `${C.cyan}40` }} />
        <input type="range" min={-8} max={8} step={0.1} value={pitch} onChange={e => onChange(+e.target.value)}
          style={{ writingMode: 'vertical-lr', direction: 'rtl', position: 'absolute',
            height: '100%', width: 30, left: -8, opacity: 0, cursor: 'pointer', margin: 0 }} />
        <div style={{
          position: 'absolute', width: 26, height: 11, top: `calc(${pct}% - 5.5px)`, left: -6,
          borderRadius: 2, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, #ccc, #999 40%, #777)',
          boxShadow: '0 2px 7px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.6)',
          border: '1px solid rgba(255,255,255,0.25)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
        }}>
          {[0,1].map(i => <div key={i} style={{ width: '55%', height: 1,
            background: 'rgba(0,0,0,0.18)', borderBottom: '1px solid rgba(255,255,255,0.2)' }} />)}
        </div>
      </div>
    </div>
  );
}

function VU({ active }: { active: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 22 }}>
      {[0.35, 0.65, 1, 0.75, 0.45].map((h, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 1,
          height: active ? h * 22 : 2,
          background: i < 2 ? C.green : i === 2 ? '#a3e635' : i === 3 ? C.orange : '#ef4444',
          boxShadow: active && i >= 3 ? `0 0 4px ${i === 4 ? '#ef4444' : C.orange}` : 'none',
          transition: `height ${0.08 + i * 0.05}s ease`,
        }} />
      ))}
    </div>
  );
}
