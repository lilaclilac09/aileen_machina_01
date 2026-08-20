'use client';
import { useState, useRef, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import TrackLibraryBrowser from './TrackLibraryBrowser';
import DJDeckWaveform from './DJDeckWaveform';
import DJFader from './DJFader';
import DJKnob from './DJKnob';
import DJMixBooth from './DJMixBooth';
import DJPairPanel from './DJPairPanel';
import SpotifySearchAdd from './SpotifySearchAdd';
import { shortMixError } from './SystemToast';
import { allDeckTracks, type DeckTrack } from '../lib/djSetlist';
import { useDjMixer } from '../lib/useDjMixer';
import { fmtMs } from '../lib/djMixerMath';
import {
  isLikelyUnsupportedAudio,
  isMixableTrack,
  isSupportedMixFile,
  MIX_FILE_ACCEPT,
  trackAudioSrc,
} from '../lib/djMixable';
import {
  getSpotifyCarouselServerSnapshot,
  getSpotifyCarouselSnapshot,
  parseStoredSpotifyTracks,
  readStoredSpotifyTracks,
  searchHitToDeckTrack,
  subscribeSpotifyCarousel,
  writeStoredSpotifyTracks,
} from '../lib/spotifyCarouselStore';
import { isSpotifyDuplicate } from '../lib/spotifySearchShared';
import type { SpotifySearchTrack } from '../lib/spotifySearchShared';

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
const CATALOGUE = allDeckTracks();
type Track = DeckTrack;

function spotifyTrackId(track: Track): string | null {
  if (track.spotifyId) return track.spotifyId;
  if (/^[a-zA-Z0-9]{22}$/.test(track.id)) return track.id;
  return null;
}

function findTrackById(list: Track[], id: string | null | undefined): Track | null {
  if (!id) return null;
  return list.find((t) => t.id === id || t.spotifyId === id) ?? null;
}

const DJ_AUDIT = '[dj-audit]';

const INITIAL_LEFT: Track | null = null;
const INITIAL_RIGHT: Track | null = null;

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
  const [deckHint, setDeckHint] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(CATALOGUE[0] ?? null);
  const [focusTrackId, setFocusTrackId] = useState<string | null>(null);
  const extrasRaw = useSyncExternalStore(
    subscribeSpotifyCarousel,
    getSpotifyCarouselSnapshot,
    getSpotifyCarouselServerSnapshot,
  );
  const spotifyExtras = useMemo(() => parseStoredSpotifyTracks(extrasRaw), [extrasRaw]);
  const library = useMemo(() => [...CATALOGUE, ...spotifyExtras], [spotifyExtras]);
  const libraryRef = useRef(library);
  useEffect(() => {
    libraryRef.current = library;
  }, [library]);
  const existingSpotifyIds = useMemo(() => {
    const ids = new Set<string>();
    for (const t of library) {
      ids.add(t.id.toLowerCase());
      if (t.spotifyId) ids.add(t.spotifyId.toLowerCase());
    }
    return ids;
  }, [library]);

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
    hintTimer.current = setTimeout(() => setDeckHint(null), 2800);
  }, []);

  useEffect(() => () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
  }, []);

  useEffect(() => {
    const sample = CATALOGUE.slice(0, 3).map((t) => ({
      id: t.id,
      title: t.title,
      thumb: !!t.thumb,
      bpm: t.bpm,
      key: t.key,
      dur: t.dur,
      playable: isMixableTrack(t),
    }));
    console.log(DJ_AUDIT, 'carousel state after catalogue bind', {
      count: CATALOGUE.length,
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
      }, () => {});
      mountSide(api, 'right', rightContainerRef.current, INITIAL_RIGHT, rightCtrl, () => {
        /* Spotify iframe is preview-only — not part of the mix graph */
      }, () => {});
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

  const selectCarouselTrack = useCallback((track: Track) => {
    setSelectedTrack(track);
    dragTrack.current = track;
  }, []);

  const loadTrackToDeck = useCallback(async (track: Track, deckId: 'A' | 'B' | 'left' | 'right') => {
    selectCarouselTrack(track);
    const side: 'left' | 'right' = deckId === 'B' || deckId === 'right' ? 'right' : 'left';
    const src = trackAudioSrc(track);
    console.log(DJ_AUDIT, 'loadTrackToDeck', {
      side,
      id: track.id,
      title: track.title,
      mixable: isMixableTrack(track),
      audioSrc: src,
      source: track.source ?? 'external',
    });

    if (!isMixableTrack(track)) {
      showDeckHint('Not mixable.');
      return;
    }
    if (!src) {
      showDeckHint('No audio.');
      return;
    }

    if (side === 'left') setLeftTrack(track);
    else setRightTrack(track);

    const ok = await mix.loadUrl(side, src, {
      title: track.title,
      bpm: track.bpm,
      key: track.key,
    });
    if (ok) showDeckHint(side === 'left' ? 'Loaded A.' : 'Loaded B.');
    else showDeckHint('Load failed.');
  }, [mix, selectCarouselTrack, showDeckHint]);

  const loadSelectedToDeck = useCallback((deckId: 'A' | 'B') => {
    if (!selectedTrack) {
      showDeckHint('Select track.');
      return;
    }
    void loadTrackToDeck(selectedTrack, deckId);
  }, [selectedTrack, loadTrackToDeck, showDeckHint]);

  const loadTrack = useCallback((side: 'left' | 'right', track: Track) => {
    selectCarouselTrack(track);
    void loadTrackToDeck(track, side);
  }, [loadTrackToDeck, selectCarouselTrack]);

  const resolveDropTrack = useCallback((e: React.DragEvent, fallback: Track | null): Track | null => {
    if (fallback) return fallback;
    let id = '';
    try {
      id = e.dataTransfer.getData('text/plain') || '';
    } catch {
      id = '';
    }
    const found = findTrackById(libraryRef.current, id);
    console.log(DJ_AUDIT, 'resolveDropTrack', { id, found: found?.id ?? null });
    return found;
  }, []);

  const addSpotifyTrack = useCallback((hit: SpotifySearchTrack): 'added' | 'duplicate' => {
    const current = [...CATALOGUE, ...readStoredSpotifyTracks()];
    if (isSpotifyDuplicate(current, hit.spotifyId)) return 'duplicate';
    const track = searchHitToDeckTrack(hit);
    writeStoredSpotifyTracks([...readStoredSpotifyTracks(), track]);
    setFocusTrackId(track.id);
    selectCarouselTrack(track);
    return 'added';
  }, [selectCarouselTrack]);

  const removeSpotifyTrack = useCallback((id: string) => {
    writeStoredSpotifyTracks(
      readStoredSpotifyTracks().filter((t) => t.id !== id && t.spotifyId !== id),
    );
    setFocusTrackId(null);
  }, []);

  const takeAudioFile = (e: React.DragEvent): File | null => {
    const file = e.dataTransfer.files?.[0];
    if (!file) return null;
    if (isSupportedMixFile(file)) return file;
    return null;
  };

  const assignFile = useCallback(async (side: 'left' | 'right', file: File) => {
    if (!isSupportedMixFile(file)) {
      showDeckHint('Format not supported.');
      return;
    }
    const local: Track = {
      id: side === 'left' ? `local-a-${file.name}` : `local-b-${file.name}`,
      title: file.name.replace(/\.[^.]+$/, ''),
      bpm: 0,
      key: '—',
      dur: 0,
      thumb: '',
      mixable: true,
      source: 'local',
    };
    if (side === 'left') setLeftTrack(local);
    else setRightTrack(local);
    const ok = await mix.loadFile(side, file, { title: local.title });
    if (ok) showDeckHint(side === 'left' ? 'Loaded A.' : 'Loaded B.');
    else showDeckHint('Load failed.');
  }, [mix, showDeckHint]);

  const dropOnDeckA = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.files?.[0];
    if (raw && isLikelyUnsupportedAudio(raw)) {
      showDeckHint('Format not supported.');
      dragTrack.current = null;
      setDropSide(null);
      return;
    }
    const file = takeAudioFile(e);
    if (file) {
      void assignFile('left', file);
      dragTrack.current = null;
      setDropSide(null);
      return;
    }
    const track = resolveDropTrack(e, dragTrack.current);
    console.log(DJ_AUDIT, 'drop target deck', { deck: 'A', trackId: track?.id ?? null });
    if (track) void loadTrackToDeck(track, 'A');
    dragTrack.current = null;
    setDropSide(null);
  }, [loadTrackToDeck, resolveDropTrack, assignFile, showDeckHint]);

  const dropOnDeckB = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.files?.[0];
    if (raw && isLikelyUnsupportedAudio(raw)) {
      showDeckHint('Format not supported.');
      dragTrack.current = null;
      setDropSide(null);
      return;
    }
    const file = takeAudioFile(e);
    if (file) {
      void assignFile('right', file);
      dragTrack.current = null;
      setDropSide(null);
      return;
    }
    const track = resolveDropTrack(e, dragTrack.current);
    console.log(DJ_AUDIT, 'drop target deck', { deck: 'B', trackId: track?.id ?? null });
    if (track) void loadTrackToDeck(track, 'B');
    dragTrack.current = null;
    setDropSide(null);
  }, [loadTrackToDeck, resolveDropTrack, assignFile, showDeckHint]);

  const toggleDeck = useCallback(async (side: 'left' | 'right') => {
    try {
      const started = await mix.toggle(side);
      if (started) {
        setDeckHint(null);
        return;
      }
      showDeckHint('No audio.');
    } catch {
      showDeckHint('Play failed.');
    }
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
    if (!mix.sync('left')) showDeckHint('Needs BPM.');
  }, [mix, showDeckHint]);

  const handleSyncRight = useCallback(() => {
    if (!mix.sync('right')) showDeckHint('Needs BPM.');
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

  const hintText = deckHint || (mix.error ? shortMixError(mix.error) : null);
  const hintOk = !!hintText && /Loaded|Recording|Export ready/i.test(hintText);
  const hintWarn = !!hintText && /Select track|Need two/i.test(hintText);
  const hintColor = hintOk ? C.cyan : hintWarn ? '#f5a524' : '#ef4444';

  return (
    <div
      data-testid="dj-station"
      data-dj-layout={isMobile ? 'mobile' : 'desktop'}
      data-selected-id={selectedTrack?.id ?? ''}
      data-selected-mixable={selectedTrack && isMixableTrack(selectedTrack) ? 'true' : 'false'}
      style={{ position: 'relative', userSelect: 'none', width: '100%', maxWidth: '100%', boxSizing: 'border-box', background: '#0b0d10', overflowX: 'clip' }}
    >
      <input
        ref={fileARef}
        data-testid="dj-upload-a"
        type="file"
        accept={MIX_FILE_ACCEPT}
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
        accept={MIX_FILE_ACCEPT}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void assignFile('right', f);
          e.target.value = '';
        }}
      />

      {/* ── Desk first: decks + mixer ── */}
      <div
        data-testid="dj-desk"
        style={{
        borderRadius: 10, padding: '12px 10px 10px',
        background: C.panel,
        border: '1px solid rgba(170,179,187,0.1)',
        boxShadow: 'inset 0 1px 0 rgba(217,224,230,0.04)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, flexWrap: 'wrap', paddingBottom: 8, marginBottom: 8,
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: 15, letterSpacing: '0.08em', color: C.text, textTransform: 'uppercase' }}>
            Deck A · Mix · Deck B
          </span>
          {bpmHint && (
            <span style={{
              fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.06em',
              color: bpmHint.type === 'sync' ? C.green : C.orange,
              textTransform: 'uppercase',
              padding: '2px 6px', borderRadius: 3,
            }}>
              {bpmHint.type === 'sync' ? 'SYNC' : `${bpmHint.diff > 0 ? '+' : ''}${bpmHint.diff.toFixed(1)} BPM`}
            </span>
          )}
          <span style={{ fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.04em', color: C.sub }}>
            {leftBpm ?? '--'} / {rightBpm ?? '--'} BPM
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <EngineStatus
          ready={mix.ready}
          a={mix.deckA.mixLoaded}
          b={mix.deckB.mixLoaded}
          playingA={mix.deckA.playing}
          playingB={mix.deckB.playing}
          recording={mix.recording}
          exportReady={mix.exportReady}
          error={Boolean(mix.error) && !deckHint}
          vuA={mix.vuA}
          vuB={mix.vuB}
          vuM={mix.vuM}
        />
        {hintText && (
            <span
              data-testid="dj-deck-hint"
              data-hint={hintText}
              role={hintOk || hintWarn ? 'status' : 'alert'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'monospace',
                fontSize: 12,
                letterSpacing: '0.02em',
                color: hintColor,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: hintColor,
                  boxShadow: `0 0 6px ${hintColor}`,
                  flexShrink: 0,
                }}
              />
              ⚡ {hintText}
            </span>
        )}
        </div>
        {/* Deck + Mixer grid */}
        {isMobile ? (
          <div className="dj-mixer-grid" style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 12 }}>
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
              onLoadSelected={() => loadSelectedToDeck('A')}
              onUpload={() => fileARef.current?.click()}
              onLoopIn={() => mix.loopIn('left')}
              onLoopOut={() => mix.loopOut('left')}
              onLoopBars={n => { if (!mix.loopBars('left', n)) showDeckHint('Needs BPM.'); }}
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
              onLoadSelected={() => loadSelectedToDeck('B')}
              onUpload={() => fileBRef.current?.click()}
              onLoopIn={() => mix.loopIn('right')}
              onLoopOut={() => mix.loopOut('right')}
              onLoopBars={n => { if (!mix.loopBars('right', n)) showDeckHint('Needs BPM.'); }}
              onLoopExit={() => mix.loopExit('right')}
              onHotCue={(i, clear) => mix.hotCue('right', i, clear)}
              onSync={handleSyncRight}
            />
          </div>
        ) : (
          <div className="dj-mixer-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', gap: 8, marginBottom: 10 }}>
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
              onLoadSelected={() => loadSelectedToDeck('A')}
              onUpload={() => fileARef.current?.click()}
              onLoopIn={() => mix.loopIn('left')}
              onLoopOut={() => mix.loopOut('left')}
              onLoopBars={n => { if (!mix.loopBars('left', n)) showDeckHint('Needs BPM.'); }}
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
              onLoadSelected={() => loadSelectedToDeck('B')}
              onUpload={() => fileBRef.current?.click()}
              onLoopIn={() => mix.loopIn('right')}
              onLoopOut={() => mix.loopOut('right')}
              onLoopBars={n => { if (!mix.loopBars('right', n)) showDeckHint('Needs BPM.'); }}
              onLoopExit={() => mix.loopExit('right')}
              onHotCue={(i, clear) => mix.hotCue('right', i, clear)}
              onSync={handleSyncRight}
            />
          </div>
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
            if (ok) showDeckHint('Recording.');
            else showDeckHint('Load audio first.');
          });
        }}
        onStop={() => {
          void mix.stopRecord().then(() => {
            showDeckHint('Export ready.');
          });
        }}
        onDownloadAudio={mix.downloadAudio}
        onDownloadMeta={mix.downloadMeta}
        onCopyReceipt={() => void mix.copyReceiptText()}
        onLoadUrl={(side, url) => {
          void mix.loadUrl(side, url).then((ok) => {
            if (ok) showDeckHint(side === 'left' ? 'Loaded A.' : 'Loaded B.');
            else showDeckHint('Load failed.');
          });
        }}
      />

      <div id="dj-set" data-testid="dj-set" style={{ marginTop: 16, marginBottom: 10 }}>
        <TrackLibraryBrowser
          tracks={library}
          reverseCarousel={false}
          selectedTrackId={selectedTrack?.id ?? null}
          onSelectTrack={selectCarouselTrack}
          focusTrackId={focusTrackId}
          onRemoveTrack={removeSpotifyTrack}
          onLoadTrack={loadTrack}
          onSetDragTrack={(t) => {
            dragTrack.current = t;
            selectCarouselTrack(t);
            console.log(DJ_AUDIT, 'drag start track id', t?.id ?? null, t?.title ?? null);
          }}
          playingLeft={leftPlaying ? (leftTrack?.id ?? mix.deckA.fileName) : null}
          playingRight={rightPlaying ? (rightTrack?.id ?? mix.deckB.fileName) : null}
          leftPos={leftPos} leftDur={leftDur}
          rightPos={rightPos} rightDur={rightDur}
        />
        <SpotifySearchAdd existingIds={existingSpotifyIds} onAdd={addSpotifyTrack} />
      </div>
      <DJPairPanel
        selected={selectedTrack}
        library={library}
        onLoadB={(id) => {
          const t = findTrackById(library, id);
          if (!t) return;
          void loadTrackToDeck(t, 'B');
        }}
      />

      <div
        data-testid="dj-spotify-embeds"
        aria-hidden
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          pointerEvents: 'none',
        }}
      >
        {(['left', 'right'] as const).map((side) => {
          const ref = side === 'left' ? leftContainerRef : rightContainerRef;
          return (
            <div key={side} style={{ minHeight: 80, width: 320 }}>
              <div ref={ref} style={{ minHeight: 80, width: '100%' }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Deck Panel ─────────────────────────────────────────── */
function DeckPanel({ side, track, playing, pos, dur, pitch, dim, dropActive, isMobile, synced,
  mixLoaded, peaks, gain, vu, cueMs, loopActive, loopIn, loopOut, loopBars, hotCues,
  syncEnabled, loopBarsEnabled,
  onDragOver, onDragLeave, onDrop, onToggle, onPitch, onGain, onSeek, onCue, onLoadSelected, onUpload,
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
  onSeek(sec: number): void; onCue(): void; onLoadSelected(): void; onUpload(): void;
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

  // Platter is a display (spin when playing). Scratch is v2 — not in the audio graph.
  const discRef = useRef<HTMLDivElement>(null);

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
          <p style={{ fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: dropActive ? 'rgba(100,220,210,0.8)' : C.sub }}>
            {dropActive ? 'Drop' : 'Load'}
          </p>
        ) : (
          <div style={{ position: 'relative', width: D, height: D }}>

            {/* Disc body — AT-style glowing translucent platter */}
            <div
              ref={discRef}
              title="visual platter · scratch v2"
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
              animation: playing ? 'turntableSpin 2.4s linear infinite' : 'none',
              transition: 'box-shadow 1.8s ease',
              pointerEvents: 'none',
              cursor: 'default',
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
          style={{ fontSize: 16, letterSpacing: '0.04em',
          color: playing ? C.cyan : C.text,
          fontFamily: 'monospace', textTransform: 'uppercase',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          transition: 'color 0.5s', flex: 1, margin: 0,
        }}>{track?.title ?? 'NO TRACK'}</p>
        </div>
        <DJDeckWaveform
          side={side}
          peaks={peaks}
          pos={pos / 1000}
          dur={dur / 1000}
          onSeek={onSeek}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            data-testid={side === 'left' ? 'dj-load-selected-a' : 'dj-load-selected-b'}
            onClick={onLoadSelected}
            style={{
              padding: '10px 14px',
              minHeight: 44,
              borderRadius: 4,
              cursor: 'pointer',
              background: '#14181e',
              border: '1px solid rgba(0,168,157,0.45)',
              color: C.cyan,
              fontFamily: 'monospace',
              fontSize: 14,
              letterSpacing: '0.06em',
            }}
          >
            {side === 'left' ? 'Load A' : 'Load B'}
          </button>
          <button
            type="button"
            data-testid={side === 'left' ? 'dj-load-file-a' : 'dj-load-file-b'}
            onClick={onUpload}
            style={{
              padding: '10px 12px',
              minHeight: 44,
              borderRadius: 4,
              cursor: 'pointer',
              background: 'transparent',
              border: '1px solid rgba(170,179,187,0.22)',
              color: C.sub,
              fontFamily: 'monospace',
              fontSize: 13,
              letterSpacing: '0.04em',
            }}
          >
            Upload
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 13, color: C.cyan, letterSpacing: '0.04em' }}>
            {elapsed}
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 13, color: C.sub, letterSpacing: '0.04em' }}>
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
            className="dj-tap"
            data-testid={side === 'left' ? 'dj-play-a' : 'dj-play-b'}
            onClick={onToggle}
            aria-label={playing ? 'Pause' : 'Play'}
            style={{
            width: isMobile ? 48 : 38, height: isMobile ? 48 : 38, borderRadius: '50%', cursor: 'pointer',
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
            className="dj-tap"
            title={playing ? 'return to cue and pause' : 'set cue at playhead'}
            onClick={onCue}
            aria-label="Cue"
            style={{
            width: isMobile ? 48 : 38, height: isMobile ? 48 : 38, borderRadius: '50%', cursor: 'pointer',
            background: cueMs > 0 ? 'rgba(125,183,255,0.1)' : '#14181e',
            border: `1px solid ${cueMs > 0 ? 'rgba(125,183,255,0.55)' : 'rgba(170,179,187,0.22)'}`,
            boxShadow: cueMs > 0 ? '0 0 8px rgba(125,183,255,0.25)' : 'inset 0 2px 5px rgba(0,0,0,0.4)',
            color: cueMs > 0 ? C.blue : C.silverDark, fontSize: isMobile ? '0.42rem' : '0.28rem', letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1,
            transition: 'all 0.15s',
          }}>
            <span style={{ fontFamily: 'monospace' }}>CUE</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.22rem', opacity: 0.7 }}>{fmt(cueMs)}</span>
          </button>
        </div>
        <DJFader
          testId={side === 'left' ? 'dj-pitch-a' : 'dj-pitch-b'}
          label="PITCH"
          ariaLabel={side === 'left' ? 'Pitch A' : 'Pitch B'}
          value={pitch}
          min={-8}
          max={8}
          step={0.1}
          defaultValue={0}
          onChange={onPitch}
          orientation="vertical"
          length={78}
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <VU level={vu} />
          <DJKnob
            testId={side === 'left' ? 'dj-knob-gain-a' : 'dj-knob-gain-b'}
            label="GAIN"
            ariaLabel={side === 'left' ? 'Gain A' : 'Gain B'}
            value={gain}
            size={22}
            color={C.cyan}
            defaultValue={75}
            onChange={onGain}
            tapMin={isMobile ? 44 : 0}
          />
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
          className="dj-tap"
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
        <button className="dj-tap" onClick={onLoopIn} style={{
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
        <button className="dj-tap" onClick={onLoopOut} style={{
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
              className="dj-tap"
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
    <div
      data-testid="dj-mixer"
      data-xfade={String(Math.round(xfade))}
      data-master={String(Math.round(master))}
      data-fader-a={String(Math.round(faderA))}
      data-fader-b={String(Math.round(faderB))}
      data-eq-a-hi={String(Math.round(eqA.hi))}
      data-eq-a-mid={String(Math.round(eqA.mid))}
      data-eq-a-lo={String(Math.round(eqA.lo))}
      data-eq-b-hi={String(Math.round(eqB.hi))}
      data-eq-b-mid={String(Math.round(eqB.mid))}
      data-eq-b-lo={String(Math.round(eqB.lo))}
      data-filter-a={String(Math.round(filterA))}
      data-filter-b={String(Math.round(filterB))}
      style={{
      borderRadius: 6, padding: isMobile ? '8px 14px' : '8px 7px',
      background: 'linear-gradient(to bottom, #1a1e24, #14181d 55%, #1a1e24)',
      border: '1px solid rgba(170,179,187,0.22)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: isMobile ? 12 : 8,
      width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box',
      boxShadow: 'inset 0 1px 0 rgba(217,224,230,0.07), inset 0 -1px 0 rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.3)',
    }}>

      <span style={{ fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.14em', color: C.text }}>
        Mix
      </span>
      <div style={{ width: '100%', display: 'flex', gap: 4 }}>
        {(['SEND v2', 'PHONES v2'] as const).map((label) => (
          <button
            key={label}
            disabled
            title="not in the audio graph yet"
            style={{
              flex: 1, padding: '6px 0', borderRadius: 3, cursor: 'not-allowed',
              background: '#14181e',
              border: '1px solid rgba(170,179,187,0.18)',
              fontFamily: 'monospace', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
              color: C.silverDark, opacity: 0.45,
            }}
          >
            {label}
          </button>
        ))}
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
                  <DJKnob
                    key={band}
                    testId={`dj-knob-eq-${id.toLowerCase()}-${band}`}
                    label={band.toUpperCase()}
                    ariaLabel={`EQ ${id} ${band.toUpperCase()}`}
                    value={eq[band]}
                    size={isMobile ? 22 : 20}
                    color={band === 'hi' ? '#38bdf8' : band === 'mid' ? '#a3e635' : '#f97316'}
                    defaultValue={50}
                    onChange={(v) => onEq(id, band, v)}
                    tapMin={isMobile ? 44 : 0}
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
            <DJKnob
              testId={`dj-knob-filter-${lbl.toLowerCase()}`}
              label="FILTER"
              ariaLabel={`Filter ${lbl}`}
              value={val}
              size={20}
              color={col}
              defaultValue={50}
              onChange={(v) => onFilter(lbl, v)}
              tapMin={isMobile ? 44 : 0}
            />
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
            <DJFader
              testId={lbl === 'A' ? 'dj-fader-a' : 'dj-fader-b'}
              label={lbl}
              ariaLabel={`Channel ${lbl}`}
              value={val}
              defaultValue={80}
              onChange={(v) => onFader(lbl, v)}
              orientation="vertical"
              color={col}
              length={64}
              showLabel={false}
            />
            <span style={{ fontFamily: 'monospace', fontSize: '0.26rem', color: col }}>{lbl}</span>
          </div>
        ))}
      </div>

      <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.05)' }} />

      {/* ── Crossfader ── */}
      <div style={{ width: '100%', padding: '8px 0 6px', boxSizing: 'border-box' }}>
        <DJFader
          testId="dj-xfade"
          label="CROSSFADER"
          ariaLabel="Crossfader"
          value={xfade}
          defaultValue={50}
          onChange={onXfade}
          orientation="horizontal"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.32rem', fontWeight: 700, color: C.cyan, letterSpacing: '0.1em', textShadow: '0 0 6px rgba(0,168,157,0.45)' }}>A</span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.32rem', fontWeight: 700, color: C.orange, letterSpacing: '0.1em' }}>B</span>
        </div>
      </div>

      {/* ── Master ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <VU level={vuM} />
        <DJKnob
          testId="dj-knob-master"
          label="MASTER"
          ariaLabel="Master"
          value={master}
          size={28}
          color="#22c55e"
          defaultValue={75}
          onChange={onMaster}
          tapMin={isMobile ? 44 : 0}
        />
      </div>

    </div>
  );
}

/* ─── Atoms ──────────────────────────────────────────────── */
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

function EngineStatus({ ready, a, b, playingA, playingB, recording, exportReady, error, vuA, vuB, vuM }: {
  ready: boolean; a: boolean; b: boolean; playingA: boolean; playingB: boolean;
  recording: boolean; exportReady: boolean; error: boolean; vuA: number; vuB: number; vuM: number;
}) {
  const leds: Array<{ title: string; on: boolean; tone: 'teal' | 'amber' | 'red' }> = [
    { title: 'Ready', on: ready && !error, tone: 'teal' },
    { title: 'A loaded', on: a, tone: 'teal' },
    { title: 'B loaded', on: b, tone: 'teal' },
    { title: 'A playing', on: playingA, tone: 'teal' },
    { title: 'B playing', on: playingB, tone: 'teal' },
    { title: 'Recording', on: recording, tone: 'amber' },
    { title: 'Export ready', on: exportReady, tone: 'teal' },
    { title: 'Error', on: error, tone: 'red' },
  ];
  return (
    <div
      data-testid="dj-engine-status"
      role="status"
      aria-label="Mixer status"
      data-ready={ready ? 'true' : 'false'}
      data-deck-a={a ? 'true' : 'false'}
      data-deck-b={b ? 'true' : 'false'}
      data-playing-a={playingA ? 'true' : 'false'}
      data-playing-b={playingB ? 'true' : 'false'}
      data-recording={recording ? 'true' : 'false'}
      data-export-ready={exportReady ? 'true' : 'false'}
      data-error={error ? 'true' : 'false'}
      data-vu-a={String(Math.round(vuA * 1000))}
      data-vu-b={String(Math.round(vuB * 1000))}
      data-vu-m={String(Math.round(vuM * 1000))}
      style={{
        margin: '0 0 10px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {leds.map((led) => {
        const color = led.tone === 'teal' ? C.cyan : led.tone === 'amber' ? '#f5a524' : '#ef4444';
        const idle = 'rgba(255,253,248,0.16)';
        return (
          <span
            key={led.title}
            title={led.title}
            aria-label={`${led.title} ${led.on ? 'on' : 'off'}`}
            data-led={led.title}
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: led.on ? color : idle,
                boxShadow: led.on ? `0 0 7px ${color}` : 'inset 0 0 0 1px rgba(255,253,248,0.12)',
              }}
            />
          </span>
        );
      })}
    </div>
  );
}
