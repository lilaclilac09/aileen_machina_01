'use client';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import TrackLibraryBrowser from './TrackLibraryBrowser';

/* ─── Palette ────────────────────────────────────────────── */
const C = {
  // backgrounds
  bg:          '#0b0d10',
  deck:        '#12161b',
  panel:       '#12161b',
  // text
  text:        '#edf2f7',
  sub:         '#94a0ad',
  dim:         '#94a0ad',
  muted:       'rgba(237,242,247,0.22)',
  // functional
  green:       '#22c55e',
  orange:      '#ff9b5e',   // desaturated — small accents only
  blue:        '#7db7ff',   // ice blue
  cyan:        '#63f3d8',   // cooler cyan-green
  cyanGlow:    'rgba(99,243,216,0.28)',
  // silver/brushed metal
  silver:      '#b9c0c7',
  silverDark:  '#8e979f',
  silverLight: '#d9e0e6',
  silverBorder:'#aab3bb',
  border:      'rgba(170,179,187,0.18)',
};

/* ─── Track catalogue ────────────────────────────────────── */
const TRACKS = [
  { id: '7Gi8h4mk92A5akMQBGnDXj', title: 'Berlin',         bpm: 125, key: '6A', dur: 200, thumb: '/berlin.jpg' },
  { id: '4DBeUcBD2zVZzhf2oX1PLc', title: "I Can't Quit",   bpm: 124, key: '2A', dur: 195, thumb: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e028508f29ab91bfcce74f86ef5' },
  { id: '56NkIxSZZiMpFP5ZNSxtnT', title: 'Someday',        bpm: 120, key: '4A', dur: 212, thumb: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02a388a3f20d1bf2123249cc79' },
  { id: '3CYFxT3dBwOd9Ap0zKXHk7', title: 'GALA',           bpm: 128, key: '6B', dur: 178, thumb: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02c1456e351abb6d5b1a8ffbef' },
  { id: '2pIUpMhHL6L9Z5lnKxJJr9', title: 'Attention',      bpm: 122, key: '8A', dur: 200, thumb: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e029d28fd01859073a3ae6ea209' },
  { id: '1qbEfJ6F5Ryn1RYfJheZem', title: 'Late Night Job', bpm: 118, key: '3A', dur: 225, thumb: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e023108f7d165756b51d81ea3ba' },
  { id: '7b1uaIR2va05jHG5fnVbMu', title: 'Lab Rat 3',      bpm: 130, key: '5B', dur: 185, thumb: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02fad7ae8dfc681c2f9f8333ef' },
  { id: '2lFp0xJL7yGD7CtiQPqpwb', title: '700358bc5',      bpm: 126, key: '7A', dur: 210, thumb: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0214e8b7396634f604692c67ff' },
  { id: '3rw4HfYW3XJMSm11Z5Qn4c', title: 'Roses + Thorns', bpm: 116, key: '9B', dur: 198, thumb: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0225de4144381ec14d111c5380' },
  { id: '7i1qsbXNf6C8Zdo3COMzJY', title: 'WISE',           bpm: 129, key: '5A', dur: 204, thumb: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/b3/73/e9/b373e9b8-9ead-e9a7-0825-f8d8a30dabd6/3617221727448_cover.png/600x600bb.jpg' },
  { id: '62PSNt68BxMaxl9U50PIdW', title: 'Crush On You',   bpm: 120, key: '4B', dur: 180, thumb: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02f3d67ea5769af25963f86120' },
  { id: '3WwFjc24162Ab0WEN57y8t', title: 'Recall',         bpm: 122, key: '6A', dur: 195, thumb: '/recall.jpg' },
  { id: '0DO0NtFn6hB4Brt44Z8Tkz', title: '扉をあけて',     bpm: 118, key: '3B', dur: 240, thumb: '/tobira.jpg' },
  { id: '6Yj8kVuVR3UPxx9r5eFEoV', title: 'Miniskirt',      bpm: 128, key: '7B', dur: 210, thumb: '/miniskirt.jpg' },
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

/* ─── Responsive hook ────────────────────────────────────── */
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

/* ─── Main ───────────────────────────────────────────────── */
export default function DJStation() {
  const isMobile = useIsMobile();
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

  const leftContainerRef  = useRef<HTMLDivElement>(null);
  const rightContainerRef = useRef<HTMLDivElement>(null);
  const leftCtrl          = useRef<SpotifyController | null>(null);
  const rightCtrl         = useRef<SpotifyController | null>(null);
  const dragTrack         = useRef<Track | null>(null);
  const prevXfade         = useRef(50);
  const leftWasPlaying    = useRef(false);
  const rightWasPlaying   = useRef(false);

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

  const leftDim  = xfade > 80 ? (100 - xfade) / 20 : 1;
  const rightDim = xfade < 20 ? xfade / 20 : 1;

  /* ── SYNC: adjust pitch so deck BPMs match ── */
  const handleSyncLeft = useCallback(() => {
    if (!leftTrack || !rightTrack) return;
    const targetBpm = rightTrack.bpm * (1 + rightPitch / 100);
    const newPitch = (targetBpm / leftTrack.bpm - 1) * 100;
    setLeftPitch(Math.max(-8, Math.min(8, +newPitch.toFixed(1))));
  }, [leftTrack, rightTrack, rightPitch]);

  const handleSyncRight = useCallback(() => {
    if (!leftTrack || !rightTrack) return;
    const targetBpm = leftTrack.bpm * (1 + leftPitch / 100);
    const newPitch = (targetBpm / rightTrack.bpm - 1) * 100;
    setRightPitch(Math.max(-8, Math.min(8, +newPitch.toFixed(1))));
  }, [leftTrack, rightTrack, leftPitch]);

  return (
    <div style={{ userSelect: 'none', width: '100%', background: '#0b0d10' }}>

      {/* ── Spotify embed containers (functional audio) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 6, marginBottom: 8 }}>
        {(['left','right'] as const).map(side => {
          const track = side === 'left' ? leftTrack : rightTrack;
          const ref   = side === 'left' ? leftContainerRef : rightContainerRef;
          return (
            <div key={side} style={{
              borderRadius: 6, overflow: 'hidden', background: C.bg,
              border: '1px solid rgba(170,179,187,0.12)', position: 'relative',
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

      {/* ── Main console (deck + mixer layout) ── */}
      <div style={{
        borderRadius: 10, padding: '10px 10px 8px',
        background: C.panel,
        border: '1px solid rgba(170,179,187,0.1)',
        boxShadow: 'inset 0 1px 0 rgba(217,224,230,0.04)',
      }}>
        {/* system bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: 'none', paddingBottom: 6, marginBottom: 8,
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.34rem', letterSpacing: '0.5em', color: C.dim, textTransform: 'uppercase' }}>
            AILEENA DJ
          </span>
          {bpmHint && (
            <span style={{
              fontFamily: 'monospace', fontSize: '0.34rem', letterSpacing: '0.3em',
              color: bpmHint.type === 'sync' ? C.green : C.orange,
              textTransform: 'uppercase',
              border: `1px solid ${bpmHint.type === 'sync' ? C.green : C.orange}00`,
              padding: '2px 6px', borderRadius: 3,
            }}>
              {bpmHint.type === 'sync' ? '⟺ SYNC' : `${bpmHint.diff > 0 ? '+' : ''}${bpmHint.diff.toFixed(1)} BPM`}
            </span>
          )}
          <span style={{ fontFamily: 'monospace', fontSize: '0.34rem', letterSpacing: '0.4em', color: C.dim }}>
            {leftTrack?.bpm ?? '--'} / {rightTrack?.bpm ?? '--'} BPM
          </span>
        </div>

        {/* Deck + Mixer grid */}
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            <DeckPanel
              side="left" track={leftTrack} playing={leftPlaying} isMobile={true} synced={bpmHint?.type === 'sync'}
              pos={leftPos} dur={leftDur || (leftTrack?.dur ?? 0) * 1000}
              pitch={leftPitch} dim={leftDim} dropActive={dropSide === 'left'}
              onDragOver={e => { e.preventDefault(); setDropSide('left'); }}
              onDragLeave={() => setDropSide(null)}
              onDrop={e => { e.preventDefault(); if (dragTrack.current) loadTrack('left', dragTrack.current); setDropSide(null); }}
              onToggle={() => leftCtrl.current?.togglePlay()}
              onPitch={setLeftPitch}
              onScratchStart={() => { leftWasPlaying.current = leftPlaying; if (leftPlaying) leftCtrl.current?.togglePlay(); }}
              onScratchEnd={() => { if (leftWasPlaying.current) leftCtrl.current?.togglePlay(); }}
              onSync={handleSyncLeft}
            />
            <MixerPanel xfade={xfade} onXfade={handleXfade} isMobile={true} />
            <DeckPanel
              side="right" track={rightTrack} playing={rightPlaying} isMobile={true} synced={bpmHint?.type === 'sync'}
              pos={rightPos} dur={rightDur || (rightTrack?.dur ?? 0) * 1000}
              pitch={rightPitch} dim={rightDim} dropActive={dropSide === 'right'}
              onDragOver={e => { e.preventDefault(); setDropSide('right'); }}
              onDragLeave={() => setDropSide(null)}
              onDrop={e => { e.preventDefault(); if (dragTrack.current) loadTrack('right', dragTrack.current); setDropSide(null); }}
              onToggle={() => rightCtrl.current?.togglePlay()}
              onPitch={setRightPitch}
              onScratchStart={() => { rightWasPlaying.current = rightPlaying; if (rightPlaying) rightCtrl.current?.togglePlay(); }}
              onScratchEnd={() => { if (rightWasPlaying.current) rightCtrl.current?.togglePlay(); }}
              onSync={handleSyncRight}
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', gap: 8, marginBottom: 10 }}>
            <DeckPanel
              side="left" track={leftTrack} playing={leftPlaying} synced={bpmHint?.type === 'sync'}
              pos={leftPos} dur={leftDur || (leftTrack?.dur ?? 0) * 1000}
              pitch={leftPitch} dim={leftDim} dropActive={dropSide === 'left'}
              onDragOver={e => { e.preventDefault(); setDropSide('left'); }}
              onDragLeave={() => setDropSide(null)}
              onDrop={e => { e.preventDefault(); if (dragTrack.current) loadTrack('left', dragTrack.current); setDropSide(null); }}
              onToggle={() => leftCtrl.current?.togglePlay()}
              onPitch={setLeftPitch}
              onScratchStart={() => { leftWasPlaying.current = leftPlaying; if (leftPlaying) leftCtrl.current?.togglePlay(); }}
              onScratchEnd={() => { if (leftWasPlaying.current) leftCtrl.current?.togglePlay(); }}
              onSync={handleSyncLeft}
            />
            <MixerPanel xfade={xfade} onXfade={handleXfade} />
            <DeckPanel
              side="right" track={rightTrack} playing={rightPlaying} synced={bpmHint?.type === 'sync'}
              pos={rightPos} dur={rightDur || (rightTrack?.dur ?? 0) * 1000}
              pitch={rightPitch} dim={rightDim} dropActive={dropSide === 'right'}
              onDragOver={e => { e.preventDefault(); setDropSide('right'); }}
              onDragLeave={() => setDropSide(null)}
              onDrop={e => { e.preventDefault(); if (dragTrack.current) loadTrack('right', dragTrack.current); setDropSide(null); }}
              onToggle={() => rightCtrl.current?.togglePlay()}
              onPitch={setRightPitch}
              onScratchStart={() => { rightWasPlaying.current = rightPlaying; if (rightPlaying) rightCtrl.current?.togglePlay(); }}
              onScratchEnd={() => { if (rightWasPlaying.current) rightCtrl.current?.togglePlay(); }}
              onSync={handleSyncRight}
            />
          </div>
        )}
      </div>

      {/* ── Track Library Browser (Film Strip Carousel) ── */}
      <div style={{
        marginTop: 10,
      }}>
        <TrackLibraryBrowser
          tracks={TRACKS}
          onLoadTrack={loadTrack}
          onSetDragTrack={(t) => { dragTrack.current = t; }}
          playingLeft={leftPlaying ? (leftTrack?.id ?? null) : null}
          playingRight={rightPlaying ? (rightTrack?.id ?? null) : null}
          leftPos={leftPos} leftDur={leftDur}
          rightPos={rightPos} rightDur={rightDur}
        />
      </div>
    </div>
  );
}

/* ─── Deck Panel ─────────────────────────────────────────── */
function DeckPanel({ side, track, playing, pos, dur, pitch, dim, dropActive, isMobile, synced,
  onDragOver, onDragLeave, onDrop, onToggle, onPitch, onScratchStart, onScratchEnd, onSync }: {
  side: 'left'|'right'; track: Track|null; playing: boolean;
  pos: number; dur: number; pitch: number; dim: number; dropActive: boolean;
  isMobile?: boolean; synced?: boolean;
  onDragOver(e: React.DragEvent): void; onDragLeave(): void; onDrop(e: React.DragEvent): void;
  onToggle(): void; onPitch(v: number): void;
  onScratchStart(): void; onScratchEnd(): void;
  onSync: () => void;
}) {
  const D    = isMobile ? 130 : 172;
  const R    = D / 2;
  const r    = R - 7;
  const circ = 2 * Math.PI * r;
  const prog   = dur > 0 ? Math.min(1, pos / dur) : 0;
  const offset = circ * (1 - prog);
  const remaining = dur > 0 ? fmt(Math.max(0, dur - pos)) : (track ? `-${fmt((track.dur) * 1000)}` : '--:--');
  const elapsed   = dur > 0 ? fmt(pos) : '0:00';

  // CUE state
  const [cueMs, setCueMs] = useState<number | null>(null);

  // Scratch state
  const [scratchAngle, setScratchAngle] = useState(0);
  const [isScratching, setIsScratching] = useState(false);
  const lastPtrAngle = useRef(0);
  const discRef = useRef<HTMLDivElement>(null);

  function getPtrAngle(e: React.PointerEvent): number {
    const el = discRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.atan2(e.clientY - (rect.top + rect.height / 2),
                      e.clientX - (rect.left + rect.width  / 2)) * (180 / Math.PI);
  }
  function onDiscDown(e: React.PointerEvent) {
    if (!track) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    lastPtrAngle.current = getPtrAngle(e);
    setIsScratching(true);
    onScratchStart();
  }
  function onDiscMove(e: React.PointerEvent) {
    if (!isScratching) return;
    const cur = getPtrAngle(e);
    let delta = cur - lastPtrAngle.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    lastPtrAngle.current = cur;
    setScratchAngle(prev => prev + delta);
  }
  function onDiscUp() {
    if (!isScratching) return;
    setIsScratching(false);
    onScratchEnd();
  }

  // Tonearm: two fixed positions only — parked vs on outer groove
  // Left deck pivot: top-right. Right deck pivot: top-left.
  const pivotX = side === 'right' ? D * 0.10 : D * 0.90;
  const pivotY = D * 0.09;
  const tipX   = playing
    ? (side === 'right' ? D * 0.34 : D * 0.66)   // on outer groove, fixed
    : (side === 'right' ? D * 0.14 : D * 0.86);   // parked near pivot
  const tipY   = playing ? D * 0.26 : D * 0.0;

  return (
    <div style={{
      display: 'flex', flexDirection: isMobile ? 'row' : 'column',
      gap: isMobile ? 10 : 5, alignItems: isMobile ? 'flex-start' : 'stretch',
      opacity: 0.4 + 0.6 * dim, transition: 'opacity 0.4s ease',
    }}>

      {/* Platter drop zone */}
      <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} style={{
        position: 'relative', height: D + 16, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: C.bg,
        border: dropActive ? `1px solid rgba(99,243,216,0.5)` : `1px solid rgba(170,179,187,0.12)`,
        boxShadow: dropActive ? `inset 0 0 30px rgba(99,243,216,0.08)` : 'none',
        transition: 'border 0.15s, box-shadow 0.15s',
      }}>
        {!track ? (
          <p style={{ fontSize: '0.34rem', letterSpacing: '0.5em', textTransform: 'uppercase',
            color: dropActive ? 'rgba(100,220,210,0.8)' : C.dim }}>
            {dropActive ? '↓ DROP' : 'drag record'}
          </p>
        ) : (
          <div style={{ position: 'relative', width: D, height: D }}>

            {/* Disc body — AT-style glowing translucent platter */}
            <div
              ref={discRef}
              onPointerDown={onDiscDown}
              onPointerMove={onDiscMove}
              onPointerUp={onDiscUp}
              onPointerLeave={onDiscUp}
              style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: `radial-gradient(circle at 50% 50%,
                #020c0a 0%,
                #051612 10%,
                #092820 20%,
                #134840 30%,
                #227a68 40%,
                #38b8a4 49%,
                #5ccec0 57%,
                #84e0d4 65%,
                #a6ece2 72%,
                #bef2e9 78%,
                #c8f4ed 83%,
                #b8f0e6 88%,
                #94e4d8 93%,
                #6cd0c2 97%,
                #52c4b6 100%
              )`,
              boxShadow: playing
                ? '0 0 55px rgba(99,243,216,0.45), 0 0 110px rgba(99,243,216,0.18), inset 0 0 35px rgba(0,0,0,0.45)'
                : '0 0 22px rgba(99,243,216,0.18), 0 0 50px rgba(99,243,216,0.06), inset 0 0 20px rgba(0,0,0,0.35)',
              animation: isScratching ? 'none' : (playing ? 'turntableSpin 2.4s linear infinite' : 'none'),
              transform: isScratching ? `rotate(${scratchAngle}deg)` : undefined,
              transition: 'box-shadow 1.8s ease',
              cursor: track ? (isScratching ? 'grabbing' : 'grab') : 'default',
            }}>
              {/* Concentric depth bands — subtle tone variation like frosted acrylic */}
              {[18, 30, 42].map((pct, i) => (
                <div key={pct} style={{
                  position: 'absolute', borderRadius: '50%', inset: `${pct}%`,
                  border: `1px solid rgba(255,255,255,${0.06 + i * 0.03})`,
                }} />
              ))}
              {/* Center void — deep dark portal */}
              <div style={{
                position: 'absolute', borderRadius: '50%', inset: '36%',
                background: 'radial-gradient(circle, #010808 0%, #040f0c 45%, #081c16 80%, #102820 100%)',
                boxShadow: 'inset 0 0 18px rgba(0,0,0,0.98), 0 0 8px rgba(0,0,0,0.6)',
              }}>
                {/* Spindle pin */}
                <div style={{
                  position: 'absolute', width: 6, height: 6,
                  top: 'calc(50% - 3px)', left: 'calc(50% - 3px)',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #2a2a26 0%, #181814 100%)',
                  boxShadow: '0 0 3px rgba(0,0,0,0.9)',
                }} />
              </div>
            </div>

            {/* Progress ring (SVG — does NOT rotate) */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              viewBox={`0 0 ${D} ${D}`}>
              {/* Track ring — silver metal channel */}
              <circle cx={R} cy={R} r={r} fill="none"
                stroke="rgba(142,151,159,0.25)" strokeWidth="4" />
              {/* Progress fill — brushed silver */}
              <circle cx={R} cy={R} r={r} fill="none"
                stroke="#b9c0c7" strokeWidth="4"
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: `${R}px ${R}px`,
                  transition: 'stroke-dashoffset 0.3s linear',
                  filter: 'drop-shadow(0 0 2px rgba(185,192,199,0.5))',
                }} />
            </svg>

            {/* Tonearm — Audio-Technica carbon fibre style */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
              viewBox={`0 0 ${D} ${D}`}>
              <defs>
                <filter id={`arm-shadow-${side}`}>
                  <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor="#000" floodOpacity="1"/>
                </filter>
                <linearGradient id={`arm-shine-${side}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.18)"/>
                  <stop offset="50%" stopColor="rgba(255,255,255,0.04)"/>
                  <stop offset="100%" stopColor="rgba(0,0,0,0.2)"/>
                </linearGradient>
              </defs>

              {/* Arm body — brushed silver aluminum tube */}
              <line
                x1={pivotX} y1={pivotY}
                x2={tipX} y2={tipY}
                stroke="#2c3038" strokeWidth="6" strokeLinecap="round"
                filter={`url(#arm-shadow-${side})`}
                style={{ transition: playing ? 'x2 0.8s linear, y2 0.8s linear' : 'all 0.35s ease' }}
              />
              {/* Arm shine — silver highlight along the tube */}
              <line
                x1={pivotX} y1={D * 0.09}
                x2={tipX} y2={tipY}
                stroke="rgba(185,192,199,0.35)" strokeWidth="1.8" strokeLinecap="round"
                style={{ transition: playing ? 'x2 0.8s linear, y2 0.8s linear' : 'all 0.35s ease' }}
              />

              {/* Pivot — machined bearing housing (silver) */}
              <circle cx={pivotX} cy={pivotY} r={13}
                fill="#1a1e24" stroke="rgba(170,179,187,0.28)" strokeWidth="1.4"/>
              <circle cx={pivotX} cy={pivotY} r={8}
                fill="#222830" stroke="rgba(185,192,199,0.18)" strokeWidth="1"/>
              <circle cx={pivotX} cy={pivotY} r={3.5}
                fill={playing ? '#63f3d8' : '#394048'}
                style={{ filter: playing ? 'drop-shadow(0 0 4px rgba(99,243,216,0.9))' : 'none', transition: 'all 0.6s ease' }}/>

              {/* Headshell body — silver aluminum */}
              <rect
                x={tipX - 10} y={tipY - 5}
                width="20" height="11" rx="2"
                fill="#262c34" stroke="rgba(170,179,187,0.32)" strokeWidth="0.9"
                style={{ transition: playing ? 'x 0.8s linear, y 0.8s linear' : 'all 0.35s ease' }}
              />
              {/* Cartridge body — dark anodised */}
              <rect
                x={tipX - 6} y={tipY + 6}
                width="13" height="8" rx="1.5"
                fill="#1c2028" stroke="rgba(170,179,187,0.22)" strokeWidth="0.7"
                style={{ transition: playing ? 'x 0.8s linear, y 0.8s linear' : 'all 0.35s ease' }}
              />
              {/* Stylus cantilever */}
              <line
                x1={tipX - 1} y1={tipY + 14}
                x2={tipX - 2} y2={tipY + 21}
                stroke="rgba(185,192,199,0.75)" strokeWidth="1"
                style={{ transition: playing ? 'x1 0.8s linear, y1 0.8s linear, x2 0.8s linear, y2 0.8s linear' : 'all 0.35s ease' }}
              />
              {/* Stylus tip */}
              <circle
                cx={tipX - 2} cy={tipY + 21} r="1.2"
                fill={playing ? '#63f3d8' : 'rgba(170,179,187,0.5)'}
                style={{ filter: playing ? 'drop-shadow(0 0 2px rgba(99,243,216,0.8))' : 'none', transition: 'all 0.6s' }}
              />
            </svg>
          </div>
        )}
      </div>

      {/* Info + Controls wrapper — takes remaining space on mobile */}
      <div style={{ flex: isMobile ? 1 : undefined, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>

      {/* Info row */}
      <div style={{
        borderRadius: 5, padding: '5px 8px',
        background: C.deck,
        border: '1px solid rgba(170,179,187,0.1)',
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
        background: C.deck,
        border: '1px solid rgba(170,179,187,0.08)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Play/Pause */}
          <button onClick={onToggle} aria-label={playing ? 'Pause' : 'Play'} style={{
            width: 38, height: 38, borderRadius: '50%', cursor: 'pointer',
            background: playing ? `rgba(99,243,216,0.1)` : '#14181e',
            border: `1px solid ${playing ? 'rgba(99,243,216,0.6)' : 'rgba(170,179,187,0.22)'}`,
            boxShadow: playing ? `0 0 10px rgba(99,243,216,0.28)` : 'inset 0 2px 5px rgba(0,0,0,0.4)',
            color: playing ? C.cyan : C.silver,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}>
            {playing ? (
              <svg width="11" height="12" viewBox="0 0 11 12" fill="none" aria-hidden="true">
                <rect x="1"  y="0" width="3" height="12" fill="currentColor" />
                <rect x="7"  y="0" width="3" height="12" fill="currentColor" />
              </svg>
            ) : (
              <svg width="11" height="12" viewBox="0 0 11 12" fill="none" aria-hidden="true">
                <path d="M1 0.5 L10 6 L1 11.5 Z" fill="currentColor" />
              </svg>
            )}
          </button>
          {/* CUE */}
          <button onClick={() => setCueMs(pos > 0 ? pos : null)} style={{
            width: 38, height: 38, borderRadius: '50%', cursor: 'pointer',
            background: cueMs !== null ? 'rgba(125,183,255,0.1)' : '#14181e',
            border: `1px solid ${cueMs !== null ? 'rgba(125,183,255,0.55)' : 'rgba(170,179,187,0.22)'}`,
            boxShadow: cueMs !== null ? '0 0 8px rgba(125,183,255,0.25)' : 'inset 0 2px 5px rgba(0,0,0,0.4)',
            color: cueMs !== null ? C.blue : C.silverDark, fontSize: '0.28rem', letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1,
            transition: 'all 0.15s',
          }}>
            <span style={{ fontFamily: 'monospace' }}>CUE</span>
            {cueMs !== null && <span style={{ fontFamily: 'monospace', fontSize: '0.22rem', opacity: 0.7 }}>{fmt(cueMs)}</span>}
          </button>
        </div>
        <PitchFader pitch={pitch} onChange={onPitch} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <VU active={playing} />
          <MKnob size={22} />
          <span style={{ fontFamily: 'monospace', fontSize: '0.28rem', letterSpacing: '0.3em', color: C.sub }}>GAIN</span>
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

      {/* ── Pioneer section: Sync + Loop + Hot Cues ── */}
      <PioneerControls side={side} playing={playing} synced={!!synced} pos={pos} onSync={onSync} />

      </div>{/* end info+controls wrapper */}
    </div>
  );
}

/* ─── Pioneer Controls ───────────────────────────────────── */
const HOT_CUE_COLORS = ['#3b82f6','#f97316','#a3e635','#a855f7','#22d3ee','#ef4444','#10b981','#f472b6'];

function PioneerControls({ side, playing, synced, pos, onSync }: {
  side: 'left'|'right'; playing: boolean; synced: boolean;
  pos: number; onSync: () => void;
}) {
  const [loopActive, setLoopActive]   = useState(false);
  const [loopIn,     setLoopIn]       = useState<number | null>(null);
  const [loopOut,    setLoopOut]      = useState<number | null>(null);
  const [loopSize,   setLoopSize]     = useState(2);
  // hot cue: index → stored position ms (first press = set, second press = clear)
  const [cuePositions, setCuePositions] = useState<{[i: number]: number}>({});

  const loopSizes = [1/4, 1/2, 1, 2, 4, 8];

  function handleCuePad(i: number) {
    if (cuePositions[i] !== undefined) {
      // Second press: clear the cue point
      setCuePositions(prev => { const n = {...prev}; delete n[i]; return n; });
    } else {
      // First press: record current playback position
      setCuePositions(prev => ({...prev, [i]: pos}));
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>

      {/* ── Row 1: SYNC + LOOP controls ── */}
      <div style={{
        background: C.bg, borderRadius: 6, padding: '6px 8px',
        border: '1px solid rgba(170,179,187,0.1)',
        display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap',
      }}>
        {/* SYNC */}
        <button onClick={onSync} style={{
          padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
          background: synced ? 'rgba(99,243,216,0.1)' : '#14181e',
          border: `1px solid ${synced ? 'rgba(99,243,216,0.5)' : 'rgba(170,179,187,0.22)'}`,
          boxShadow: synced ? '0 0 8px rgba(99,243,216,0.25)' : 'inset 0 2px 4px rgba(0,0,0,0.5)',
          fontFamily: 'monospace', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.12em',
          color: synced ? C.cyan : C.silverDark,
          transition: 'all 0.2s', minWidth: 52,
        }}>
          SYNC
          {synced && <span style={{ display: 'block', fontSize: '0.3rem', letterSpacing: '0.2em', opacity: 0.7, fontFamily: 'monospace' }}>LOCKED</span>}
        </button>

        {/* LOOP IN */}
        <button onClick={() => { setLoopIn(pos); setLoopActive(false); }} style={{
          padding: '4px 8px', borderRadius: 4, cursor: 'pointer',
          background: loopIn !== null ? 'rgba(125,183,255,0.08)' : '#14181e',
          border: `1px solid ${loopIn !== null ? 'rgba(125,183,255,0.45)' : 'rgba(170,179,187,0.22)'}`,
          boxShadow: loopIn !== null ? '0 0 6px rgba(125,183,255,0.2)' : 'inset 0 2px 4px rgba(0,0,0,0.5)',
          fontFamily: 'monospace', fontSize: '0.44rem', fontWeight: 600, letterSpacing: '0.08em',
          color: loopIn !== null ? C.blue : C.silverDark,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
          transition: 'all 0.15s',
        }}>
          <span>⌐ IN</span>
          {loopIn !== null && <span style={{ fontFamily: 'monospace', fontSize: '0.22rem', opacity: 0.7 }}>{fmt(loopIn)}</span>}
        </button>

        {/* LOOP OUT */}
        <button onClick={() => { if (loopIn !== null) { setLoopOut(pos); setLoopActive(true); } }} style={{
          padding: '4px 8px', borderRadius: 4, cursor: 'pointer',
          background: loopActive ? 'rgba(255,155,94,0.08)' : '#14181e',
          border: `1px solid ${loopActive ? 'rgba(255,155,94,0.45)' : 'rgba(170,179,187,0.22)'}`,
          boxShadow: loopActive ? '0 0 6px rgba(255,155,94,0.2)' : 'inset 0 2px 4px rgba(0,0,0,0.5)',
          fontFamily: 'monospace', fontSize: '0.44rem', fontWeight: 600, letterSpacing: '0.08em',
          color: loopActive ? C.orange : loopIn !== null ? C.silver : C.silverDark,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
          transition: 'all 0.15s', opacity: loopIn === null ? 0.4 : 1,
        }}>
          <span>¬ OUT</span>
          {loopOut !== null && loopActive && <span style={{ fontFamily: 'monospace', fontSize: '0.22rem', opacity: 0.7 }}>{fmt(loopOut)}</span>}
        </button>

        {/* Loop size selector */}
        <div style={{ display: 'flex', gap: 2 }}>
          {loopSizes.map(s => (
            <button key={s} onClick={() => setLoopSize(s)} style={{
              width: 26, height: 22, borderRadius: 3, cursor: 'pointer',
              background: loopSize === s ? (loopActive ? 'rgba(255,155,94,0.12)' : 'rgba(125,183,255,0.1)') : '#14181e',
              border: `1px solid ${loopSize === s ? (loopActive ? 'rgba(255,155,94,0.4)' : 'rgba(125,183,255,0.4)') : 'rgba(170,179,187,0.15)'}`,
              fontFamily: 'monospace', fontSize: '0.34rem', fontWeight: 600,
              color: loopSize === s ? (loopActive ? C.orange : C.blue) : C.silverDark,
              transition: 'all 0.1s',
            }}>
              {s < 1 ? `1/${1/s}` : s}
            </button>
          ))}
        </div>

        {/* EXIT LOOP */}
        {loopActive && (
          <button onClick={() => { setLoopActive(false); setLoopIn(null); setLoopOut(null); }} style={{
            padding: '4px 7px', borderRadius: 4, cursor: 'pointer',
            background: 'rgba(255,155,94,0.08)',
            border: '1px solid rgba(255,155,94,0.4)',
            fontFamily: 'monospace', fontSize: '0.40rem', fontWeight: 600,
            letterSpacing: '0.08em', color: C.orange,
          }}>EXIT</button>
        )}
      </div>

      {/* ── Row 2: Hot Cue Pads (8 pads, 4×2) ── */}
      <div style={{
        background: C.bg, borderRadius: 6, padding: '7px 8px',
        border: '1px solid rgba(170,179,187,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.38rem', letterSpacing: '0.35em', color: 'rgba(255,255,255,0.2)' }}>
            HOT CUE
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.32rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.12)' }}>
            {side === 'left' ? 'DECK A' : 'DECK B'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
          {HOT_CUE_COLORS.map((color, i) => {
            const hasPos = cuePositions[i] !== undefined;
            return (
              <button
                key={i}
                onPointerDown={() => handleCuePad(i)}
                title={hasPos ? `Press to clear cue ${String.fromCharCode(65+i)} (${fmt(cuePositions[i])})` : `Press to set cue ${String.fromCharCode(65+i)} at ${fmt(pos)}`}
                style={{
                  height: hasPos ? 38 : 32, borderRadius: 4, cursor: 'pointer',
                  background: hasPos ? `${color}18` : '#14181e',
                  border: `1px solid ${hasPos ? `${color}80` : 'rgba(170,179,187,0.18)'}`,
                  boxShadow: hasPos
                    ? `0 0 8px ${color}40`
                    : 'inset 0 2px 4px rgba(0,0,0,0.5)',
                  position: 'relative',
                  transition: 'all 0.08s',
                  transform: 'scale(1)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                  paddingTop: 6,
                }}
              >
                {/* LED dot */}
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: hasPos ? color : 'rgba(255,255,255,0.08)',
                  boxShadow: hasPos ? `0 0 6px ${color}` : 'none',
                  transition: 'all 0.1s', flexShrink: 0,
                }} />
                {/* Letter label */}
                <span style={{
                  fontFamily: 'monospace', fontSize: '0.28rem', fontWeight: 700,
                  color: hasPos ? color : 'rgba(255,255,255,0.15)',
                  letterSpacing: '0.05em',
                }}>
                  {String.fromCharCode(65 + i)}
                </span>
                {/* Time label when cue is set */}
                {hasPos && (
                  <span style={{
                    fontFamily: 'monospace', fontSize: '0.22rem',
                    color: color, opacity: 0.8,
                    letterSpacing: '0.02em',
                  }}>
                    {fmt(cuePositions[i])}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}

/* ─── Mixer Panel ────────────────────────────────────────── */
function MixerPanel({ xfade, onXfade, isMobile }: { xfade: number; onXfade(v: number): void; isMobile?: boolean }) {
  const [eqVals, setEqVals] = useState({ hi: 50, mid: 50, lo: 50 });
  const [filterA, setFilterA] = useState(50);
  const [filterB, setFilterB] = useState(50);
  const [fxOn, setFxOn] = useState(false);
  const [fxType, setFxType] = useState<'ECHO'|'REVERB'|'FLANGER'>('ECHO');

  return (
    <div style={{
      borderRadius: 6, padding: isMobile ? '8px 14px' : '8px 7px',
      background: 'linear-gradient(to bottom, #1a1e24, #14181d 55%, #1a1e24)',
      border: '1px solid rgba(170,179,187,0.22)',
      display: 'flex', flexDirection: isMobile ? 'row' : 'column',
      alignItems: 'center', gap: isMobile ? 16 : 8,
      flexWrap: isMobile ? 'wrap' : undefined,
      boxShadow: 'inset 0 1px 0 rgba(217,224,230,0.07), inset 0 -1px 0 rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.3)',
    }}>

      {/* ── Beat FX ── */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {(['ECHO','REVERB','FLANGER'] as const).map(fx => (
            <button key={fx} onClick={() => { setFxType(fx); setFxOn(true); }} style={{
              flex: 1, padding: '3px 0', borderRadius: 3, cursor: 'pointer',
              background: fxOn && fxType === fx ? 'rgba(255,155,94,0.1)' : '#14181e',
              border: `1px solid ${fxOn && fxType === fx ? 'rgba(255,155,94,0.45)' : 'rgba(170,179,187,0.18)'}`,
              fontFamily: 'monospace', fontSize: '0.30rem', fontWeight: 600, letterSpacing: '0.08em',
              color: fxOn && fxType === fx ? C.orange : C.silverDark,
              transition: 'all 0.12s',
            }}>{fx}</button>
          ))}
          <button onClick={() => setFxOn(false)} style={{
            padding: '3px 6px', borderRadius: 3, cursor: 'pointer',
            background: !fxOn ? 'rgba(255,155,94,0.08)' : '#14181e',
            border: `1px solid ${!fxOn ? 'rgba(255,155,94,0.35)' : 'rgba(170,179,187,0.18)'}`,
            fontFamily: 'monospace', fontSize: '0.28rem',
            color: !fxOn ? C.orange : C.silverDark,
          }}>OFF</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <EQKnob label="FX" value={50} size={22} color="#f97316" />
        </div>
      </div>

      <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.05)' }} />

      {/* ── Channel EQ ── */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.28rem', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>EQ</span>
        {(['hi','mid','lo'] as const).map(band => (
          <div key={band} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <EQKnob
              label={band.toUpperCase()}
              value={eqVals[band]}
              size={24}
              color={band === 'hi' ? '#38bdf8' : band === 'mid' ? '#a3e635' : '#f97316'}
              onChange={v => setEqVals(p => ({ ...p, [band]: v }))}
            />
          </div>
        ))}
      </div>

      <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.05)' }} />

      {/* ── Filter knobs A / B ── */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-around' }}>
        {([['A', filterA, setFilterA, C.cyan], ['B', filterB, setFilterB, C.orange]] as const).map(([lbl, val, set, col]) => (
          <div key={lbl} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <EQKnob label="FILTER" value={val as number} size={20} color={col as string}
              onChange={v => (set as (n: number) => void)(v)} />
            <span style={{ fontFamily: 'monospace', fontSize: '0.28rem', color: col as string, letterSpacing: '0.1em' }}>{lbl}</span>
          </div>
        ))}
      </div>

      <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.05)' }} />

      {/* ── Crossfader ── */}
      <div style={{ width: '100%', flexBasis: isMobile ? '100%' : undefined }}>
        <p style={{ fontFamily: 'monospace', fontSize: '0.26rem', letterSpacing: '0.35em', color: 'rgba(255,255,255,0.2)',
          textAlign: 'center', marginBottom: 4 }}>CROSSFADER</p>
        <div style={{
          position: 'relative', height: 18, borderRadius: 3,
          background: `linear-gradient(to right, rgba(99,243,216,0.18), rgba(18,22,27,0.9) 50%, rgba(255,155,94,0.15))`,
          border: '1px solid rgba(170,179,187,0.15)',
          boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.7)',
        }}>
          <input type="range" min={0} max={100} value={xfade} onChange={e => onXfade(+e.target.value)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0 }} />
          <div style={{
            position: 'absolute', width: 18, height: 30, left: `calc(${xfade}% - 9px)`,
            borderRadius: 3, pointerEvents: 'none', top: -6,
            background: 'linear-gradient(160deg, #d9e0e6 0%, #b9c0c7 30%, #8e979f 65%, #72797f 100%)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.9), inset 0 1px 0 rgba(217,224,230,0.7)',
            border: '1px solid rgba(100,108,116,0.6)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
          }}>
            {[0,1,2,3].map(i => <div key={i} style={{ width: '60%', height: 1,
              background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid rgba(255,255,255,0.3)' }} />)}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.32rem', fontWeight: 700, color: C.cyan, letterSpacing: '0.1em', textShadow: '0 0 6px rgba(99,243,216,0.5)' }}>A</span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.32rem', fontWeight: 700, color: C.orange, letterSpacing: '0.1em' }}>B</span>
        </div>
      </div>

      {/* ── Master ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <EQKnob label="MASTER" value={75} size={28} color="#22c55e" />
      </div>

    </div>
  );
}

/* ─── EQ Knob (interactive rotary) ──────────────────────── */
function EQKnob({ label, value, size, color, onChange }: {
  label: string; value: number; size: number; color: string; onChange?: (v: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [localVal, setLocalVal] = useState(value);
  const startY = useRef(0);
  const startVal = useRef(0);

  // Angle: 0% = -135deg, 50% = 0deg, 100% = +135deg
  const angle = -135 + (localVal / 100) * 270;
  const isCenter = Math.abs(localVal - 50) < 3;

  function onPointerDown(e: React.PointerEvent) {
    if (!onChange) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    startY.current = e.clientY;
    startVal.current = localVal;
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !onChange) return;
    const delta = (startY.current - e.clientY) * 0.8;
    const next = Math.max(0, Math.min(100, startVal.current + delta));
    setLocalVal(next);
    onChange(next);
  }
  function onPointerUp() { setDragging(false); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      cursor: onChange ? 'ns-resize' : 'default' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Outer ring — silver channel */}
        <svg width={size} height={size} viewBox="0 0 40 40" style={{ position: 'absolute', inset: 0 }}>
          <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(142,151,159,0.2)" strokeWidth="3"/>
          {/* Arc — silver fill, glows with color at center */}
          <circle cx="20" cy="20" r="18" fill="none"
            stroke={isCenter ? color : 'rgba(185,192,199,0.55)'}
            strokeWidth="2.5"
            strokeDasharray={`${(localVal / 100) * 113} 200`}
            strokeDashoffset="85"
            strokeLinecap="round"
            style={{ transition: dragging ? 'none' : 'stroke 0.2s',
              filter: isCenter ? `drop-shadow(0 0 3px ${color}80)` : 'none' }}
          />
        </svg>
        {/* Knob body — dark brushed metal */}
        <div style={{
          position: 'absolute', inset: size * 0.12,
          borderRadius: '50%',
          background: `radial-gradient(circle at 38% 35%, #2a2e36, #0e1014)`,
          boxShadow: `inset 0 2px 4px rgba(0,0,0,0.8), inset 0 -1px 0 rgba(185,192,199,0.08),
            0 0 ${isCenter ? 8 : 0}px ${color}50`,
          transition: 'box-shadow 0.2s',
          border: '1px solid rgba(170,179,187,0.12)',
        }}>
          {/* Indicator line */}
          <div style={{
            position: 'absolute', top: '12%', left: '50%',
            width: 2, height: '30%',
            background: color,
            borderRadius: 1,
            transformOrigin: `1px ${size * 0.38 * 0.88 * 0.76}px`,
            transform: `translateX(-50%) rotate(${angle}deg)`,
            boxShadow: `0 0 4px ${color}`,
            transition: dragging ? 'none' : 'transform 0.1s',
          }} />
        </div>
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: '0.26rem', letterSpacing: '0.25em',
        color: isCenter ? color : 'rgba(255,255,255,0.25)', transition: 'color 0.2s' }}>
        {label}
      </span>
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
        background: C.panel, border: 'none', borderBottom: 'none',
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
        background: '#0f0f12', border: 'none', borderTop: 'none', borderBottom: 'none',
      }}>
        {['#','TITLE','WAVEFORM','BPM','KEY','DUR','DECK'].map(h => (
          <span key={h} style={{ fontFamily: 'monospace', fontSize: '0.26rem', letterSpacing: '0.35em',
            color: C.dim, textTransform: 'uppercase' }}>{h}</span>
        ))}
      </div>

      {/* Track rows */}
      <div style={{ border: 'none', borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
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
          padding: '2px 5px', borderRadius: 3, border: `1px solid ${C.cyan}00`,
          background: isLeft ? `${C.cyan}25` : 'transparent',
          color: isLeft ? C.cyan : C.sub,
          fontFamily: 'monospace', fontSize: '0.28rem', cursor: 'pointer',
          letterSpacing: '0.1em',
        }}>A</button>
        <button onClick={e => { e.stopPropagation(); onLoadRight(); }} style={{
          padding: '2px 5px', borderRadius: 3, border: `1px solid ${C.blue}00`,
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
        border: 'none', position: 'relative',
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
          background: '#0a0c0f',
          boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(170,179,187,0.1)' }} />
        <div style={{ position: 'absolute', left: 2, width: 10, top: '50%', height: 1,
          background: `rgba(170,179,187,0.25)` }} />
        <input type="range" min={-8} max={8} step={0.1} value={pitch} onChange={e => onChange(+e.target.value)}
          style={{ writingMode: 'vertical-lr', direction: 'rtl', position: 'absolute',
            height: '100%', width: 30, left: -8, opacity: 0, cursor: 'pointer', margin: 0 }} />
        <div style={{
          position: 'absolute', width: 26, height: 11, top: `calc(${pct}% - 5.5px)`, left: -6,
          borderRadius: 2, pointerEvents: 'none',
          background: 'linear-gradient(160deg, #d9e0e6 0%, #b9c0c7 30%, #8e979f 65%, #72797f 100%)',
          boxShadow: '0 2px 7px rgba(0,0,0,0.8), inset 0 1px 0 rgba(217,224,230,0.7)',
          border: '1px solid rgba(100,108,116,0.55)',
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
