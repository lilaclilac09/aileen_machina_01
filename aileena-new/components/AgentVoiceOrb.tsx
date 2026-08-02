'use client';

/**
 * Voice orb for Aileena · Console.
 *
 * Transport only — brain stays /api/chat via the parent `onAsk` callback.
 * STT: MediaRecorder → /api/transcribe (Whisper) when available, else Web Speech.
 * TTS: /api/tts (ElevenLabs / OpenAI) with speechSynthesis fallback.
 *
 * Voice presets are style-similar public library voices — not celebrity clones.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Caps = {
  whisper: boolean;
  tts: boolean;
  mode: 'openai' | 'webspeech' | 'mixed';
  provider?: 'elevenlabs' | 'openai' | 'none';
};

type Props = {
  active: boolean;
  busy: boolean;
  disabled?: boolean;
  /** Latest assistant reply to speak (parent watches messages). */
  speakText?: string;
  speakId?: string;
  onAsk: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
  /**
   * `dock` = tiny orb/mic in the input row + thin preset strip (default).
   * `panel` = legacy large centered orb (unused).
   */
  variant?: 'dock' | 'panel';
};

/** Style presets only — not celebrity clones. */
export const VOICE_PRESETS = [
  {
    key: 'auntie',
    label: 'Auntie',
    voiceId: 'Ca5bKgudqKJzq8YRFoAz', // Coco Li — Shanghainese soft
    hint: 'soft Shanghai',
  },
  {
    key: 'leijun',
    label: 'Tech',
    voiceId: '4VZIsMPtgggwNg7OXbPY', // James Gao — mid male Mandarin vibe
    hint: 'tech-bro vibe',
  },
  {
    key: 'dongbei',
    label: 'North',
    voiceId: 'DVE92KG0Yd4X7RoMqy8J', // Zicai — lively male stand-in
    hint: 'lively north',
  },
  {
    key: 'london',
    label: 'London',
    voiceId: 'pFZP5JQG7iQjIQuC4Bku', // Lily — classic RP
    hint: 'classic RP',
  },
  {
    key: 'crown',
    label: 'Crown',
    voiceId: 'MWUpoNpAY0rOQGP294mF', // Clarice — calm posh British
    hint: 'calm posh',
  },
] as const;

export type VoicePresetKey = (typeof VOICE_PRESETS)[number]['key'];

const VOICE_STORAGE_KEY = 'aileena.console.voicePreset';

const SENTENCE_RE = /(?<=[.!?。！？…])\s+|(?<=\n)/;
const SPEECH_THRESH = 0.018;
const SILENCE_END_MS = 750;
const MIN_SPEECH_MS = 280;
const COOLDOWN_MS = 500;

