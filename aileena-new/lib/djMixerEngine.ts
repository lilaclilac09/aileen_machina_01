/**
 * Real two-deck Web Audio graph.
 *
 * Path: File / same-origin URL → decodeAudioData → AudioBuffer
 *   → AudioBufferSourceNode (one per play) → trim → EQ → filter → fader
 *   → analyser → xfade → master → speakers
 *                              → master analyser
 *                              → MediaStreamDestination (MediaRecorder)
 *
 * One AudioContext for the desk. Decks do not use HTMLAudioElement /
 * MediaElementSource. Object URLs are not used (decode from ArrayBuffer).
 *
 * Spotify iframe / preview_url audio is not in this graph and cannot be
 * mixed or exported here — Premium does not change that.
 */

import {
  barsToSeconds,
  crossfadeGains,
  eqKnobToDb,
  faderGain,
  filterFromKnob,
  pitchToRate,
  trimGain,
} from './djMixerMath';
import { peaksFromBuffer, rmsFromTimeDomain } from './djWaveform';
import type { MixEvent } from './djMixReceipt';

export type DeckId = 'A' | 'B';

export type DeckLoop = {
  active: boolean;
  inSec: number | null;
  outSec: number | null;
  bars: number | null;
};

type DeckChain = {
  input: GainNode;
  trim: GainNode;
  eqLo: BiquadFilterNode;
  eqMid: BiquadFilterNode;
  eqHi: BiquadFilterNode;
  filter: BiquadFilterNode;
  fader: GainNode;
  analyser: AnalyserNode;
  xfade: GainNode;
};

type DeckVoice = {
  buffer: AudioBuffer | null;
  source: AudioBufferSourceNode | null;
  playing: boolean;
  offset: number;
  startedAt: number;
  rate: number;
  cue: number;
  hotCues: Array<number | null>;
  loop: DeckLoop;
  peaks: number[];
  title: string;
  fileName: string;
};

function newVoice(): DeckVoice {
  return {
    buffer: null,
    source: null,
    playing: false,
    offset: 0,
    startedAt: 0,
    rate: 1,
    cue: 0,
    hotCues: Array.from({ length: 8 }, () => null),
    loop: { active: false, inSec: null, outSec: null, bars: null },
    peaks: [],
    title: '',
    fileName: '',
  };
}

function makeChain(ctx: AudioContext): DeckChain {
  const input = ctx.createGain();
  const trim = ctx.createGain();
  const eqLo = ctx.createBiquadFilter();
  const eqMid = ctx.createBiquadFilter();
  const eqHi = ctx.createBiquadFilter();
  const filter = ctx.createBiquadFilter();
  const fader = ctx.createGain();
  const analyser = ctx.createAnalyser();
  const xfade = ctx.createGain();

  eqLo.type = 'lowshelf';
  eqLo.frequency.value = 320;
  eqMid.type = 'peaking';
  eqMid.frequency.value = 1000;
  eqMid.Q.value = 0.85;
  eqHi.type = 'highshelf';
  eqHi.frequency.value = 3200;
  filter.type = 'allpass';
  filter.frequency.value = 1000;
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.55;

  input.connect(trim);
  trim.connect(eqLo);
  eqLo.connect(eqMid);
  eqMid.connect(eqHi);
  eqHi.connect(filter);
  filter.connect(fader);
  fader.connect(analyser);
  analyser.connect(xfade);

  return { input, trim, eqLo, eqMid, eqHi, filter, fader, analyser, xfade };
}

export class DjMixerEngine {
  readonly ctx: AudioContext;
  private readonly a: DeckChain;
  private readonly b: DeckChain;
  private readonly master: GainNode;
  private readonly masterAnalyser: AnalyserNode;
  private readonly recordDest: MediaStreamAudioDestinationNode;
  private readonly voices: Record<DeckId, DeckVoice> = { A: newVoice(), B: newVoice() };
  private recorder: MediaRecorder | null = null;
  private recChunks: Blob[] = [];
  private recMime = '';
  private recStartedAt = 0;
  private disposed = false;
  private vuBuf: Uint8Array<ArrayBuffer>;
  events: MixEvent[] = [];
  lastBlob: Blob | null = null;
  lastMime = '';
  lastRecordSec = 0;

