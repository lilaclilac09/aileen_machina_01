'use client';
import { useState, useRef, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import TrackLibraryBrowser from './TrackLibraryBrowser';
import DJDeckWaveform from './DJDeckWaveform';
import DJMixBooth from './DJMixBooth';
import { allDeckTracks, type DeckTrack } from '../lib/djSetlist';
import { useDjMixer } from '../lib/useDjMixer';
import { fmtMs } from '../lib/djMixerMath';

/* ─── Palette — aligned to AgentChat cream + deep green ─── */
const C = {
  // backgrounds
  bg:          '#0b0d10',
  deck:        '#12161b',
  panel:       '#12161b',
  // text — agent console cream (not cold white)
  text:        '#fffdf8',
  sub:         'rgba(255,253,248,0.62)',
  dim:         'rgba(255,253,248,0.42)',
  muted:       'rgba(255,253,248,0.22)',
  // functional — agent deep teal-green (not fluorescent cyan)
  green:       '#007d75',
  orange:      '#ff9b5e',
  blue:        '#7db7ff',
  cyan:        '#00a89d',
  cyanGlow:    'rgba(0,168,157,0.28)',
  // silver/brushed metal
  silver:      '#b9c0c7',
  silverDark:  '#8e979f',
  silverLight: '#d9e0e6',
  silverBorder:'#aab3bb',
  border:      'rgba(170,179,187,0.18)',
};

/* ─── Full deck library: handoff five + previous tracks ───── */
const DJ_SET = allDeckTracks();
type Track = DeckTrack;

function spotifyTrackId(track: Track): string | null {
  if (track.spotifyId) return track.spotifyId;
  if (/^[a-zA-Z0-9]{22}$/.test(track.id)) return track.id;
  return null;
}

function findTrackById(id: string | null | undefined): Track | null {
  if (!id) return null;
  return DJ_SET.find((t) => t.id === id || t.spotifyId === id) ?? null;
}

const DJ_AUDIT = '[dj-audit]';

function firstPlayableTrack(from = 0, skipId?: string | null): Track | null {
  for (let i = from; i < DJ_SET.length; i++) {
    const t = DJ_SET[i];
    const sid = spotifyTrackId(t);
    if (!sid) continue;
    if (skipId && sid === skipId) continue;
    return t;
  }
  for (let i = 0; i < from; i++) {
    const t = DJ_SET[i];
    const sid = spotifyTrackId(t);
    if (!sid) continue;
    if (skipId && sid === skipId) continue;
    return t;
  }
  return DJ_SET.find((t) => spotifyTrackId(t)) ?? DJ_SET[0] ?? null;
}

const INITIAL_LEFT = firstPlayableTrack(0);
const INITIAL_RIGHT = firstPlayableTrack(1, INITIAL_LEFT ? spotifyTrackId(INITIAL_LEFT) : null);

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

function fmtSecLabel(sec: number) {
  return fmtMs(sec * 1000);
}

/* ─── Responsive hook ────────────────────────────────────── */
function subscribeMobile(onStoreChange: () => void) {
  const mq = window.matchMedia('(max-width: 639px)');
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}
function getMobileSnapshot() {
  return window.matchMedia('(max-width: 639px)').matches;
}
function getMobileServerSnapshot() {
  return false;
}
function useIsMobile() {
  return useSyncExternalStore(subscribeMobile, getMobileSnapshot, getMobileServerSnapshot);
}

/* ─── Main ───────────────────────────────────────────────── */
export default function DJStation() {
  const isMobile = useIsMobile();
  const mix = useDjMixer();
  const [leftTrack,    setLeftTrack]    = useState<Track | null>(INITIAL_LEFT);
  const [rightTrack,   setRightTrack]   = useState<Track | null>(INITIAL_RIGHT);
  const [dropSide,     setDropSide]     = useState<'left'|'right'|null>(null);
  const [leftEmbedReady,  setLeftEmbedReady]  = useState(false);
  const [rightEmbedReady, setRightEmbedReady] = useState(false);
  const [deckHint, setDeckHint] = useState<string | null>(null);

  const leftContainerRef  = useRef<HTMLDivElement>(null);
  const rightContainerRef = useRef<HTMLDivElement>(null);
  const leftCtrl          = useRef<SpotifyController | null>(null);
  const rightCtrl         = useRef<SpotifyController | null>(null);
  const fileARef          = useRef<HTMLInputElement>(null);
  const fileBRef          = useRef<HTMLInputElement>(null);
  const dragTrack         = useRef<Track | null>(null);
  /** Deck A only — URI queued when leftCtrl is not ready yet (migration reconnect). */
  const pendingLeftUri    = useRef<string | null>(null);
  const hintTimer         = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showDeckHint = useCallback((msg: string) => {
    setDeckHint(msg);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setDeckHint(null), 4200);
  }, []);

  useEffect(() => () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
  }, []);

  useEffect(() => {
    const sample = DJ_SET.slice(0, 3).map((t) => ({
      id: t.id,
      title: t.title,
      thumb: !!t.thumb,
      bpm: t.bpm,
      key: t.key,
      dur: t.dur,
      playable: !!spotifyTrackId(t),
    }));
    console.log(DJ_AUDIT, 'carousel state after catalogue bind', {
      count: DJ_SET.length,
      sample,
    });
  }, []);

  /* ── Spotify API — tolerant of Strict Mode remount + late script ready ── */
  useEffect(() => {
    const win = window as Window & {
      SpotifyIframeApi?: IFrameAPI;
      onSpotifyIframeApiReady?: (api: IFrameAPI) => void;
    };
    let cancelled = false;
    let retries = 0;

    const containerEmpty = (el: HTMLElement | null) =>
      !!el && !el.querySelector('iframe');

    const mountSide = (
      api: IFrameAPI,
      side: 'left' | 'right',
      el: HTMLElement | null,
      track: Track | null,
      ctrlRef: React.MutableRefObject<SpotifyController | null>,
      onUpdate: (e: { data: PlayUpdate }) => void,
      onReady: () => void,
    ) => {
      if (!el || cancelled) return;
      const uri = track ? spotifyTrackId(track) : null;
      if (!uri) return;
      // Strict Mode remount leaves a stale controller pointing at a detached node.
      if (ctrlRef.current && containerEmpty(el)) {
        ctrlRef.current = null;
        el.innerHTML = '';
      }
      // Iframe present but controller lost (Strict Mode / race) — remount.
      if (!ctrlRef.current && !containerEmpty(el)) {
        el.innerHTML = '';
      }
      if (ctrlRef.current) {
        onReady();
        return;
      }
      if (!containerEmpty(el)) {
        onReady();
        return;
      }

      api.createController(
        el,
        { uri: `spotify:track:${uri}`, width: '100%', height: '80' },
        (ctrl) => {
          if (cancelled) return;
          ctrlRef.current = ctrl;
          ctrl.addListener('playback_update', onUpdate);
          // Deck A slice: flush queued loadUri when controller becomes ready
          if (side === 'left' && pendingLeftUri.current) {
            const queued = pendingLeftUri.current;
            pendingLeftUri.current = null;
            console.log(DJ_AUDIT, 'leftCtrl ready — flush pendingLeftUri', queued);
            try {
              ctrl.loadUri(queued);
            } catch (err) {
              console.log(DJ_AUDIT, 'flush pendingLeftUri failed', err);
            }
          }
          onReady();
        },
      );
    };

    const initControllers = (api: IFrameAPI) => {
      if (cancelled) return;
      win.SpotifyIframeApi = api;
      mountSide(api, 'left', leftContainerRef.current, INITIAL_LEFT, leftCtrl, () => {
        /* Spotify iframe is preview-only — not part of the mix graph */
      }, () => setLeftEmbedReady(true));
      mountSide(api, 'right', rightContainerRef.current, INITIAL_RIGHT, rightCtrl, () => {
        /* Spotify iframe is preview-only — not part of the mix graph */
      }, () => setRightEmbedReady(true));
    };

    const prevReady = win.onSpotifyIframeApiReady;
    win.onSpotifyIframeApiReady = (api: IFrameAPI) => {
      initControllers(api);
      prevReady?.(api);
    };

    if (win.SpotifyIframeApi) {
      initControllers(win.SpotifyIframeApi);
    } else if (!document.querySelector('script[src*="spotify-iframe-api"]')) {
      const s = document.createElement('script');
      s.src = 'https://open.spotify.com/embed/iframe-api/v1';
      s.async = true;
      document.head.appendChild(s);
    }

    // Retry: script may have fired ready before this effect, or Strict Mode cleared DOM.
    const timer = window.setInterval(() => {
      if (cancelled) return;
      retries += 1;
      const api = win.SpotifyIframeApi;
      if (api) initControllers(api);
      const leftOk = !containerEmpty(leftContainerRef.current);
      const rightOk = !containerEmpty(rightContainerRef.current);
      if (leftOk) setLeftEmbedReady(true);
      if (rightOk) setRightEmbedReady(true);
      if ((leftOk && rightOk) || retries > 20) {
        window.clearInterval(timer);
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      leftCtrl.current = null;
      rightCtrl.current = null;
      if (leftContainerRef.current) leftContainerRef.current.innerHTML = '';
      if (rightContainerRef.current) rightContainerRef.current.innerHTML = '';
    };
  }, []);

  const loadTrack = useCallback((side: 'left'|'right', track: Track) => {
    const sid = spotifyTrackId(track);
    console.log(DJ_AUDIT, 'loadTrack', {
      side,
      id: track.id,
      title: track.title,
      thumb: track.thumb?.slice?.(0, 48),
      bpm: track.bpm,
      key: track.key,
      dur: track.dur,
      spotifyId: sid,
    });

    mix.setCrateMeta(side, { title: track.title, bpm: track.bpm, key: track.key });

    if (side === 'left') {
      setLeftTrack(track);
      if (sid) {
        const uri = `spotify:track:${sid}`;
        if (leftCtrl.current) {
          pendingLeftUri.current = null;
          try {
            leftCtrl.current.loadUri(uri);
            console.log(DJ_AUDIT, 'audio source assigned', { deck: 'A', uri, via: 'loadUri' });
            setDeckHint(null);
          } catch (err) {
            console.log(DJ_AUDIT, 'loadUri error', { deck: 'A', err });
            showDeckHint('Deck A: press ▶ to start');
          }
        } else {
          // Reconnect: queue until leftCtrl createController callback (same IFrame, no second player)
          pendingLeftUri.current = uri;
          console.log(DJ_AUDIT, 'leftCtrl null — queued pendingLeftUri', uri);
          showDeckHint('Deck A: Spotify loading — press ▶ when ready');
        }
      } else {
        pendingLeftUri.current = null;
        showDeckHint(`“${track.title}” has no Spotify id — pick a library track to play`);
      }
    } else {
      setRightTrack(track);
      if (sid) {
        rightCtrl.current?.loadUri(`spotify:track:${sid}`);
        setDeckHint(null);
      } else {
        showDeckHint(`“${track.title}” has no Spotify id — pick a library track to play`);
      }
    }
  }, [showDeckHint, mix]);

  const resolveDropTrack = useCallback((e: React.DragEvent, fallback: Track | null): Track | null => {
    if (fallback) return fallback;
    let id = '';
    try {
      id = e.dataTransfer.getData('text/plain') || '';
    } catch {
      id = '';
    }
    const found = findTrackById(id);
    console.log(DJ_AUDIT, 'resolveDropTrack', { id, found: found?.id ?? null });
    return found;
  }, []);

  const takeAudioFile = (e: React.DragEvent): File | null => {
    const file = e.dataTransfer.files?.[0];
    if (!file) return null;
    if (file.type.startsWith('audio/')) return file;
    if (/\.(mp3|wav|ogg|m4a|flac|aac|webm)$/i.test(file.name)) return file;
    return null;
  };

  const assignFile = useCallback(async (side: 'left' | 'right', file: File) => {
    const crate = side === 'left' ? leftTrack : rightTrack;
    await mix.loadFile(side, file, crate ? { title: crate.title, bpm: crate.bpm, key: crate.key } : undefined);
    showDeckHint('loaded. this one has teeth.');
  }, [leftTrack, rightTrack, mix, showDeckHint]);

  const dropOnDeckA = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = takeAudioFile(e);
    if (file) {
      void assignFile('left', file);
      dragTrack.current = null;
      setDropSide(null);
      return;
    }
    const track = resolveDropTrack(e, dragTrack.current);
    console.log(DJ_AUDIT, 'drop target deck', { deck: 'A', trackId: track?.id ?? null });
    if (track) loadTrack('left', track);
    dragTrack.current = null;
    setDropSide(null);
  }, [loadTrack, resolveDropTrack, assignFile]);

  const dropOnDeckB = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = takeAudioFile(e);
    if (file) {
      void assignFile('right', file);
      dragTrack.current = null;
      setDropSide(null);
      return;
    }
    if (dragTrack.current) loadTrack('right', dragTrack.current);
    dragTrack.current = null;
    setDropSide(null);
  }, [loadTrack, assignFile]);

  const toggleDeck = useCallback(async (side: 'left' | 'right') => {
    const label = side === 'left' ? 'A' : 'B';
    const started = await mix.toggle(side);
    if (started) {
      setDeckHint(null);
      return;
    }
    showDeckHint(
      `Deck ${label}: upload an audio file to mix. Spotify below is preview only — iframe audio cannot enter the mix.`,
    );
  }, [mix, showDeckHint]);

  const handleXfade = useCallback((v: number) => {
    mix.changeXfade(v);
  }, [mix]);

  const leftBpm = mix.deckA.bpm ?? leftTrack?.bpm ?? null;
  const rightBpm = mix.deckB.bpm ?? rightTrack?.bpm ?? null;

  /* BPM sync suggestion */
  const bpmHint = useMemo(() => {
    if (!leftBpm || !rightBpm) return null;
    const diff = rightBpm * (1 + mix.deckB.pitch / 100) - leftBpm * (1 + mix.deckA.pitch / 100);
    if (Math.abs(diff) < 0.5) return { type: 'sync' as const, diff };
    return { type: 'hint' as const, diff };
  }, [leftBpm, rightBpm, mix.deckA.pitch, mix.deckB.pitch]);

  const leftDim  = mix.xfade > 80 ? (100 - mix.xfade) / 20 : 1;
  const rightDim = mix.xfade < 20 ? mix.xfade / 20 : 1;

  const handleSyncLeft = useCallback(() => {
    if (!mix.sync('left')) showDeckHint('SYNC needs BPM on both decks — upload/crate tags, or v2 beat detection');
  }, [mix, showDeckHint]);

  const handleSyncRight = useCallback(() => {
    if (!mix.sync('right')) showDeckHint('SYNC needs BPM on both decks — upload/crate tags, or v2 beat detection');
  }, [mix, showDeckHint]);

  const leftPlaying = mix.deckA.playing;
  const rightPlaying = mix.deckB.playing;
  const leftPos = mix.deckA.mixLoaded ? mix.deckA.pos * 1000 : 0;
  const rightPos = mix.deckB.mixLoaded ? mix.deckB.pos * 1000 : 0;
  const leftDur = mix.deckA.mixLoaded ? mix.deckA.dur * 1000 : (leftTrack?.dur ?? 0) * 1000;
  const rightDur = mix.deckB.mixLoaded ? mix.deckB.dur * 1000 : (rightTrack?.dur ?? 0) * 1000;

  const displayTrack = (side: 'left' | 'right'): Track | null => {
    const crate = side === 'left' ? leftTrack : rightTrack;
    const deck = side === 'left' ? mix.deckA : mix.deckB;
    if (crate) {
      return deck.mixLoaded
        ? { ...crate, title: deck.title || crate.title, bpm: deck.bpm ?? crate.bpm, dur: deck.dur || crate.dur }
        : crate;
    }
    if (!deck.mixLoaded) return null;
    return {
      id: side === 'left' ? 'local-a' : 'local-b',
      title: deck.title || (side === 'left' ? 'LOCAL A' : 'LOCAL B'),
      bpm: deck.bpm ?? 0,
      key: deck.key ?? '—',
      dur: deck.dur,
      thumb: '',
    };
  };

  return (
    <div style={{ userSelect: 'none', width: '100%', background: '#0b0d10' }}>
      <input
        ref={fileARef}
        data-testid="dj-upload-a"
        type="file"
        accept="audio/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void assignFile('left', f);
          e.target.value = '';
        }}
      />
      <input
        ref={fileBRef}
        data-testid="dj-upload-b"
        type="file"
        accept="audio/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void assignFile('right', f);
          e.target.value = '';
        }}
      />

      <p
        data-testid="dj-spotify-preview-note"
        style={{
          margin: '0 0 8px',
          fontFamily: 'monospace',
          fontSize: '0.34rem',
          letterSpacing: '0.08em',
          color: C.dim,
        }}
      >
        SPOTIFY PREVIEW — iframe audio cannot be mixed through Web Audio. Upload files (or a CORS-safe URL) to mix.
      </p>

      {/* ── Handoff set carousel (film strip) — top of the desk ── */}
      <div id="dj-set" data-testid="dj-set" style={{ marginTop: 4, marginBottom: 10 }}>
        <TrackLibraryBrowser
          tracks={DJ_SET}
          reverseCarousel={false}
          onLoadTrack={loadTrack}
          onSetDragTrack={(t) => {
            dragTrack.current = t;
            console.log(DJ_AUDIT, 'drag start track id', t?.id ?? null, t?.title ?? null);
          }}
          playingLeft={leftPlaying ? (leftTrack?.id ?? mix.deckA.fileName) : null}
          playingRight={rightPlaying ? (rightTrack?.id ?? mix.deckB.fileName) : null}
          leftPos={leftPos} leftDur={leftDur}
          rightPos={rightPos} rightDur={rightDur}
        />
      </div>

      {/* ── Spotify embed containers (preview only — not in the mix graph) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 6, marginBottom: 8 }}>
        {(['left','right'] as const).map(side => {
          const track = side === 'left' ? leftTrack : rightTrack;
          const ref   = side === 'left' ? leftContainerRef : rightContainerRef;
          const sid   = track ? spotifyTrackId(track) : null;
          const ready = side === 'left' ? leftEmbedReady : rightEmbedReady;
          return (
            <div key={side} style={{
              borderRadius: 6, overflow: 'hidden', background: C.bg,
              border: '1px solid rgba(170,179,187,0.12)', position: 'relative',
              minHeight: 80,
            }}>
              <div ref={ref} style={{ minHeight: 80, width: '100%' }} />
              {/* Visible play chrome while Spotify iframe is still mounting */}
              {!ready && (
                <div
                  aria-hidden
                  style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '0 14px',
                    background: 'linear-gradient(90deg, #12161b 0%, #0b0d10 100%)',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: '#1DB954',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 0 1px rgba(29,185,84,0.35)',
                  }}>
                    <span style={{
                      color: '#0b0d10', fontSize: 14, lineHeight: 1,
                      marginLeft: 2, fontWeight: 700,
                    }}>▶</span>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontSize: '0.72rem', fontWeight: 600, color: C.text,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {track?.title ?? (side === 'left' ? 'Deck A' : 'Deck B')}
                    </div>
                    <div style={{
                      fontSize: '0.58rem', color: C.dim, marginTop: 2,
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                    }}>
                      {sid ? 'Loading Spotify player…' : 'No Spotify id — pick a library track'}
                    </div>
                  </div>
                </div>
              )}
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
            AILEENA DESK
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
            {leftBpm ?? '--'} / {rightBpm ?? '--'} BPM
          </span>
        </div>

        <EngineStatus
          ready={mix.ready}
          a={mix.deckA.mixLoaded}
          b={mix.deckB.mixLoaded}
          recording={mix.recording}
          exportReady={mix.exportReady}
        />
        <p style={{
          margin: '-4px 0 8px',
          fontFamily: 'monospace',
          fontSize: '0.28rem',
          letterSpacing: '0.08em',
          color: C.muted,
        }}>
          club-desk ergonomics · not a product clone
        </p>

        {/* Deck + Mixer grid */}
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            <DeckPanel
              side="left" track={displayTrack('left')} playing={leftPlaying} isMobile={true} synced={bpmHint?.type === 'sync'}
              pos={leftPos} dur={leftDur}
              pitch={mix.deckA.pitch} dim={leftDim} dropActive={dropSide === 'left'}
              mixLoaded={mix.deckA.mixLoaded} peaks={mix.deckA.peaks} gain={mix.deckA.gain} vu={mix.vuA}
              cueMs={mix.deckA.cue * 1000}
              loopActive={mix.deckA.loopActive} loopIn={mix.deckA.loopIn} loopOut={mix.deckA.loopOut}
              loopBars={mix.deckA.loopBars} hotCues={mix.deckA.hotCues}
              syncEnabled={!!(leftBpm && rightBpm)} loopBarsEnabled={!!leftBpm}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDropSide('left'); }}
              onDragLeave={() => setDropSide(null)}
              onDrop={dropOnDeckA}
              onToggle={() => void toggleDeck('left')}
              onPitch={v => mix.setPitch('left', v)}
              onGain={v => mix.setGain('left', v)}
              onSeek={sec => mix.seek('left', sec)}
              onCue={() => mix.deckA.playing ? mix.returnToCue('left') : mix.setCueNow('left')}
              onUpload={() => fileARef.current?.click()}
              onLoopIn={() => mix.loopIn('left')}
              onLoopOut={() => mix.loopOut('left')}
              onLoopBars={n => { if (!mix.loopBars('left', n)) showDeckHint('Loop 1/2/4/8 needs BPM — v2 beat detection'); }}
              onLoopExit={() => mix.loopExit('left')}
              onHotCue={(i, clear) => mix.hotCue('left', i, clear)}
              onSync={handleSyncLeft}
            />
            <MixerPanel
              xfade={mix.xfade} onXfade={handleXfade} isMobile={true}
              eqA={mix.eqA} eqB={mix.eqB} onEq={mix.changeEq}
              filterA={mix.filterA} filterB={mix.filterB} onFilter={mix.changeFilter}
              faderA={mix.faderA} faderB={mix.faderB} onFader={mix.changeFader}
              master={mix.master} onMaster={mix.changeMaster}
              vuA={mix.vuA} vuB={mix.vuB} vuM={mix.vuM}
            />
            <DeckPanel
              side="right" track={displayTrack('right')} playing={rightPlaying} isMobile={true} synced={bpmHint?.type === 'sync'}
              pos={rightPos} dur={rightDur}
              pitch={mix.deckB.pitch} dim={rightDim} dropActive={dropSide === 'right'}
              mixLoaded={mix.deckB.mixLoaded} peaks={mix.deckB.peaks} gain={mix.deckB.gain} vu={mix.vuB}
              cueMs={mix.deckB.cue * 1000}
              loopActive={mix.deckB.loopActive} loopIn={mix.deckB.loopIn} loopOut={mix.deckB.loopOut}
              loopBars={mix.deckB.loopBars} hotCues={mix.deckB.hotCues}
              syncEnabled={!!(leftBpm && rightBpm)} loopBarsEnabled={!!rightBpm}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDropSide('right'); }}
              onDragLeave={() => setDropSide(null)}
              onDrop={dropOnDeckB}
              onToggle={() => void toggleDeck('right')}
              onPitch={v => mix.setPitch('right', v)}
              onGain={v => mix.setGain('right', v)}
              onSeek={sec => mix.seek('right', sec)}
              onCue={() => mix.deckB.playing ? mix.returnToCue('right') : mix.setCueNow('right')}
              onUpload={() => fileBRef.current?.click()}
              onLoopIn={() => mix.loopIn('right')}
              onLoopOut={() => mix.loopOut('right')}
              onLoopBars={n => { if (!mix.loopBars('right', n)) showDeckHint('Loop 1/2/4/8 needs BPM — v2 beat detection'); }}
              onLoopExit={() => mix.loopExit('right')}
              onHotCue={(i, clear) => mix.hotCue('right', i, clear)}
              onSync={handleSyncRight}
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', gap: 8, marginBottom: 10 }}>
            <DeckPanel
              side="left" track={displayTrack('left')} playing={leftPlaying} synced={bpmHint?.type === 'sync'}
              pos={leftPos} dur={leftDur}
              pitch={mix.deckA.pitch} dim={leftDim} dropActive={dropSide === 'left'}
              mixLoaded={mix.deckA.mixLoaded} peaks={mix.deckA.peaks} gain={mix.deckA.gain} vu={mix.vuA}
              cueMs={mix.deckA.cue * 1000}
              loopActive={mix.deckA.loopActive} loopIn={mix.deckA.loopIn} loopOut={mix.deckA.loopOut}
              loopBars={mix.deckA.loopBars} hotCues={mix.deckA.hotCues}
              syncEnabled={!!(leftBpm && rightBpm)} loopBarsEnabled={!!leftBpm}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDropSide('left'); }}
              onDragLeave={() => setDropSide(null)}
              onDrop={dropOnDeckA}
              onToggle={() => void toggleDeck('left')}
              onPitch={v => mix.setPitch('left', v)}
              onGain={v => mix.setGain('left', v)}
              onSeek={sec => mix.seek('left', sec)}
              onCue={() => mix.deckA.playing ? mix.returnToCue('left') : mix.setCueNow('left')}
              onUpload={() => fileARef.current?.click()}
              onLoopIn={() => mix.loopIn('left')}
              onLoopOut={() => mix.loopOut('left')}
              onLoopBars={n => { if (!mix.loopBars('left', n)) showDeckHint('Loop 1/2/4/8 needs BPM — v2 beat detection'); }}
              onLoopExit={() => mix.loopExit('left')}
              onHotCue={(i, clear) => mix.hotCue('left', i, clear)}
              onSync={handleSyncLeft}
            />
            <MixerPanel
              xfade={mix.xfade} onXfade={handleXfade}
              eqA={mix.eqA} eqB={mix.eqB} onEq={mix.changeEq}
              filterA={mix.filterA} filterB={mix.filterB} onFilter={mix.changeFilter}
              faderA={mix.faderA} faderB={mix.faderB} onFader={mix.changeFader}
              master={mix.master} onMaster={mix.changeMaster}
              vuA={mix.vuA} vuB={mix.vuB} vuM={mix.vuM}
            />
            <DeckPanel
              side="right" track={displayTrack('right')} playing={rightPlaying} synced={bpmHint?.type === 'sync'}
              pos={rightPos} dur={rightDur}
              pitch={mix.deckB.pitch} dim={rightDim} dropActive={dropSide === 'right'}
              mixLoaded={mix.deckB.mixLoaded} peaks={mix.deckB.peaks} gain={mix.deckB.gain} vu={mix.vuB}
              cueMs={mix.deckB.cue * 1000}
              loopActive={mix.deckB.loopActive} loopIn={mix.deckB.loopIn} loopOut={mix.deckB.loopOut}
              loopBars={mix.deckB.loopBars} hotCues={mix.deckB.hotCues}
              syncEnabled={!!(leftBpm && rightBpm)} loopBarsEnabled={!!rightBpm}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDropSide('right'); }}
              onDragLeave={() => setDropSide(null)}
              onDrop={dropOnDeckB}
              onToggle={() => void toggleDeck('right')}
              onPitch={v => mix.setPitch('right', v)}
              onGain={v => mix.setGain('right', v)}
              onSeek={sec => mix.seek('right', sec)}
              onCue={() => mix.deckB.playing ? mix.returnToCue('right') : mix.setCueNow('right')}
              onUpload={() => fileBRef.current?.click()}
              onLoopIn={() => mix.loopIn('right')}
              onLoopOut={() => mix.loopOut('right')}
              onLoopBars={n => { if (!mix.loopBars('right', n)) showDeckHint('Loop 1/2/4/8 needs BPM — v2 beat detection'); }}
              onLoopExit={() => mix.loopExit('right')}
              onHotCue={(i, clear) => mix.hotCue('right', i, clear)}
              onSync={handleSyncRight}
            />
          </div>
        )}

        {deckHint && (
          <p
            role="status"
            style={{
              margin: '0 0 8px',
              padding: '8px 10px',
              borderRadius: 4,
              border: '1px solid rgba(0,168,157,0.35)',
              background: 'rgba(0,168,157,0.08)',
              fontFamily: 'monospace',
              fontSize: '0.58rem',
              letterSpacing: '0.04em',
              color: C.text,
              textAlign: 'center',
            }}
          >
            {deckHint}
          </p>
        )}
      </div>

      <DJMixBooth
        recording={mix.recording}
        recSec={mix.recSec}
        exportReady={mix.exportReady}
        exportMime={mix.exportMime}
        receipt={mix.receipt}
        error={mix.error}
        onRecord={() => {
          void mix.startRecord().then((ok) => {
            if (ok) showDeckHint('recording the master bus.');
          });
        }}
        onStop={() => {
          void mix.stopRecord().then(() => {
            showDeckHint('export ready. not a masterpiece yet, but it moves.');
          });
        }}
        onDownloadAudio={mix.downloadAudio}
        onDownloadMeta={mix.downloadMeta}
        onCopyReceipt={() => void mix.copyReceiptText()}
        onLoadUrl={(side, url) => void mix.loadUrl(side, url)}
      />
    </div>
  );
}

