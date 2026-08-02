'use client';

/**
 * Console Voice — big orb.
 * Accents: 上海 (soft Chinese) | London (裴淳华 / Claire Foy British).
 * Tap orb → speak → words show → pause → /api/chat.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

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
};

const ACCENTS = [
  {
    key: 'shanghai' as const,
    label: '上海',
    sub: 'Shanghai Chinese',
    voiceId: 'Ca5bKgudqKJzq8YRFoAz', // Coco Li
    lang: 'zh-CN',
  },
  {
    key: 'london' as const,
    label: 'London',
    sub: '裴淳华 · British',
    voiceId: 'MWUpoNpAY0rOQGP294mF', // Clarice — posh British
    lang: 'en-GB',
  },
] as const;

type AccentKey = (typeof ACCENTS)[number]['key'];
const STORAGE_ACCENT = 'aileena.console.voiceAccent';

const SENTENCE_RE = /(?<=[.!?。！？…])\s+|(?<=\n)/;
const SPEECH_THRESH = 0.018;
const SILENCE_END_MS = 380;
const MIN_SPEECH_MS = 160;
const COOLDOWN_MS = 400;
const WEB_RETRY_MS = 120;
const WEB_BUSY_RETRY_MS = 200;
const COMMIT_MS = 700;

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
}: Props) {
  const [caps, setCaps] = useState<Caps>({
    whisper: false,
    tts: false,
    mode: 'webspeech',
    provider: 'none',
  });
  const [accent, setAccent] = useState<AccentKey>('shanghai');
  const [listening, setListening] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'listening' | 'hearing' | 'speaking'>('idle');
  const [level, setLevel] = useState(0);
  const [caption, setCaption] = useState('');
  const onLiveCaptionRef = useRef(onLiveCaption);
  onLiveCaptionRef.current = onLiveCaption;

  const pushCaption = useCallback((text: string) => {
    setCaption(text);
    onLiveCaptionRef.current?.(text);
  }, []);

  const playCtxRef = useRef<AudioContext | null>(null);
  const voiceIdRef = useRef<string>(ACCENTS[0].voiceId);
  const sttLangRef = useRef<string>(ACCENTS[0].lang);
  const accentRef = useRef<AccentKey>('shanghai');
  const playGenRef = useRef(0);
  const nextPlayAtRef = useRef(0);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const lastSpokenIdRef = useRef('');
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
  const finalBufRef = useRef('');
  const commitTimerRef = useRef(0);
  const startingRef = useRef(false);
  const meterRafRef = useRef(0);
  busyRef.current = busy;
  listeningRef.current = listening;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACCENT) as AccentKey | null;
      if (saved && ACCENTS.some((a) => a.key === saved)) setAccent(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const a = ACCENTS.find((x) => x.key === accent) ?? ACCENTS[0];
    accentRef.current = accent;
    voiceIdRef.current = a.voiceId;
    sttLangRef.current = a.lang;
    try {
      localStorage.setItem(STORAGE_ACCENT, accent);
    } catch {
      /* ignore */
    }
  }, [accent]);

  useEffect(() => {
    fetch('/api/voice/caps')
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d === 'object') {
          setCaps({
            whisper: Boolean(d.whisper),
            tts: Boolean(d.tts),
            mode: d.mode === 'openai' || d.mode === 'mixed' ? d.mode : 'webspeech',
            provider:
              d.provider === 'elevenlabs' || d.provider === 'openai' ? d.provider : 'none',
          });
        }
      })
      .catch(() => undefined);
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
        sourcesRef.current = sourcesRef.current.filter((x) => x !== src);
        if (!sourcesRef.current.length && gen === playGenRef.current) {
          ttsPlayingRef.current = false;
          setPhase(listeningRef.current ? 'listening' : 'idle');
        }
      };
    },
    [ensurePlayCtx],
  );

  const speakBrowser = useCallback((text: string, gen: number) => {
    return new Promise<void>((resolve) => {
      if (!window.speechSynthesis || gen !== playGenRef.current) {
        resolve();
        return;
      }
      const lang = sttLangRef.current;
      const u = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const pick =
        lang.startsWith('zh')
          ? voices.find((v) => /zh|cmn|chinese/i.test(`${v.lang} ${v.name}`)) ||
            voices.find((v) => v.lang.toLowerCase().startsWith('zh'))
          : voices.find((v) => /en[-_]?(GB|UK)/i.test(v.lang)) ||
            voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
            null;
      if (pick) u.voice = pick;
      u.lang = lang;
      u.rate = lang.startsWith('zh') ? 0.94 : 0.96;
      u.pitch = lang.startsWith('zh') ? 1.05 : 1;
      ttsPlayingRef.current = true;
      setPhase('speaking');
      u.onend = () => {
        ttsPlayingRef.current = false;
        setPhase(listeningRef.current ? 'listening' : 'idle');
        resolve();
      };
      u.onerror = () => {
        ttsPlayingRef.current = false;
        resolve();
      };
      window.speechSynthesis.speak(u);
    });
  }, []);

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
          body: JSON.stringify({ text: t.slice(0, 4000), voice: voiceIdRef.current }),
        });
        if (!res.ok) throw new Error('tts');
        const ab = await res.arrayBuffer();
        if (gen !== playGenRef.current) return;
        const buf = await ensurePlayCtx().decodeAudioData(ab.slice(0));
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
    const rough = full.slice(cursor).split(SENTENCE_RE).filter((s) => s.trim());
    let walk = cursor;
    for (let i = 0; i < rough.length; i++) {
      const p = rough[i].trim();
      if (!p) continue;
      const at = full.indexOf(p, walk);
      if (at < 0) break;
      const end = at + p.length;
      const isLast = i === rough.length - 1;
      const complete = terminal.test(p) || p.length >= 56;
      if (isLast && speakStreaming && !complete) break;
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
      finalBufRef.current = '';
      pushCaption('');
      onAsk(t);
    },
    [disabled, onAsk, pushCaption, stopPlayback],
  );

  const pickMime = () => {
    for (const m of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']) {
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
    pushCaption('Hearing…');
    try {
      const ext = (blob.type || '').includes('mp4') ? 'm4a' : 'webm';
      const res = await fetch(`/api/transcribe?filename=audio.${ext}`, {
        method: 'POST',
        headers: { 'Content-Type': blob.type || 'audio/webm' },
        body: blob,
      });
      const data = (await res.json()) as { ok?: boolean; text?: string };
      if (data.ok && data.text) {
        pushCaption(data.text);
        handleUtterance(data.text);
      } else if (listeningRef.current) {
        setPhase('listening');
        pushCaption('Listening…');
      }
    } catch {
      if (listeningRef.current) {
        setPhase('listening');
        pushCaption('Listening…');
      }
    }
  }, [handleUtterance, pushCaption]);

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
    cancelAnimationFrame(meterRafRef.current);
    meterRafRef.current = 0;
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
    if (commitTimerRef.current) {
      window.clearTimeout(commitTimerRef.current);
      commitTimerRef.current = 0;
    }
    if (webRecRef.current) {
      try {
        webRecRef.current.onend = null;
        webRecRef.current.onresult = null;
        webRecRef.current.onerror = null;
        webRecRef.current.stop();
      } catch {
        /* ignore */
      }
      webRecRef.current = null;
    }
  }, []);

  const startWebSpeech = useCallback(async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) throw new Error('no Web Speech');

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isSafari =
      /safari/i.test(ua) && !/chrome|crios|chromium|edg|android/i.test(ua);
    const useContinuous = !isSafari;

    clearTimeout(webRestartRef.current);
    if (webRecRef.current) {
      try {
        webRecRef.current.onend = null;
        webRecRef.current.onresult = null;
        webRecRef.current.onerror = null;
        webRecRef.current.stop();
      } catch {
        /* ignore */
      }
      webRecRef.current = null;
    }

    // Don't hold getUserMedia while SpeechRecognition runs (kills transcripts).
    cancelAnimationFrame(meterRafRef.current);
    meterRafRef.current = 0;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;

    try {
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
      probe.getTracks().forEach((t) => t.stop());
    } catch {
      throw new Error('mic blocked');
    }

    const pulse = () => {
      if (!listeningRef.current) {
        setLevel(0);
        return;
      }
      setLevel(28 + Math.round((Math.sin(Date.now() / 180) + 1) * 28));
      meterRafRef.current = requestAnimationFrame(pulse);
    };
    meterRafRef.current = requestAnimationFrame(pulse);

    const rec = new SR();
    webRecRef.current = rec;
    rec.lang = sttLangRef.current;
    rec.interimResults = true;
    rec.continuous = useContinuous;
    try {
      (rec as SpeechRecognition & { maxAlternatives?: number }).maxAlternatives = 1;
    } catch {
      /* ignore */
    }

    let lastInterim = '';

    rec.onstart = () => {
      setPhase('listening');
      if (!finalBufRef.current) pushCaption('Listening… speak');
    };
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      if (e.error === 'not-allowed') {
        pushCaption('Mic blocked — allow mic, tap orb again');
        listeningRef.current = false;
        setListening(false);
        onListeningChange?.(false);
        return;
      }
      if (e.error === 'network') {
        pushCaption('Speech network error — check Wi‑Fi, tap orb again');
        return;
      }
      pushCaption(`Mic error: ${e.error}`);
    };
    rec.onend = () => {
      if (lastInterim) {
        finalBufRef.current = `${finalBufRef.current} ${lastInterim}`.trim();
        lastInterim = '';
        if (finalBufRef.current) pushCaption(finalBufRef.current);
      }
      if (finalBufRef.current && !commitTimerRef.current && listeningRef.current) {
        commitTimerRef.current = window.setTimeout(() => {
          commitTimerRef.current = 0;
          const text = finalBufRef.current.trim();
          finalBufRef.current = '';
          if (text) handleUtterance(text);
        }, isSafari ? 250 : COMMIT_MS);
      }
      if (!listeningRef.current) return;
      const retry = () => {
        if (!listeningRef.current) return;
        if (busyRef.current || ttsPlayingRef.current) {
          webRestartRef.current = window.setTimeout(retry, WEB_BUSY_RETRY_MS);
          return;
        }
        void startWebSpeech().catch(() => undefined);
      };
      webRestartRef.current = window.setTimeout(retry, isSafari ? 220 : WEB_RETRY_MS);
    };
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      let gotFinal = false;
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const piece = (ev.results[i][0]?.transcript || '').trim();
        if (!piece) continue;
        if (ev.results[i].isFinal) {
          finalBufRef.current = `${finalBufRef.current} ${piece}`.trim();
          gotFinal = true;
          lastInterim = '';
        } else {
          interim = interim ? `${interim} ${piece}` : piece;
          lastInterim = interim;
        }
      }
      const live = `${finalBufRef.current} ${interim || lastInterim}`.trim();
      if (live) {
        pushCaption(live);
        setPhase('hearing');
      }
      if (gotFinal) {
        if (ttsPlayingRef.current) stopPlayback();
        if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
        commitTimerRef.current = window.setTimeout(() => {
          commitTimerRef.current = 0;
          const text = finalBufRef.current.trim();
          finalBufRef.current = '';
          if (text) handleUtterance(text);
        }, isSafari ? 350 : COMMIT_MS);
      }
    };
    try {
      rec.start();
    } catch (e) {
      throw e instanceof Error ? e : new Error('speech start failed');
    }
  }, [handleUtterance, onListeningChange, pushCaption, stopPlayback]);

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
    if (disabled || startingRef.current) return;
    startingRef.current = true;
    listeningRef.current = true;
    setListening(true);
    onListeningChange?.(true);
    setPhase('listening');
    finalBufRef.current = '';
    pushCaption('Listening… speak');
    ensurePlayCtx();
    try {
      if (caps.whisper && navigator.mediaDevices && window.MediaRecorder) {
        await startOpenAiListen();
      } else {
        await startWebSpeech();
      }
    } catch (err) {
      listeningRef.current = false;
      setListening(false);
      onListeningChange?.(false);
      setPhase('idle');
      const msg = err instanceof Error ? err.message : 'mic blocked';
      pushCaption(
        msg.includes('Speech') || msg.includes('speech')
          ? 'This browser has no speech API — try Safari or Chrome'
          : 'Allow microphone, then tap the orb',
      );
    } finally {
      startingRef.current = false;
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
    if (commitTimerRef.current) {
      window.clearTimeout(commitTimerRef.current);
      commitTimerRef.current = 0;
    }
    const pending = finalBufRef.current.trim();
    finalBufRef.current = '';
    stopPlayback();
    stopOpenAiListen();
    stopWebSpeech();
    setPhase('idle');
    setLevel(0);
    if (pending) onAsk(pending);
    else pushCaption('');
  }, [onAsk, onListeningChange, pushCaption, stopOpenAiListen, stopPlayback, stopWebSpeech]);

  const selectAccent = useCallback(
    (key: AccentKey) => {
      if (key === accentRef.current) return;
      stopPlayback();
      setAccent(key);
      // Restart STT with new language if currently listening
      if (listeningRef.current) {
        stopWebSpeech();
        finalBufRef.current = '';
        window.setTimeout(() => {
          if (listeningRef.current) void startWebSpeech().catch(() => undefined);
        }, 80);
      }
    },
    [startWebSpeech, stopPlayback, stopWebSpeech],
  );

  useEffect(() => {
    if (!active || disabled) {
      stopListening();
      return;
    }
    void startListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, disabled]);

  useEffect(() => {
    return () => {
      listeningRef.current = false;
      stopOpenAiListen();
      stopWebSpeech();
      stopPlayback();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!active) return null;

  const activeAccent = ACCENTS.find((a) => a.key === accent) ?? ACCENTS[0];
  const label =
    phase === 'speaking' ? '…' : listening ? (phase === 'hearing' ? '…' : 'stop') : 'tap';

  const hint =
    caption ||
    (phase === 'speaking'
      ? 'Speaking…'
      : listening
        ? 'Listening… speak now'
        : 'Tap here to talk — then speak');

  return (
    <div className="border-t border-[#e7e0d6] px-5 py-4 bg-[#faf7f0]/80">
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => (listening ? stopListening() : void startListening())}
          aria-label={listening ? 'Stop listening' : 'Start voice'}
          className={`relative h-[88px] w-[88px] shrink-0 rounded-full border-0 transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 ${
            phase === 'listening' || phase === 'hearing'
              ? 'animate-pulse shadow-[0_0_0_2px_#fffdf8,0_0_0_5px_rgba(0,255,234,0.45),0_14px_42px_rgba(0,168,157,0.4)]'
              : phase === 'speaking'
                ? 'shadow-[0_0_0_2px_#fffdf8,0_0_0_5px_rgba(0,168,157,0.5),0_16px_48px_rgba(0,127,117,0.4)]'
                : 'shadow-[0_0_0_2px_#fffdf8,0_0_0_4px_rgba(0,168,157,0.35),0_12px_36px_rgba(0,127,117,0.28)]'
          }`}
          style={{
            background:
              'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95), transparent 42%), radial-gradient(circle at 60% 65%, rgba(0,200,180,0.55), transparent 52%), radial-gradient(circle at 50% 50%, #7ee8dc 0%, #008f86 45%, #12332f 78%)',
          }}
        >
          <span className="absolute inset-0 grid place-items-center font-mono text-[0.62rem] uppercase tracking-[0.28em] text-white [text-shadow:0_1px_8px_rgba(0,40,36,0.45)]">
            {label}
          </span>
        </button>

        <div className="h-[3px] w-16 overflow-hidden rounded-sm bg-[#1b1713]/08">
          <i
            className="block h-full bg-[#00a89d] transition-[width] duration-75"
            style={{ width: `${level}%`, display: 'block' }}
          />
        </div>

        {/* Shanghai | London (裴淳华) */}
        <div
          className="inline-flex items-stretch gap-1 rounded-lg border border-[#e7e0d6] bg-[#f7f4ee] p-1"
          role="group"
          aria-label="Voice accent"
        >
          {ACCENTS.map((a) => {
            const on = a.key === accent;
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => selectAccent(a.key)}
                title={a.sub}
                aria-pressed={on}
                className={`min-w-[5.5rem] rounded-md px-3 py-2 text-[0.78rem] transition-colors ${
                  on
                    ? 'bg-[#fffdf8] text-[#007d75] shadow-[0_1px_3px_rgba(31,26,20,0.1)] font-medium'
                    : 'text-[#1b1713]/45 hover:text-[#1b1713]/75'
                }`}
              >
                <span className="block leading-tight">{a.label}</span>
                <span className="mt-0.5 block font-mono text-[0.48rem] tracking-[0.12em] uppercase opacity-60">
                  {a.key === 'shanghai' ? '中文' : '裴淳华'}
                </span>
              </button>
            );
          })}
        </div>

        <p className="max-w-full px-2 text-center text-[0.82rem] leading-5 text-[#007d75] whitespace-pre-wrap break-words">
          {hint}
        </p>
        <p className="font-mono text-[0.5rem] tracking-[0.22em] uppercase text-[#1b1713]/35">
          {activeAccent.sub}
          {caps.tts ? '' : ' · browser voice'}
          {listening ? ' · live' : ''}
        </p>
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
