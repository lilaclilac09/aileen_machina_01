'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { DjMixerEngine, exportExtension, type DeckId } from './djMixerEngine';
import { buildMixReceipt, receiptToJson, receiptToText, type MixReceipt, type MixTrackInfo } from './djMixReceipt';
import { syncPitchPct } from './djMixerMath';

export type EqBand = { lo: number; mid: number; hi: number };

export type DeckUi = {
  mixLoaded: boolean;
  playing: boolean;
  pos: number;
  dur: number;
  peaks: number[] | null;
  fileName: string | null;
  title: string | null;
  bpm: number | null;
  key: string | null;
  cue: number;
  hotCues: Array<number | null>;
  loopIn: number | null;
  loopOut: number | null;
  loopBars: number | null;
  loopActive: boolean;
  pitch: number;
  gain: number;
};

const emptyDeck = (): DeckUi => ({
  mixLoaded: false,
  playing: false,
  pos: 0,
  dur: 0,
  peaks: null,
  fileName: null,
  title: null,
  bpm: null,
  key: null,
  cue: 0,
  hotCues: Array.from({ length: 8 }, () => null),
  loopIn: null,
  loopOut: null,
  loopActive: false,
  loopBars: null,
  pitch: 0,
  gain: 75,
});

function sideToId(side: 'left' | 'right'): DeckId {
  return side === 'left' ? 'A' : 'B';
}