  constructor(ctx?: AudioContext) {
    const AC =
      ctx ??
      new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.ctx = AC;
    this.a = makeChain(AC);
    this.b = makeChain(AC);
    this.master = AC.createGain();
    this.masterAnalyser = AC.createAnalyser();
    this.masterAnalyser.fftSize = 256;
    this.recordDest = AC.createMediaStreamDestination();

    this.a.xfade.connect(this.master);
    this.b.xfade.connect(this.master);
    this.master.connect(AC.destination);
    this.master.connect(this.masterAnalyser);
    this.master.connect(this.recordDest);

    this.master.gain.value = trimGain(75);
    this.applyXfade(50);
    this.vuBuf = new Uint8Array(new ArrayBuffer(this.masterAnalyser.fftSize));
  }

  async resume(): Promise<void> {
    if (this.ctx.state === 'suspended') await this.ctx.resume();
  }

  chain(id: DeckId): DeckChain {
    return id === 'A' ? this.a : this.b;
  }

  voice(id: DeckId): DeckVoice {
    return this.voices[id];
  }

  isLoaded(id: DeckId): boolean {
    return !!this.voices[id].buffer;
  }

  duration(id: DeckId): number {
    return this.voices[id].buffer?.duration ?? 0;
  }

  position(id: DeckId): number {
    const v = this.voices[id];
    if (!v.buffer) return 0;
    if (!v.playing) return v.offset;
    const pos = v.offset + (this.ctx.currentTime - v.startedAt) * v.rate;
    if (v.loop.active && v.loop.inSec != null && v.loop.outSec != null && v.loop.outSec > v.loop.inSec) {
      const span = v.loop.outSec - v.loop.inSec;
      if (pos >= v.loop.outSec && span > 0) {
        return v.loop.inSec + ((pos - v.loop.inSec) % span);
      }
    }
    return Math.min(v.buffer.duration, Math.max(0, pos));
  }

  async decodeFile(file: File | ArrayBuffer): Promise<AudioBuffer> {
    const raw = file instanceof File ? await file.arrayBuffer() : file;
    return this.ctx.decodeAudioData(raw.slice(0));
  }

  async loadFile(id: DeckId, file: File, title?: string): Promise<{ peaks: number[]; duration: number }> {
    await this.resume();
    const buffer = await this.decodeFile(file);
    this.stopSource(id, this.position(id));
    const v = this.voices[id];
    v.buffer = buffer;
    v.offset = 0;
    v.cue = 0;
    v.hotCues = Array.from({ length: 8 }, () => null);
    v.loop = { active: false, inSec: null, outSec: null, bars: null };
    v.peaks = peaksFromBuffer(buffer);
    v.fileName = file.name;
    v.title = title?.trim() || file.name.replace(/\.[^.]+$/, '');
    this.log('load', id, v.title);
    return { peaks: v.peaks, duration: buffer.duration };
  }

  async loadUrl(id: DeckId, url: string, title?: string): Promise<{ peaks: number[]; duration: number }> {
    await this.resume();
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const buffer = await this.decodeFile(await res.arrayBuffer());
    this.stopSource(id, 0);
    const v = this.voices[id];
    v.buffer = buffer;
    v.offset = 0;
    v.cue = 0;
    v.hotCues = Array.from({ length: 8 }, () => null);
    v.loop = { active: false, inSec: null, outSec: null, bars: null };
    v.peaks = peaksFromBuffer(buffer);
    v.fileName = url;
    v.title = title?.trim() || url.split('/').pop() || 'url';
    this.log('load', id, v.title);
    return { peaks: v.peaks, duration: buffer.duration };
  }

  play(id: DeckId): void {
    const v = this.voices[id];
    if (!v.buffer || v.playing) return;
    this.startSource(id, v.offset);
    this.log('play', id, v.title);
  }

  pause(id: DeckId): void {
    const v = this.voices[id];
    if (!v.playing) return;
    this.stopSource(id, this.position(id));
    this.log('pause', id, v.title);
  }

  toggle(id: DeckId): void {
    if (this.voices[id].playing) this.pause(id);
    else this.play(id);
  }

  seek(id: DeckId, sec: number): void {
    const v = this.voices[id];
    if (!v.buffer) return;
    const next = Math.min(v.buffer.duration, Math.max(0, sec));
    if (v.playing) this.startSource(id, next);
    else v.offset = next;
  }

  setCue(id: DeckId, sec?: number): void {
    const v = this.voices[id];
    v.cue = sec ?? this.position(id);
  }