/* ─── Deck Panel ─────────────────────────────────────────── */
function DeckPanel({ side, track, playing, pos, dur, pitch, dim, dropActive, isMobile, synced,
  mixLoaded, peaks, gain, vu, cueMs, loopActive, loopIn, loopOut, loopBars, hotCues,
  syncEnabled, loopBarsEnabled,
  onDragOver, onDragLeave, onDrop, onToggle, onPitch, onGain, onSeek, onCue, onUpload,
  onLoopIn, onLoopOut, onLoopBars, onLoopExit, onHotCue, onSync }: {
  side: 'left'|'right'; track: Track|null; playing: boolean;
  pos: number; dur: number; pitch: number; dim: number; dropActive: boolean;
  isMobile?: boolean; synced?: boolean;
  mixLoaded: boolean; peaks: number[] | null; gain: number; vu: number; cueMs: number;
  loopActive: boolean; loopIn: number | null; loopOut: number | null; loopBars: number | null;
  hotCues: Array<number | null>;
  syncEnabled: boolean; loopBarsEnabled: boolean;
  onDragOver(e: React.DragEvent): void; onDragLeave(): void; onDrop(e: React.DragEvent): void;
  onToggle(): void; onPitch(v: number): void; onGain(v: number): void;
  onSeek(sec: number): void; onCue(): void; onUpload(): void;
  onLoopIn(): void; onLoopOut(): void; onLoopBars(n: number): void; onLoopExit(): void;
  onHotCue(i: number, clear: boolean): void;
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

  // Scratch is visual-only (platter spin). Not vinyl audio.
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
      <div
        data-testid={side === 'left' ? 'dj-deck-a-drop' : 'dj-deck-b-drop'}
        data-deck-side={side}
        data-mix-loaded={mixLoaded ? 'true' : 'false'}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
        position: 'relative', height: D + 16, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: C.bg,
        border: dropActive ? `1px solid rgba(0,168,157,0.5)` : `1px solid rgba(170,179,187,0.12)`,
        boxShadow: dropActive ? `inset 0 0 30px rgba(0,168,157,0.08)` : 'none',
        transition: 'border 0.15s, box-shadow 0.15s',
      }}>
        {!track ? (
          <p style={{ fontSize: '0.34rem', letterSpacing: '0.5em', textTransform: 'uppercase',
            color: dropActive ? 'rgba(100,220,210,0.8)' : C.dim }}>
            {dropActive ? '↓ DROP FILE' : 'drop file or A / B'}
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
                ? '0 0 55px rgba(0,168,157,0.45), 0 0 110px rgba(0,168,157,0.18), inset 0 0 35px rgba(0,0,0,0.45)'
                : '0 0 22px rgba(0,168,157,0.18), 0 0 50px rgba(0,168,157,0.06), inset 0 0 20px rgba(0,0,0,0.35)',
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
                fill={playing ? C.cyan : '#394048'}
                style={{ filter: playing ? 'drop-shadow(0 0 4px rgba(0,168,157,0.9))' : 'none', transition: 'all 0.6s ease' }}/>

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
                fill={playing ? C.cyan : 'rgba(170,179,187,0.5)'}
                style={{ filter: playing ? 'drop-shadow(0 0 2px rgba(0,168,157,0.8))' : 'none', transition: 'all 0.6s' }}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
        <p
          data-testid={side === 'left' ? 'dj-deck-a-title' : 'dj-deck-b-title'}
          data-track-id={track?.id ?? ''}
          style={{ fontSize: '0.44rem', letterSpacing: '0.12em',
          color: playing ? C.cyan : C.text,
          fontFamily: 'monospace', textTransform: 'uppercase',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          transition: 'color 0.5s', flex: 1, margin: 0,
        }}>{track?.title ?? 'NO TRACK'}</p>
        <span style={{
          fontFamily: 'monospace', fontSize: '0.26rem', letterSpacing: '0.14em',
          color: mixLoaded ? C.cyan : C.orange, whiteSpace: 'nowrap',
        }}>{mixLoaded ? (playing ? 'MIX · playing' : 'MIX · loaded') : 'PREVIEW · not mixable'}</span>
        </div>
        <DJDeckWaveform
          side={side}
          peaks={peaks}
          pos={pos / 1000}
          dur={dur / 1000}
          onSeek={onSeek}
        />
        <button
          type="button"
          data-testid={side === 'left' ? 'dj-load-file-a' : 'dj-load-file-b'}
          onClick={onUpload}
          style={{
            alignSelf: 'flex-start',
            padding: '3px 8px',
            borderRadius: 3,
            cursor: 'pointer',
            background: '#14181e',
            border: '1px solid rgba(0,168,157,0.35)',
            color: C.cyan,
            fontFamily: 'monospace',
            fontSize: '0.3rem',
            letterSpacing: '0.14em',
          }}
        >
          LOAD FILE
        </button>
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
          <button
            data-testid={side === 'left' ? 'dj-play-a' : 'dj-play-b'}
            onClick={onToggle}
            style={{
            width: 38, height: 38, borderRadius: '50%', cursor: 'pointer',
            background: playing ? `rgba(0,168,157,0.1)` : '#14181e',
            border: `1px solid ${playing ? 'rgba(0,168,157,0.55)' : 'rgba(170,179,187,0.22)'}`,
            boxShadow: playing ? `0 0 10px rgba(0,168,157,0.28)` : 'inset 0 2px 5px rgba(0,0,0,0.4)',
            color: playing ? C.cyan : C.silver,
            fontSize: '0.8rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}>{playing ? '⏸' : '▶'}</button>
          {/* CUE */}
          <button
            title={playing ? 'return to cue and pause' : 'set cue at playhead'}
            onClick={onCue}
            style={{
            width: 38, height: 38, borderRadius: '50%', cursor: 'pointer',
            background: cueMs > 0 ? 'rgba(125,183,255,0.1)' : '#14181e',
            border: `1px solid ${cueMs > 0 ? 'rgba(125,183,255,0.55)' : 'rgba(170,179,187,0.22)'}`,
            boxShadow: cueMs > 0 ? '0 0 8px rgba(125,183,255,0.25)' : 'inset 0 2px 5px rgba(0,0,0,0.4)',
            color: cueMs > 0 ? C.blue : C.silverDark, fontSize: '0.28rem', letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1,
            transition: 'all 0.15s',
          }}>
            <span style={{ fontFamily: 'monospace' }}>CUE</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.22rem', opacity: 0.7 }}>{fmt(cueMs)}</span>
          </button>
        </div>
        <PitchFader pitch={pitch} onChange={onPitch} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <VU level={vu} />
          <EQKnob label="GAIN" value={gain} size={22} color={C.cyan} onChange={onGain} />
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

      {/* Club-desk marks — ergonomics, not a CDJ clone */}
      <DeckMarks
        side={side} playing={playing} synced={!!synced} pos={pos} onSync={onSync}
        syncEnabled={syncEnabled} loopBarsEnabled={loopBarsEnabled}
        loopActive={loopActive} loopIn={loopIn} loopOut={loopOut} loopBars={loopBars}
        hotCues={hotCues}
        onLoopIn={onLoopIn} onLoopOut={onLoopOut} onLoopBars={onLoopBars}
        onLoopExit={onLoopExit} onHotCue={onHotCue}
      />

      </div>{/* end info+controls wrapper */}
    </div>
  );
}

/* ─── Deck marks (club-desk logic, not CDJ trade dress) ──── */
function DeckMarks({ side, playing, synced, pos, onSync,
  syncEnabled, loopBarsEnabled, loopActive, loopIn, loopOut, loopBars, hotCues,
  onLoopIn, onLoopOut, onLoopBars, onLoopExit, onHotCue }: {
  side: 'left'|'right'; playing: boolean; synced: boolean;
  pos: number; onSync: () => void;
  syncEnabled: boolean; loopBarsEnabled: boolean;
  loopActive: boolean; loopIn: number | null; loopOut: number | null; loopBars: number | null;
  hotCues: Array<number | null>;
  onLoopIn(): void; onLoopOut(): void; onLoopBars(n: number): void; onLoopExit(): void;
  onHotCue(i: number, clear: boolean): void;
}) {
  const loopSizes = [1, 2, 4, 8];
  const mark = side === 'left' ? C.cyan : C.orange;
  void playing;
  void pos;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>

      {/* ── Row 1: SYNC + LOOP controls ── */}
      <div style={{
        background: C.bg, borderRadius: 6, padding: '6px 8px',
        border: '1px solid rgba(170,179,187,0.1)',
        display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap',
      }}>
        {/* SYNC */}
        <button
          onClick={onSync}
          disabled={!syncEnabled}
          title={syncEnabled ? 'match this deck BPM to the other deck via playbackRate' : 'needs BPM on both decks — v2 beat detection'}
          style={{
          padding: '4px 10px', borderRadius: 4, cursor: syncEnabled ? 'pointer' : 'not-allowed',
          background: synced ? 'rgba(0,168,157,0.1)' : '#14181e',
          border: `1px solid ${synced ? 'rgba(0,168,157,0.5)' : 'rgba(170,179,187,0.22)'}`,
          boxShadow: synced ? '0 0 8px rgba(0,168,157,0.25)' : 'inset 0 2px 4px rgba(0,0,0,0.5)',
          fontFamily: 'monospace', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.12em',
          color: synced ? C.cyan : C.silverDark,
          transition: 'all 0.2s', minWidth: 52, opacity: syncEnabled ? 1 : 0.4,
        }}>
          SYNC
        </button>

        {/* LOOP IN */}
        <button onClick={onLoopIn} style={{
          padding: '4px 8px', borderRadius: 4, cursor: 'pointer',
          background: loopIn !== null ? 'rgba(125,183,255,0.08)' : '#14181e',
          border: `1px solid ${loopIn !== null ? 'rgba(125,183,255,0.45)' : 'rgba(170,179,187,0.22)'}`,
          boxShadow: loopIn !== null ? '0 0 6px rgba(125,183,255,0.2)' : 'inset 0 2px 4px rgba(0,0,0,0.5)',
          fontFamily: 'monospace', fontSize: '0.44rem', fontWeight: 600, letterSpacing: '0.08em',
          color: loopIn !== null ? C.blue : C.silverDark,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
          transition: 'all 0.15s',
        }}>
          <span>IN</span>
          {loopIn !== null && <span style={{ fontFamily: 'monospace', fontSize: '0.22rem', opacity: 0.7 }}>{fmtSecLabel(loopIn)}</span>}
        </button>

        {/* LOOP OUT */}
        <button onClick={onLoopOut} style={{
          padding: '4px 8px', borderRadius: 4, cursor: 'pointer',
          background: loopActive ? 'rgba(255,155,94,0.08)' : '#14181e',
          border: `1px solid ${loopActive ? 'rgba(255,155,94,0.45)' : 'rgba(170,179,187,0.22)'}`,
          boxShadow: loopActive ? '0 0 6px rgba(255,155,94,0.2)' : 'inset 0 2px 4px rgba(0,0,0,0.5)',
          fontFamily: 'monospace', fontSize: '0.44rem', fontWeight: 600, letterSpacing: '0.08em',
          color: loopActive ? C.orange : loopIn !== null ? C.silver : C.silverDark,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
          transition: 'all 0.15s', opacity: loopIn === null ? 0.4 : 1,
        }}>
          <span>OUT</span>
          {loopOut !== null && loopActive && <span style={{ fontFamily: 'monospace', fontSize: '0.22rem', opacity: 0.7 }}>{fmtSecLabel(loopOut)}</span>}
        </button>

        {/* Loop size selector */}
        <div style={{ display: 'flex', gap: 2 }}>
          {loopSizes.map(s => (
            <button
              key={s}
              onClick={() => onLoopBars(s)}
              disabled={!loopBarsEnabled}
              title={loopBarsEnabled ? `loop ${s} bars from playhead` : 'needs BPM — v2 beat detection'}
              style={{
              width: 26, height: 22, borderRadius: 3, cursor: loopBarsEnabled ? 'pointer' : 'not-allowed',
              background: loopBars === s ? (loopActive ? 'rgba(255,155,94,0.12)' : 'rgba(125,183,255,0.1)') : '#14181e',
              border: `1px solid ${loopBars === s ? (loopActive ? 'rgba(255,155,94,0.4)' : 'rgba(125,183,255,0.4)') : 'rgba(170,179,187,0.15)'}`,
              fontFamily: 'monospace', fontSize: '0.34rem', fontWeight: 600,
              color: loopBars === s ? (loopActive ? C.orange : C.blue) : C.silverDark,
              transition: 'all 0.1s', opacity: loopBarsEnabled ? 1 : 0.35,
            }}>
              {s}
            </button>
          ))}
        </div>

        {/* EXIT LOOP */}
        {loopActive && (
          <button onClick={onLoopExit} style={{
            padding: '4px 7px', borderRadius: 4, cursor: 'pointer',
            background: 'rgba(255,155,94,0.08)',
            border: '1px solid rgba(255,155,94,0.4)',
            fontFamily: 'monospace', fontSize: '0.40rem', fontWeight: 600,
            letterSpacing: '0.08em', color: C.orange,
          }}>EXIT</button>
        )}
      </div>

      {/* Marks — numbered pads, teal/orange family, not rainbow CDJ letters */}
      <div style={{
        background: C.bg, borderRadius: 6, padding: '7px 8px',
        border: '1px solid rgba(170,179,187,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.38rem', letterSpacing: '0.35em', color: 'rgba(255,255,255,0.2)' }}>
            MARKS
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.32rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.12)' }}>
            {side === 'left' ? 'DECK A' : 'DECK B'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
          {hotCues.map((stored, i) => {
            const hasPos = stored != null;
            return (
              <button
                key={i}
                onPointerDown={(e) => onHotCue(i, e.altKey || e.metaKey)}
                title={hasPos ? `Jump to mark ${i + 1} (${fmtSecLabel(stored)}). Alt-click to clear.` : `Set mark ${i + 1} at playhead`}
                style={{
                  height: hasPos ? 38 : 32, borderRadius: 4, cursor: 'pointer',
                  background: hasPos ? `${mark}18` : '#14181e',
                  border: `1px solid ${hasPos ? `${mark}80` : 'rgba(170,179,187,0.18)'}`,
                  boxShadow: hasPos
                    ? `0 0 8px ${mark}40`
                    : 'inset 0 2px 4px rgba(0,0,0,0.5)',
                  position: 'relative',
                  transition: 'all 0.08s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                  paddingTop: 6,
                }}
              >
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: hasPos ? mark : 'rgba(255,255,255,0.08)',
                  boxShadow: hasPos ? `0 0 6px ${mark}` : 'none',
                  transition: 'all 0.1s', flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: 'monospace', fontSize: '0.28rem', fontWeight: 700,
                  color: hasPos ? mark : 'rgba(255,255,255,0.15)',
                  letterSpacing: '0.05em',
                }}>
                  {i + 1}
                </span>
                {hasPos && (
                  <span style={{
                    fontFamily: 'monospace', fontSize: '0.22rem',
                    color: mark, opacity: 0.8,
                    letterSpacing: '0.02em',
                  }}>
                    {fmtSecLabel(stored ?? 0)}
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
function MixerPanel({ xfade, onXfade, isMobile, eqA, eqB, onEq, filterA, filterB, onFilter,
  faderA, faderB, onFader, master, onMaster, vuA, vuB, vuM }: {
  xfade: number; onXfade(v: number): void; isMobile?: boolean;
  eqA: { lo: number; mid: number; hi: number };
  eqB: { lo: number; mid: number; hi: number };
  onEq(id: 'A' | 'B', band: 'lo' | 'mid' | 'hi', v: number): void;
  filterA: number; filterB: number; onFilter(id: 'A' | 'B', v: number): void;
  faderA: number; faderB: number; onFader(id: 'A' | 'B', v: number): void;
  master: number; onMaster(v: number): void;
  vuA: number; vuB: number; vuM: number;
}) {

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

      {/* Send / phones — labeled v2, no DJM effect-name row */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {(['SEND v2', 'PHONES v2'] as const).map((label) => (
            <button
              key={label}
              disabled
              title="not in the audio graph yet"
              style={{
                flex: 1, padding: '4px 0', borderRadius: 3, cursor: 'not-allowed',
                background: '#14181e',
                border: '1px solid rgba(170,179,187,0.18)',
                fontFamily: 'monospace', fontSize: '0.28rem', fontWeight: 600, letterSpacing: '0.1em',
                color: C.silverDark, opacity: 0.45,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.05)' }} />

      {/* ── Channel EQ A | B ── */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.28rem', letterSpacing: '0.4em', color: 'rgba(255,255,248,0.2)', textAlign: 'center' }}>EQ</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {(['A', 'B'] as const).map((id) => {
            const eq = id === 'A' ? eqA : eqB;
            return (
              <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.26rem', color: id === 'A' ? C.cyan : C.orange }}>{id}</span>
                {(['hi', 'mid', 'lo'] as const).map((band) => (
                  <EQKnob
                    key={band}
                    label={band.toUpperCase()}
                    value={eq[band]}
                    size={isMobile ? 22 : 20}
                    color={band === 'hi' ? '#38bdf8' : band === 'mid' ? '#a3e635' : '#f97316'}
                    onChange={(v) => onEq(id, band, v)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.05)' }} />

      {/* ── Filter knobs A / B ── */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-around' }}>
        {([['A', filterA, C.cyan], ['B', filterB, C.orange]] as const).map(([lbl, val, col]) => (
          <div key={lbl} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <EQKnob label="FILTER" value={val} size={20} color={col}
              onChange={v => onFilter(lbl, v)} />
            <span style={{ fontFamily: 'monospace', fontSize: '0.28rem', color: col, letterSpacing: '0.1em' }}>{lbl}</span>
          </div>
        ))}
      </div>

      <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.05)' }} />

      {/* ── Channel faders ── */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-around', gap: 6 }}>
        {([['A', faderA, C.cyan, vuA], ['B', faderB, C.orange, vuB]] as const).map(([lbl, val, col, vu]) => (
          <div key={lbl} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <VU level={vu} />
            <input
              data-testid={lbl === 'A' ? 'dj-fader-a' : 'dj-fader-b'}
              type="range" min={0} max={100} value={val}
              onChange={e => onFader(lbl, +e.target.value)}
              style={{ writingMode: 'vertical-lr', direction: 'rtl', height: 64, width: 22, cursor: 'pointer', accentColor: col }}
            />
            <span style={{ fontFamily: 'monospace', fontSize: '0.26rem', color: col }}>{lbl}</span>
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
          background: `linear-gradient(to right, rgba(0,168,157,0.18), rgba(18,22,27,0.9) 50%, rgba(255,155,94,0.15))`,
          border: '1px solid rgba(170,179,187,0.15)',
          boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.7)',
        }}>
          <input data-testid="dj-xfade" type="range" min={0} max={100} value={xfade} onChange={e => onXfade(+e.target.value)}
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
          <span style={{ fontFamily: 'monospace', fontSize: '0.32rem', fontWeight: 700, color: C.cyan, letterSpacing: '0.1em', textShadow: '0 0 6px rgba(0,168,157,0.45)' }}>A</span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.32rem', fontWeight: 700, color: C.orange, letterSpacing: '0.1em' }}>B</span>
        </div>
      </div>

      {/* ── Master ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <VU level={vuM} />
        <EQKnob label="MASTER" value={master} size={28} color="#22c55e" onChange={onMaster} />
      </div>

    </div>
  );
}

/* ─── EQ Knob (interactive rotary) ──────────────────────── */
function EQKnob({ label, value, size, color, onChange }: {
  label: string; value: number; size: number; color: string; onChange?: (v: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [dragVal, setDragVal] = useState(value);
  const startY = useRef(0);
  const startVal = useRef(0);
  const localVal = dragging ? dragVal : value;

  // Angle: 0% = -135deg, 50% = 0deg, 100% = +135deg
  const angle = -135 + (localVal / 100) * 270;
  const isCenter = Math.abs(localVal - 50) < 3;

  function onPointerDown(e: React.PointerEvent) {
    if (!onChange) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    startY.current = e.clientY;
    startVal.current = value;
    setDragVal(value);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !onChange) return;
    const delta = (startY.current - e.clientY) * 0.8;
    const next = Math.max(0, Math.min(100, startVal.current + delta));
    setDragVal(next);
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
  const [hov = false, setHov] = useState<boolean>(false);
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

function VU({ level }: { level: number }) {
  const n = Math.min(1, level * 3.6);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 22 }}>
      {[0.35, 0.65, 1, 0.75, 0.45].map((h, i) => {
        const on = n > i * 0.16;
        return (
        <div key={i} style={{
          width: 3, borderRadius: 1,
          height: on ? h * 22 * Math.max(0.25, n) : 2,
          background: i < 2 ? C.green : i === 2 ? '#a3e635' : i === 3 ? C.orange : '#ef4444',
          boxShadow: on && i >= 3 ? `0 0 4px ${i === 4 ? '#ef4444' : C.orange}` : 'none',
          transition: `height ${0.08 + i * 0.05}s ease`,
        }} />
        );
      })}
    </div>
  );
}

function EngineStatus({ ready, a, b, recording, exportReady }: {
  ready: boolean; a: boolean; b: boolean; recording: boolean; exportReady: boolean;
}) {
  const bits: Array<[string, boolean]> = [
    ['audio ready', ready],
    ['deck A loaded', a],
    ['deck B loaded', b],
    ['recording', recording],
    ['export ready', exportReady],
  ];
  return (
    <p
      data-testid="dj-engine-status"
      data-ready={ready ? 'true' : 'false'}
      data-deck-a={a ? 'true' : 'false'}
      data-deck-b={b ? 'true' : 'false'}
      data-recording={recording ? 'true' : 'false'}
      data-export-ready={exportReady ? 'true' : 'false'}
      style={{
        margin: '0 0 8px',
        fontFamily: 'monospace',
        fontSize: '0.32rem',
        letterSpacing: '0.08em',
        color: C.dim,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
      }}
    >
      {bits.map(([label, on]) => (
        <span key={label} style={{ color: on ? C.cyan : C.dim }}>
          {on ? '●' : '○'} {label}
        </span>
      ))}
    </p>
  );
}
