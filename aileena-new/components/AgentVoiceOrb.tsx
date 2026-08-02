'use client';

/**
 * Voice for Aileena · Console — minimal.
 * Voice on → click mic → speak → live text in chat → reply speaks (soft Shanghai TTS).
 * No voice picker / no strip / no presets.
 * Transport only — brain stays /api/chat via `onAsk`.
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
  speakText?: string;
  speakId?: string;
  speakStreaming?: boolean;
  onAsk: (text: string) => void;
  onLiveCaption?: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
  variant?: 'dock' | 'panel';
};

const DEFAULT_VOICE_ID = 'Ca5bKgudqKJzq8YRFoAz'; // soft Shanghai
const DEFAULT_STT_LANG = 'zh-CN';

const SENTENCE_RE = /(?<=[.!?。！？…])\s+|(?<=\n)/;
const SPEECH_THRESH = 0.018;
const SILENCE_END_MS = 380;
const MIN_SPEECH_MS = 160;
const COOLDOWN_MS = 180;
const WEB_RETRY_MS = 80;
const WEB_BUSY_RETRY_MS = 100;

export default function AgentVoiceOrb({
  active,
  busy,
  disabled,
  speakText,
  speakId,
  speakStreaming = false,
  onAsk,
  onLiveCaption,
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
  const [dockMic, setDockMic] = useState<HTMLElement | null>(null);
  const onLiveCaptionRef = useRef(onLiveCaption);
  onLiveCaptionRef.current = onLiveCaption;

  const pushCaption = useCallback((text: string) => {
    onLiveCaptionRef.current?.(text);
  }, []);

  const playCtxRef = useRef<AudioContext | null>(null);
  const voiceIdRef = useRef<string>(DEFAULT_VOICE_ID);
  const playGenRef = useRef(0);
  const nextPlayAtRef = useRef(0);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const lastSpokenIdRef = useRef<string>('');
  const spokenCharRef = useRef(0);
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
  const listeningRef = useRef(false);
  busyRef.current = busy;
  listeningRef.current = listening;

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
        }
      })
      .catch(() => {
        /* webspeech fallback */
      });
  }, []);
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
      src.onended = () => {
        sourcesRef.current = sourcesRef.current.filter((s) => s !== src);
        if (!sourcesRef.current.length && gen === playGenRef.current) {
          ttsPlayingRef.current = false;
          if (listening) {
            setPhase('listening');
          } else {
            setPhase('idle');
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
        const u = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const pick =
          voices.find((v) => /zh|cmn|chinese/i.test(`${v.lang} ${v.name}`)) ||
          voices.find((v) => v.lang.toLowerCase().startsWith('zh')) ||
          null;
        if (pick) u.voice = pick;
        u.lang = DEFAULT_STT_LANG;
        u.rate = 0.94;
        u.pitch = 1.05;
        ttsPlayingRef.current = true;
        setPhase('speaking');
        u.onend = () => {
          ttsPlayingRef.current = false;
          if (listening) {
            setPhase('listening');
          } else {
            setPhase('idle');
          }
          resolve();
        };
        u.onerror = () => {
          ttsPlayingRef.current = false;
          resolve();
        };
        window.speechSynthesis.speak(u);
      }),
    [listening],
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

  useEffect(() => {
    if (!active || !speakId) return;
    const full = (speakText || '').trim();
    if (!full) return;

    if (speakId !== lastSpokenIdRef.current) {
      lastSpokenIdRef.current = speakId;
      spokenCharRef.current = 0;
      stopPlayback();
    }

    const cursor = spokenCharRef.current;
    if (cursor >= full.length) return;

    const terminal = /[.!?。！？…]$/;
    const ready: string[] = [];
    const region = full.slice(cursor);
    const rough = region.split(SENTENCE_RE).filter((s) => s.trim());
    let walk = cursor;
    for (let i = 0; i < rough.length; i++) {
      const p = rough[i].trim();
      if (!p) continue;
      const at = full.indexOf(p, walk);
      if (at < 0) break;
      const end = at + p.length;
      const isLastFrag = i === rough.length - 1;
      const complete = terminal.test(p) || p.length >= 56;
      if (isLastFrag && speakStreaming && !complete) {
        break;
      }
      ready.push(p);
      walk = end;
    }

    if (!speakStreaming && walk < full.length && !ready.length) {
      const tail = full.slice(cursor).trim();
      if (tail) {
        ready.push(tail);
        walk = full.length;
      }
    }

    if (!ready.length) return;
    spokenCharRef.current = walk;

    const gen = playGenRef.current;
    void (async () => {
      for (const p of ready) {
        if (gen !== playGenRef.current) break;
        await speakSentence(p, gen);
      }
    })();
  }, [active, speakText, speakId, speakStreaming, speakSentence, stopPlayback]);

  const handleUtterance = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t || disabled) return;
      const now = Date.now();
      if (now - lastAskAtRef.current < COOLDOWN_MS) return;
      lastAskAtRef.current = now;
      stopPlayback();
      pushCaption('');
      onAsk(t);
    },
    [disabled, onAsk, pushCaption, stopPlayback],
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
      }
    } catch {
      if (listening) {
        setPhase('listening');
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

      const thresh = ttsPlayingRef.current ? SPEECH_THRESH * 2.2 : SPEECH_THRESH;
      if (rms > thresh && ttsPlayingRef.current) {
        stopPlayback();
        setPhase('listening');
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
    rec.lang = DEFAULT_STT_LANG;
    rec.interimResults = true;
    rec.continuous = false;
    rec.onstart = () => {
      setPhase('listening');
    };
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      if (e.error === 'not-allowed') {
        pushCaption('Allow mic in the browser, then tap the mic button');
        listeningRef.current = false;
        setListening(false);
        return;
      }
      if (e.error === 'network') {
        pushCaption('Speech recognition needs network / Chrome');
        return;
      }
      pushCaption(`Speech error: ${e.error}`);
    };
    rec.onend = () => {
      if (!listeningRef.current) return;
      const retry = () => {
        if (!listeningRef.current || !webRecRef.current) return;
        if (busyRef.current || ttsPlayingRef.current) {
          webRestartRef.current = window.setTimeout(retry, WEB_BUSY_RETRY_MS);
          return;
        }
        try {
          webRecRef.current.start();
        } catch {
          /* already started */
        }
      };
      webRestartRef.current = window.setTimeout(retry, WEB_RETRY_MS);
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
        pushCaption(interim.trim());
        setPhase('hearing');
      }
      if (finalText.trim()) {
        pushCaption(finalText.trim());
        if (ttsPlayingRef.current) stopPlayback();
        handleUtterance(finalText.trim());
      }
    };
    rec.start();
  }, [handleUtterance, pushCaption, stopPlayback]);

  const startOpenAiListen = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    mediaStreamRef.current = stream;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;
    if (ctx.state === 'suspended') await ctx.resume();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);
    analyserRef.current = analyser;
    startVadLoop();
  }, [startVadLoop]);

  const startListening = useCallback(async () => {
    if (disabled) return;
    listeningRef.current = true;
    setListening(true);
    onListeningChange?.(true);
    setPhase('listening');
    pushCaption('Speak now…');
    ensurePlayCtx();
    try {
      if (caps.whisper && navigator.mediaDevices && window.MediaRecorder) {
        await startOpenAiListen();
      } else {
        startWebSpeech();
      }
    } catch (err) {
      listeningRef.current = false;
      setListening(false);
      onListeningChange?.(false);
      setPhase('idle');
      const msg = err instanceof Error ? err.message : 'mic blocked';
      pushCaption(
        msg.includes('Speech') || msg.includes('Web Speech')
          ? 'This browser has no speech recognition — use Chrome, or set OPENAI_API_KEY for Whisper'
          : 'Allow microphone, then tap the mic',
      );
    }
  }, [
    caps.whisper,
    disabled,
    ensurePlayCtx,
    onListeningChange,
    pushCaption,
    startOpenAiListen,
    startWebSpeech,
  ]);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    setListening(false);
    onListeningChange?.(false);
    stopPlayback();
    stopOpenAiListen();
    stopWebSpeech();
    setPhase('idle');
    pushCaption('');
  }, [onListeningChange, pushCaption, stopOpenAiListen, stopPlayback, stopWebSpeech]);

  useEffect(() => {
    if (!active || disabled) {
      stopListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, disabled]);

  useEffect(() => {
    if (!active || variant !== 'dock') {
      setDockMic(null);
      return;
    }
    const sync = () => setDockMic(document.getElementById('console-voice-mic'));
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

  const micButton = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => (listening ? stopListening() : void startListening())}
      aria-label={listening ? 'Stop listening' : 'Click to talk'}
      title={listening ? 'Click to stop' : 'Click the microphone to talk'}
      className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        listening || phase === 'speaking'
          ? 'border-[#00a89d]/80 bg-[#00a89d]/15 animate-pulse'
          : 'border-[#00a89d]/45 bg-[#00a89d]/08 hover:border-[#00a89d]/70 hover:bg-[#00a89d]/12'
      }`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[#008f86]">
        <rect x="9" y="2" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );

  if (variant === 'dock') {
    return <>{dockMic ? createPortal(micButton, dockMic) : null}</>;
  }

  return (
    <div className="border-t border-[#e7e0d6] px-5 py-3">
      <div className="flex items-center gap-3">
        {micButton}
        <p className="text-[0.78rem] text-[#1b1713]/50">Click the microphone to talk</p>
      </div>
    </div>
  );
}

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