export function useDjMixer() {
  const engineRef = useRef<DjMixerEngine | null>(null);
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [deckA, setDeckA] = useState<DeckUi>(emptyDeck);
  const [deckB, setDeckB] = useState<DeckUi>(emptyDeck);
  const [xfade, setXfade] = useState(50);
  const [faderA, setFaderA] = useState(80);
  const [faderB, setFaderB] = useState(80);
  const [eqA, setEqA] = useState<EqBand>({ lo: 50, mid: 50, hi: 50 });
  const [eqB, setEqB] = useState<EqBand>({ lo: 50, mid: 50, hi: 50 });
  const [filterA, setFilterA] = useState(50);
  const [filterB, setFilterB] = useState(50);
  const [master, setMaster] = useState(75);
  const [vuA, setVuA] = useState(0);
  const [vuB, setVuB] = useState(0);
  const [vuM, setVuM] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const [exportBlob, setExportBlob] = useState<Blob | null>(null);
  const [exportMime, setExportMime] = useState('audio/webm');
  const [receipt, setReceipt] = useState<MixReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastXfadeLog = useRef(50);

  const setDeck = (id: DeckId, patch: Partial<DeckUi> | ((prev: DeckUi) => DeckUi)) => {
    const apply = typeof patch === 'function' ? patch : (prev: DeckUi) => ({ ...prev, ...patch });
    if (id === 'A') setDeckA(apply);
    else setDeckB(apply);
  };

  useEffect(() => {
    const engine = new DjMixerEngine();
    engineRef.current = engine;
    engine.setFader('A', 80);
    engine.setFader('B', 80);

    let raf = 0;
    const tick = () => {
      const e = engineRef.current;
      if (!e) return;
      const vu = e.vu();
      setVuA(vu.a);
      setVuB(vu.b);
      setVuM(vu.master);
      setDeckA((prev) => {
        if (!prev.mixLoaded) return prev;
        const v = e.voice('A');
        return {
          ...prev,
          playing: v.playing,
          pos: e.position('A'),
          cue: v.cue,
          hotCues: [...v.hotCues],
          loopIn: v.loop.inSec,
          loopOut: v.loop.outSec,
          loopBars: v.loop.bars,
          loopActive: v.loop.active,
        };
      });
      setDeckB((prev) => {
        if (!prev.mixLoaded) return prev;
        const v = e.voice('B');
        return {
          ...prev,
          playing: v.playing,
          pos: e.position('B'),
          cue: v.cue,
          hotCues: [...v.hotCues],
          loopIn: v.loop.inSec,
          loopOut: v.loop.outSec,
          loopBars: v.loop.bars,
          loopActive: v.loop.active,
        };
      });
      if (e.recording) setRecSec(e.recordElapsed());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const ensure = useCallback(async () => {
    const e = engineRef.current;
    if (!e) throw new Error('engine missing');
    await e.resume();
    return e;
  }, []);

  /** Call from Load pointerdown so iOS AudioContext resumes in the user gesture. */
  const unlock = useCallback(() => {
    const e = engineRef.current;
    if (!e) return;
    void e.resume();
  }, []);

  const loadFile = useCallback(
    async (side: 'left' | 'right', file: File, keep?: { title?: string; bpm?: number | null; key?: string | null }) => {
      setError(null);
      try {
        const e = await ensure();
        const id = sideToId(side);
        const { duration } = await e.loadFile(id, file, keep?.title);
        setDeck(id, {
          mixLoaded: true,
          playing: false,
          pos: 0,
          dur: duration,
          peaks: e.voice(id).peaks,
          fileName: file.name,
          title: keep?.title || e.voice(id).title,
          bpm: keep?.bpm ?? null,
          key: keep?.key ?? null,
          cue: 0,
          hotCues: Array.from({ length: 8 }, () => null),
          loopIn: null,
          loopOut: null,
          loopBars: null,
          loopActive: false,
        });
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'decode failed');
        return false;
      }
    },
    [ensure],
  );

  const loadUrl = useCallback(
    async (side: 'left' | 'right', url: string, keep?: { title?: string; bpm?: number | null; key?: string | null }) => {
      setError(null);
      try {
        const e = await ensure();
        const id = sideToId(side);
        const { duration } = await e.loadUrl(id, url, keep?.title);
        setDeck(id, {
          mixLoaded: true,
          playing: false,
          pos: 0,
          dur: duration,
          peaks: e.voice(id).peaks,
          fileName: url,
          title: keep?.title || e.voice(id).title,
          bpm: keep?.bpm ?? null,
          key: keep?.key ?? null,
          cue: 0,
          hotCues: Array.from({ length: 8 }, () => null),
          loopIn: null,
          loopOut: null,
          loopBars: null,
          loopActive: false,
        });
        return true;
      } catch {
        setError('URL blocked or not CORS-safe — download the file and upload it.');
        return false;
      }
    },
    [ensure],
  );

  const setCrateMeta = useCallback((side: 'left' | 'right', meta: { title: string; bpm?: number; key?: string }) => {
    const id = sideToId(side);
    setDeck(id, (prev) => ({
      ...prev,
      title: prev.mixLoaded ? prev.title : meta.title,
      bpm: meta.bpm ?? prev.bpm,
      key: meta.key ?? prev.key,
    }));
  }, []);

  const toggle = useCallback(
    async (side: 'left' | 'right') => {
      const id = sideToId(side);
      const e = await ensure();
      if (!e.isLoaded(id)) return false;
      e.toggle(id);
      return true;
    },
    [ensure],
  );

  const seek = useCallback((side: 'left' | 'right', sec: number) => {
    engineRef.current?.seek(sideToId(side), sec);
  }, []);

  const setCueNow = useCallback((side: 'left' | 'right') => {
    engineRef.current?.setCue(sideToId(side));
  }, []);

  const returnToCue = useCallback((side: 'left' | 'right') => {
    engineRef.current?.returnToCue(sideToId(side));
  }, []);

  const setPitch = useCallback((side: 'left' | 'right', pitch: number) => {
    const id = sideToId(side);
    engineRef.current?.setPitch(id, pitch);
    setDeck(id, { pitch });
  }, []);

  const setGain = useCallback((side: 'left' | 'right', gain: number) => {
    const id = sideToId(side);
    engineRef.current?.setTrim(id, gain);
    setDeck(id, { gain });
  }, []);

  const changeXfade = useCallback((v: number) => {
    setXfade(v);
    const e = engineRef.current;
    if (!e) return;
    e.applyXfade(v);
    if (Math.abs(v - lastXfadeLog.current) >= 20) {
      e.logXfade(v);
      lastXfadeLog.current = v;
    }
  }, []);

  const changeFader = useCallback((id: DeckId, v: number) => {
    engineRef.current?.setFader(id, v);
    if (id === 'A') setFaderA(v);
    else setFaderB(v);
  }, []);

  const changeEq = useCallback((id: DeckId, band: keyof EqBand, v: number) => {
    engineRef.current?.setEq(id, band, v);
    const set = id === 'A' ? setEqA : setEqB;
    set((p) => ({ ...p, [band]: v }));
  }, []);

  const changeFilter = useCallback((id: DeckId, v: number) => {
    engineRef.current?.setFilter(id, v);
    if (id === 'A') setFilterA(v);
    else setFilterB(v);
  }, []);

  const changeMaster = useCallback((v: number) => {
    engineRef.current?.setMaster(v);
    setMaster(v);
  }, []);

  const loopIn = useCallback((side: 'left' | 'right') => {
    engineRef.current?.setLoopIn(sideToId(side));
  }, []);

  const loopOut = useCallback((side: 'left' | 'right') => {
    engineRef.current?.setLoopOut(sideToId(side));
  }, []);

  const loopBars = useCallback((side: 'left' | 'right', bars: number) => {
    const id = sideToId(side);
    const deck = id === 'A' ? deckA : deckB;
    if (!deck.bpm) return false;
    return engineRef.current?.setLoopBars(id, bars, deck.bpm) ?? false;
  }, [deckA, deckB]);

  const loopExit = useCallback((side: 'left' | 'right') => {
    engineRef.current?.clearLoop(sideToId(side));
  }, []);

  const hotCue = useCallback((side: 'left' | 'right', index: number, clear: boolean) => {
    const e = engineRef.current;
    if (!e) return;
    const id = sideToId(side);
    if (clear) {
      e.clearHotCue(id, index);
      return;
    }
    if (e.voice(id).hotCues[index] == null) e.setHotCue(id, index);
    else e.jumpHotCue(id, index);
  }, []);

  const sync = useCallback((side: 'left' | 'right'): boolean => {
    const slave = side === 'left' ? deckA : deckB;
    const masterDeck = side === 'left' ? deckB : deckA;
    const next = syncPitchPct(masterDeck.bpm ?? 0, masterDeck.pitch, slave.bpm ?? 0);
    if (next == null) return false;
    setPitch(side, next);
    return true;
  }, [deckA, deckB, setPitch]);

  const startRecord = useCallback(async () => {
    const e = await ensure();
    const ok = e.startRecord();
    if (!ok) {
      setError('MediaRecorder unavailable in this browser');
      return false;
    }
    setExportBlob(null);
    setReceipt(null);
    setRecording(true);
    setRecSec(0);
    return true;
  }, [ensure]);

  const stopRecord = useCallback(async () => {
    const e = engineRef.current;
    if (!e) return;
    const blob = await e.stopRecord();
    setRecording(false);
    if (!blob) {
      setError('recording produced an empty file');
      return;
    }
    setExportBlob(blob);
    setExportMime(e.lastMime || blob.type || 'audio/webm');
    const tracks: MixTrackInfo[] = [];
    if (deckA.mixLoaded) {
      tracks.push({
        deck: 'A',
        title: deckA.title || deckA.fileName || 'Deck A',
        fileName: deckA.fileName,
        bpm: deckA.bpm,
        durationSec: deckA.dur,
      });
    }
    if (deckB.mixLoaded) {
      tracks.push({
        deck: 'B',
        title: deckB.title || deckB.fileName || 'Deck B',
        fileName: deckB.fileName,
        bpm: deckB.bpm,
        durationSec: deckB.dur,
      });
    }
    const durationSec = e.lastRecordSec || recSec;
    setRecSec(durationSec);
    setReceipt(
      buildMixReceipt({
        recordedAt: new Date(),
        durationSec,
        tracks,
        events: e.events,
      }),
    );
  }, [deckA, deckB, recSec]);

  const downloadAudio = useCallback(() => {
    if (!exportBlob) return;
    const ext = exportExtension(exportMime);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(exportBlob);
    a.download = `aileena-desk-mix.${ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4_000);
  }, [exportBlob, exportMime]);

  const downloadMeta = useCallback(() => {
    if (!receipt) return;
    const json = receiptToJson(receipt, {
      durationSec: recSec,
      mime: exportMime,
      decks: { A: deckA.title, B: deckB.title },
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = 'aileena-mix-receipt.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4_000);
  }, [receipt, recSec, exportMime, deckA.title, deckB.title]);

  const copyReceiptText = useCallback(async () => {
    if (!receipt) return;
    await navigator.clipboard.writeText(receipt.soundcloudCaption || receiptToText(receipt));
  }, [receipt]);

  return {
    ready,
    error,
    deckA,
    deckB,
    xfade,
    faderA,
    faderB,
    eqA,
    eqB,
    filterA,
    filterB,
    master,
    vuA,
    vuB,
    vuM,
    recording,
    recSec,
    exportReady: !!exportBlob,
    exportBlob,
    exportMime,
    receipt,
    unlock,
    loadFile,
    loadUrl,
    setCrateMeta,
    toggle,
    seek,
    setCueNow,
    returnToCue,
    setPitch,
    setGain,
    changeXfade,
    changeFader,
    changeEq,
    changeFilter,
    changeMaster,
    loopIn,
    loopOut,
    loopBars,
    loopExit,
    hotCue,
    sync,
    startRecord,
    stopRecord,
    downloadAudio,
    downloadMeta,
    copyReceiptText,
  };
}

export { sideToId };