  returnToCue(id: DeckId): void {
    this.seek(id, this.voices[id].cue);
    this.pause(id);
  }

  setPitch(id: DeckId, pitchPct: number): void {
    const v = this.voices[id];
    const pos = this.position(id);
    v.rate = pitchToRate(pitchPct);
    if (v.source && v.playing) {
      v.source.playbackRate.value = v.rate;
      v.offset = pos;
      v.startedAt = this.ctx.currentTime;
    }
  }

  setTrim(id: DeckId, knob0to100: number): void {
    this.chain(id).trim.gain.value = trimGain(knob0to100);
  }

  setFader(id: DeckId, knob0to100: number): void {
    this.chain(id).fader.gain.value = faderGain(knob0to100);
  }

  setEq(id: DeckId, band: 'lo' | 'mid' | 'hi', knob0to100: number): void {
    const c = this.chain(id);
    const node = band === 'lo' ? c.eqLo : band === 'mid' ? c.eqMid : c.eqHi;
    node.gain.value = eqKnobToDb(knob0to100);
  }

  setFilter(id: DeckId, knob0to100: number): void {
    const shape = filterFromKnob(knob0to100);
    const f = this.chain(id).filter;
    f.type = shape.type;
    f.frequency.value = shape.frequency;
    f.Q.value = shape.Q;
  }

  applyXfade(xfade0to100: number): void {
    const g = crossfadeGains(xfade0to100);
    this.a.xfade.gain.value = g.a;
    this.b.xfade.gain.value = g.b;
  }

  setMaster(knob0to100: number): void {
    this.master.gain.value = trimGain(knob0to100);
  }

  setLoopIn(id: DeckId): void {
    const v = this.voices[id];
    v.loop.inSec = this.position(id);
    v.loop.bars = null;
    v.loop.active = false;
    this.applyLoopToSource(id);
  }

  setLoopOut(id: DeckId): void {
    const v = this.voices[id];
    if (v.loop.inSec == null) return;
    v.loop.outSec = Math.max(v.loop.inSec + 0.05, this.position(id));
    v.loop.active = true;
    v.loop.bars = null;
    this.applyLoopToSource(id);
  }

  setLoopBars(id: DeckId, bars: number, bpm: number): boolean {
    const len = barsToSeconds(bars, bpm);
    if (!(len > 0)) return false;
    const v = this.voices[id];
    const start = this.position(id);
    v.loop.inSec = start;
    v.loop.outSec = Math.min(this.duration(id), start + len);
    v.loop.bars = bars;
    v.loop.active = v.loop.outSec > v.loop.inSec;
    this.applyLoopToSource(id);
    return v.loop.active;
  }

  clearLoop(id: DeckId): void {
    const v = this.voices[id];
    v.loop = { active: false, inSec: null, outSec: null, bars: null };
    this.applyLoopToSource(id);
  }

  setHotCue(id: DeckId, index: number): void {
    const v = this.voices[id];
    if (index < 0 || index > 7) return;
    v.hotCues[index] = this.position(id);
  }

  jumpHotCue(id: DeckId, index: number): void {
    const t = this.voices[id].hotCues[index];
    if (t == null) return;
    this.seek(id, t);
    this.play(id);
  }

  clearHotCue(id: DeckId, index: number): void {
    const v = this.voices[id];
    if (index < 0 || index > 7) return;
    v.hotCues[index] = null;
  }

  vu(): { a: number; b: number; master: number } {
    return {
      a: this.readVu(this.a.analyser),
      b: this.readVu(this.b.analyser),
      master: this.readVu(this.masterAnalyser),
    };
  }

  get recording(): boolean {
    return this.recorder?.state === 'recording';
  }