export default function AgentVoiceOrb({
  active,
  busy,
  disabled,
  speakText,
  speakId,
  onAsk,
  onListeningChange,
  variant = 'dock',
}: Props) {
  const [caps, setCaps] = useState<Caps>({
    whisper: false,
    tts: false,
    mode: 'webspeech',
    provider: 'none',
  });
  const [listening, setListening] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'listening' | 'hearing' | 'speaking'>('idle');
  const [level, setLevel] = useState(0);
  const [hint, setHint] = useState('tap mic · talk');
  const [presetKey, setPresetKey] = useState<VoicePresetKey>('auntie');
  const [ttsFallback, setTtsFallback] = useState(false);
  const [liveCaption, setLiveCaption] = useState('');
  const [dockHosts, setDockHosts] = useState<{
    mic: HTMLElement | null;
    strip: HTMLElement | null;
  }>({ mic: null, strip: null });

  const playCtxRef = useRef<AudioContext | null>(null);
  const voiceIdRef = useRef<string>(VOICE_PRESETS[0].voiceId);
  const playGenRef = useRef(0);
  const nextPlayAtRef = useRef(0);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const lastSpokenIdRef = useRef<string>('');
  const lastAskAtRef = useRef(0);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef(0);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const recChunksRef = useRef<Blob[]>([]);
  const speechActiveRef = useRef(false);
  const silenceMsRef = useRef(0);
  const webRecRef = useRef<SpeechRecognition | null>(null);
  const webRestartRef = useRef(0);
  const ttsPlayingRef = useRef(false);
  const busyRef = useRef(busy);
  busyRef.current = busy;

  useEffect(() => {
    fetch('/api/voice/caps')
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d === 'object') {
          setCaps({
            whisper: Boolean(d.whisper),
            tts: d.tts !== false && Boolean(d.tts),
            mode: d.mode === 'openai' || d.mode === 'mixed' ? d.mode : 'webspeech',
            provider:
              d.provider === 'elevenlabs' || d.provider === 'openai' ? d.provider : 'none',
          });
          if (!d.tts) setTtsFallback(true);
        }
      })
      .catch(() => {
        /* webspeech fallback */
      });
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VOICE_STORAGE_KEY) as VoicePresetKey | null;
      if (saved && VOICE_PRESETS.some((p) => p.key === saved)) setPresetKey(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const preset = VOICE_PRESETS.find((p) => p.key === presetKey) ?? VOICE_PRESETS[0];
    voiceIdRef.current = preset.voiceId;
    try {
      localStorage.setItem(VOICE_STORAGE_KEY, preset.key);
    } catch {
      /* ignore */
    }
  }, [presetKey]);

  const ensurePlayCtx = useCallback(() => {
    if (!playCtxRef.current) {
      playCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (playCtxRef.current.state === 'suspended') void playCtxRef.current.resume();
    return playCtxRef.current;
  }, []);

  const stopPlayback = useCallback(() => {
    playGenRef.current += 1;
    sourcesRef.current.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* ignore */
      }
    });
    sourcesRef.current = [];
    nextPlayAtRef.current = 0;
    ttsPlayingRef.current = false;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  const selectPreset = useCallback(
    (key: VoicePresetKey) => {
      if (key === presetKey) return;
      stopPlayback();
      setPresetKey(key);
    },
    [presetKey, stopPlayback],
  );

  const enqueueBuffer = useCallback(
    async (buf: AudioBuffer, gen: number) => {
      if (gen !== playGenRef.current) return;
      const ctx = ensurePlayCtx();
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      const startAt = Math.max(ctx.currentTime + 0.03, nextPlayAtRef.current || ctx.currentTime + 0.03);
      src.start(startAt);
      nextPlayAtRef.current = startAt + buf.duration;
      sourcesRef.current.push(src);
      ttsPlayingRef.current = true;
      setPhase('speaking');
      setHint('Aileena is speaking…');
      src.onended = () => {
        sourcesRef.current = sourcesRef.current.filter((s) => s !== src);
        if (!sourcesRef.current.length && gen === playGenRef.current) {
          ttsPlayingRef.current = false;
          if (listening) {
            setPhase('listening');
            setHint('Aileena is listening…');
          } else {
            setPhase('idle');
            setHint('tap mic');
          }
        }
      };
    },
    [ensurePlayCtx, listening],
  );

  const speakBrowser = useCallback(
    (text: string, gen: number) =>
      new Promise<void>((resolve) => {
        if (!window.speechSynthesis || gen !== playGenRef.current) {
          resolve();
          return;
        }
        setTtsFallback(true);
        const u = new SpeechSynthesisUtterance(text);
        const preset = VOICE_PRESETS.find((p) => p.key === presetKey) ?? VOICE_PRESETS[0];
        const wantZh = preset.key === 'auntie' || preset.key === 'leijun' || preset.key === 'dongbei';
        const voices = window.speechSynthesis.getVoices();
        const pick =
          voices.find((v) =>
            wantZh
              ? /zh[-_]?CN|chinese/i.test(`${v.lang} ${v.name}`)
              : /en[-_]?(GB|UK)/i.test(v.lang),
          ) ||
          voices.find((v) => (wantZh ? /zh/i.test(v.lang) : /en/i.test(v.lang))) ||
          null;
        if (pick) u.voice = pick;
        u.lang = wantZh ? 'zh-CN' : 'en-GB';
        u.rate = 0.92;
        u.pitch = wantZh ? 1.05 : 1;
        ttsPlayingRef.current = true;
        setPhase('speaking');
        setHint(caps.tts ? 'Aileena is speaking…' : 'browser voice · not Auntie');
        u.onend = () => {
          ttsPlayingRef.current = false;
          if (listening) {
            setPhase('listening');
            setHint('Aileena is listening…');
          } else {
            setPhase('idle');
            setHint('tap mic');
          }
          resolve();
        };
        u.onerror = () => {
          ttsPlayingRef.current = false;
          resolve();
        };
        window.speechSynthesis.speak(u);
      }),
    [caps.tts, listening, presetKey],
  );

  const speakSentence = useCallback(
    async (text: string, gen: number) => {
      const t = text.trim();
      if (!t || gen !== playGenRef.current) return;
      if (!caps.tts) {
        await speakBrowser(t, gen);
        return;
      }
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: t.slice(0, 4000),
            voice: voiceIdRef.current,
          }),
        });
        if (!res.ok) throw new Error('tts ' + res.status);
        setTtsFallback(false);
        const ab = await res.arrayBuffer();
        if (gen !== playGenRef.current) return;
        const ctx = ensurePlayCtx();
        const buf = await ctx.decodeAudioData(ab.slice(0));
        await enqueueBuffer(buf, gen);
      } catch {
        await speakBrowser(t, gen);
      }
    },
    [caps.tts, ensurePlayCtx, enqueueBuffer, speakBrowser],
  );

  // Speak new assistant turns while voice mode is active.
  useEffect(() => {
    if (!active || !speakText?.trim() || !speakId) return;
    if (speakId === lastSpokenIdRef.current) return;
    lastSpokenIdRef.current = speakId;
    const gen = playGenRef.current;
    const full = speakText.trim();
    // sentence-chunk for snappier first audio
    const parts = full.split(SENTENCE_RE).map((s) => s.trim()).filter(Boolean);
    void (async () => {
      for (const p of parts.length ? parts : [full]) {
        if (gen !== playGenRef.current) break;
        await speakSentence(p, gen);
      }
    })();
  }, [active, speakText, speakId, speakSentence]);

  const handleUtterance = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t || busyRef.current || disabled) return;
      const now = Date.now();
      if (now - lastAskAtRef.current < COOLDOWN_MS) return;
      lastAskAtRef.current = now;
      stopPlayback();
      onAsk(t);
    },
    [disabled, onAsk, stopPlayback],
  );

  const pickMime = () => {
    const cands = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    for (const m of cands) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m;
    }
    return '';
  };

  const beginChunk = useCallback(() => {
    const stream = mediaStreamRef.current;
    if (!stream || mediaRecRef.current) return;
    const mime = pickMime();
    recChunksRef.current = [];
    try {
      mediaRecRef.current = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
    } catch {
      return;
    }
    mediaRecRef.current.ondataavailable = (ev) => {
      if (ev.data?.size) recChunksRef.current.push(ev.data);
    };
    mediaRecRef.current.start(200);
  }, []);

  const endChunkAndTranscribe = useCallback(async () => {
    const rec = mediaRecRef.current;
    mediaRecRef.current = null;
    if (!rec || rec.state === 'inactive') return;
    const blob = await new Promise<Blob | null>((resolve) => {
      rec.onstop = () => resolve(new Blob(recChunksRef.current, { type: rec.mimeType || 'audio/webm' }));
      try {
        rec.stop();
      } catch {
        resolve(null);
      }
    });
    if (!blob || blob.size < 800) return;
    setPhase('hearing');
    setHint('got it…');
    try {
      const ext = (blob.type || '').includes('mp4') ? 'm4a' : 'webm';
      const res = await fetch(`/api/transcribe?filename=audio.${ext}`, {
        method: 'POST',
        headers: { 'Content-Type': blob.type || 'audio/webm' },
        body: blob,
      });
      const data = (await res.json()) as { ok?: boolean; text?: string };
      if (data.ok && data.text) handleUtterance(data.text);
      else if (listening) {
        setPhase('listening');
        setHint('listening…');
      }
    } catch {
      if (listening) {
        setPhase('listening');
        setHint('listening…');
      }
    }
  }, [handleUtterance, listening]);

  const startVadLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.fftSize);
    let speechStartedAt = 0;
    const tick = () => {
      if (!analyserRef.current) return;
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      setLevel(Math.min(100, Math.round(rms * 450)));

      const thresh = ttsPlayingRef.current ? SPEECH_THRESH * 2.2 : SPEECH_THRESH;
      if (rms > thresh && ttsPlayingRef.current) {
        stopPlayback();
        setPhase('listening');
        setHint('listening…');
      }

      if (!busyRef.current && !ttsPlayingRef.current) {
        if (rms > thresh) {
          silenceMsRef.current = 0;
          if (!speechActiveRef.current) {
            speechActiveRef.current = true;
            speechStartedAt = Date.now();
            beginChunk();
          }
        } else if (speechActiveRef.current) {
          silenceMsRef.current += 32;
          if (
            silenceMsRef.current >= SILENCE_END_MS &&
            Date.now() - speechStartedAt >= MIN_SPEECH_MS
          ) {
            speechActiveRef.current = false;
            silenceMsRef.current = 0;
            void endChunkAndTranscribe();
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [beginChunk, endChunkAndTranscribe, stopPlayback]);

  const stopOpenAiListen = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      try {
        mediaRecRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    mediaRecRef.current = null;
    speechActiveRef.current = false;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    setLevel(0);
  }, []);

  const stopWebSpeech = useCallback(() => {
    clearTimeout(webRestartRef.current);
    if (webRecRef.current) {
      try {
        webRecRef.current.onend = null;
        webRecRef.current.stop();
      } catch {
        /* ignore */
      }
      webRecRef.current = null;
    }
  }, []);

  const startWebSpeech = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) throw new Error('no Web Speech');
    const rec = new SR();
    webRecRef.current = rec;
    rec.lang = 'zh-CN';
    rec.interimResults = true;
    rec.continuous = true;
    rec.onstart = () => {
      setPhase('listening');
      setHint('listening…');
    };
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      setHint('mic glitch');
    };
    rec.onend = () => {
      if (listening && !busyRef.current) {
        webRestartRef.current = window.setTimeout(() => {
          try {
            rec.start();
          } catch {
            /* ignore */
          }
        }, 120);
      }
    };
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      let finalText = '';
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const piece = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) finalText += piece;
        else interim += piece;
      }
      if (interim.trim()) {
        setLiveCaption(interim.trim());
        setPhase('hearing');
        setHint('Aileena is listening…');
      }
      if (finalText.trim()) {
        setLiveCaption('');
        if (ttsPlayingRef.current) stopPlayback();
        handleUtterance(finalText.trim());
      }
    };
    rec.start();
  }, [handleUtterance, listening, stopPlayback]);

  const startOpenAiListen = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    mediaStreamRef.current = stream;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);
    analyserRef.current = analyser;
    startVadLoop();
  }, [startVadLoop]);

  const startListening = useCallback(async () => {
    if (disabled) return;
    setListening(true);
    onListeningChange?.(true);
    setPhase('listening');
    setHint('Aileena is listening…');
    setLiveCaption('');
    ensurePlayCtx();
    try {
      if (caps.whisper && navigator.mediaDevices && window.MediaRecorder) {
        await startOpenAiListen();
      } else {
        startWebSpeech();
      }
    } catch {
      setListening(false);
      onListeningChange?.(false);
      setPhase('idle');
      setHint('mic blocked');
    }
  }, [
    caps.whisper,
    disabled,
    ensurePlayCtx,
    onListeningChange,
    startOpenAiListen,
    startWebSpeech,
  ]);

  const stopListening = useCallback(() => {
    setListening(false);
    onListeningChange?.(false);
    stopPlayback();
    stopOpenAiListen();
    stopWebSpeech();
    setPhase('idle');
    setLiveCaption('');
    setHint('tap mic');
  }, [onListeningChange, stopOpenAiListen, stopPlayback, stopWebSpeech]);

  // Auto-listen when voice mode turns on (continuous streaming).
  // User can still mute via the mic button; we only auto-start on mode open.
  useEffect(() => {
    if (!active || disabled) {
      stopListening();
      return;
    }
    void startListening();
    return () => {
      stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, disabled, caps.whisper]);

  useEffect(() => {
    if (!active || variant !== 'dock') {
      setDockHosts({ mic: null, strip: null });
      return;
    }
    const sync = () =>
      setDockHosts({
        mic: document.getElementById('console-voice-mic'),
        strip: document.getElementById('console-voice-strip'),
      });
    sync();
    const t = window.setTimeout(sync, 0);
    return () => window.clearTimeout(t);
  }, [active, variant]);

  useEffect(() => {
    return () => {
      stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!active) return null;

  const activePreset = VOICE_PRESETS.find((p) => p.key === presetKey) ?? VOICE_PRESETS[0];
  const statusLine =
    phase === 'speaking'
      ? 'Aileena is speaking…'
      : phase === 'hearing' || listening
        ? 'Aileena is listening…'
        : 'tap mic to talk';

  const micButton = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => (listening ? stopListening() : void startListening())}
      aria-label={listening ? 'Mute mic' : 'Aileena listens'}
      title={listening ? 'Mute' : 'Aileena listens'}
      className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        listening || phase === 'speaking'
          ? 'border-[#00a89d]/70 bg-[#00a89d]/12 animate-pulse'
          : 'border-[#1b1713]/15 bg-transparent hover:border-[#00a89d]/50'
      }`}
    >
      {/* Simple mic glyph — no crystal ball */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[#008f86]">
        <rect x="9" y="2" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );

  const presetStrip = (
    <div className="flex flex-col gap-1.5">
      {(liveCaption || listening || phase === 'speaking') && (
        <p className="font-mono text-[0.7rem] leading-5 text-[#008f86]/90 truncate">
          <span className="text-[0.5rem] tracking-[0.22em] uppercase text-[#1b1713]/35 mr-2">
            {phase === 'speaking' ? 'out' : 'live'}
          </span>
          {liveCaption || statusLine}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p
          className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.5rem] tracking-[0.14em] text-[#1b1713]/40"
          role="group"
          aria-label="Voice"
        >
          {VOICE_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => selectPreset(p.key)}
              title={p.hint}
              className="uppercase transition-colors"
              style={{
                color: p.key === presetKey ? '#008f86' : 'rgba(27,23,19,0.35)',
                letterSpacing: '0.12em',
              }}
            >
              {p.key === presetKey ? `◆ ${p.label}` : p.label}
            </button>
          ))}
        </p>
        <span
          className="font-mono text-[0.48rem] tracking-[0.16em] uppercase"
          style={{ color: !caps.tts || ttsFallback ? '#b45309' : 'rgba(27,23,19,0.35)' }}
        >
          {!caps.tts || ttsFallback
            ? 'browser TTS · set ELEVENLABS_API_KEY'
            : `${caps.provider || 'tts'} · ${activePreset.label}`}
        </span>
        <span className="ml-auto inline-block h-[2px] w-10 overflow-hidden rounded-sm bg-[#1b1713]/08 align-middle">
          <i
            className="block h-full bg-[#00a89d] transition-[width] duration-75"
            style={{ width: `${level}%`, display: 'block' }}
          />
        </span>
      </div>
    </div>
  );

  if (variant === 'dock') {
    return (
      <>
        {dockHosts.mic ? createPortal(micButton, dockHosts.mic) : null}
        {dockHosts.strip ? createPortal(presetStrip, dockHosts.strip) : null}
      </>
    );
  }

  return (
    <div className="border-t border-[#e7e0d6] px-5 py-3">
      <div className="flex items-center gap-3">
        {micButton}
        <div className="min-w-0 flex-1">{presetStrip}</div>
      </div>
    </div>
  );
}

// DOM SpeechRecognition typings (Chromium)
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
    webkitAudioContext?: typeof AudioContext;
  }
}