  startRecord(): boolean {
    if (this.recording) return true;
    const mime = pickRecorderMime();
    if (!mime && typeof MediaRecorder === 'undefined') return false;
    this.recChunks = [];
    this.lastBlob = null;
    this.events = this.events.filter((e) => e.kind === 'load');
    this.recStartedAt = this.ctx.currentTime;
    this.log('record-start');
    try {
      this.recorder = mime
        ? new MediaRecorder(this.recordDest.stream, { mimeType: mime })
        : new MediaRecorder(this.recordDest.stream);
    } catch {
      try {
        this.recorder = new MediaRecorder(this.recordDest.stream);
      } catch {
        return false;
      }
    }
    this.recMime = this.recorder.mimeType || mime || 'audio/webm';
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recChunks.push(e.data);
    };
    this.recorder.start(250);
    return true;
  }

  async stopRecord(): Promise<Blob | null> {
    const rec = this.recorder;
    if (!rec || rec.state === 'inactive') return this.lastBlob;
    const blob = await new Promise<Blob | null>((resolve) => {
      rec.onstop = () => {
        const type = this.recMime || 'audio/webm';
        const out = this.recChunks.length ? new Blob(this.recChunks, { type }) : null;
        resolve(out);
      };
      rec.stop();
    });
    this.recorder = null;
    this.lastBlob = blob;
    this.lastMime = this.recMime;
    this.lastRecordSec = Math.max(0, this.ctx.currentTime - this.recStartedAt);
    this.log('record-stop');
    return blob;
  }

  recordElapsed(): number {
    if (!this.recording) return 0;
    return Math.max(0, this.ctx.currentTime - this.recStartedAt);
  }

  logXfade(xfade: number): void {
    this.log('xfade', undefined, undefined, xfade);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopSource('A', 0);
    this.stopSource('B', 0);
    if (this.recorder && this.recorder.state !== 'inactive') {
      try {
        this.recorder.stop();
      } catch {
        /* ignore */
      }
    }
    try {
      this.a.input.disconnect();
      this.b.input.disconnect();
      this.master.disconnect();
    } catch {
      /* ignore */
    }
    void this.ctx.close();
  }

  private readVu(analyser: AnalyserNode): number {
    const needed = analyser.fftSize;
    if (this.vuBuf.length < needed) {
      this.vuBuf = new Uint8Array(new ArrayBuffer(needed));
    }
    const view = this.vuBuf.subarray(0, needed);
    analyser.getByteTimeDomainData(view);
    return rmsFromTimeDomain(view);
  }

  private startSource(id: DeckId, offset: number): void {
    const v = this.voices[id];
    if (!v.buffer) return;
    this.disconnectSource(id);
    const src = this.ctx.createBufferSource();
    src.buffer = v.buffer;
    src.playbackRate.value = v.rate;
    this.applyLoopParams(src, v);
    src.connect(this.chain(id).input);
    const startAt = Math.min(offset, Math.max(0, v.buffer.duration - 0.001));
    src.start(0, startAt);
    src.onended = () => {
      if (this.voices[id].source === src) {
        this.voices[id].playing = false;
        this.voices[id].offset = this.duration(id);
        this.voices[id].source = null;
      }
    };
    v.source = src;
    v.offset = startAt;
    v.startedAt = this.ctx.currentTime;
    v.playing = true;
  }

  private stopSource(id: DeckId, at: number): void {
    const v = this.voices[id];
    this.disconnectSource(id);
    v.playing = false;
    v.offset = at;
  }

  private disconnectSource(id: DeckId): void {
    const v = this.voices[id];
    if (!v.source) return;
    try {
      v.source.onended = null;
      v.source.stop();
    } catch {
      /* already stopped */
    }
    try {
      v.source.disconnect();
    } catch {
      /* ignore */
    }
    v.source = null;
  }

  private applyLoopToSource(id: DeckId): void {
    const v = this.voices[id];
    if (v.source) this.applyLoopParams(v.source, v);
  }

  private applyLoopParams(src: AudioBufferSourceNode, v: DeckVoice): void {
    if (v.loop.active && v.loop.inSec != null && v.loop.outSec != null && v.loop.outSec > v.loop.inSec) {
      src.loop = true;
      src.loopStart = v.loop.inSec;
      src.loopEnd = v.loop.outSec;
    } else {
      src.loop = false;
    }
  }

  private log(kind: MixEvent['kind'], deck?: DeckId, title?: string, xfade?: number): void {
    const atSec = this.recording || kind === 'record-stop'
      ? Math.max(0, this.ctx.currentTime - this.recStartedAt)
      : 0;
    this.events.push({ atSec, kind, deck, title, xfade });
  }
}

function pickRecorderMime(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

export function exportExtension(mime: string): 'webm' | 'm4a' | 'wav' {
  if (mime.includes('mp4') || mime.includes('m4a')) return 'm4a';
  if (mime.includes('wav')) return 'wav';
  return 'webm';
}
