'use client';

/**
 * Voice orb for Aileena · Console — accents: Shanghai | London | Berlin.
 *
 * Transport only — brain stays /api/chat via parent `onAsk`.
 * STT: Whisper+VAD when caps.whisper (Safari: resume AudioContext + fallback
 * to Web Speech); else Web Speech (Safari: non-continuous, new instance).
 * TTS: /api/tts (HTMLAudio on iOS/Safari) with speechSynthesis fallback.
 * Live caption + barge-in + wake-phrase strip from summon path.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

type Caps = {
  whisper: boolean;
  tts: boolean;
  mode: 'openai' | 'webspeech' | 'mixed';
};

type Props = {
  active: boolean;
  busy: boolean;
  disabled?: boolean;
  /** When true and active, start listening once (voice summon). */
  autoListen?: boolean;
  speakText?: string;
  speakId?: string;
  /** Live STT captions — interim + final (streaming input). */
  onLiveCaption?: (text: string, isFinal: boolean) => void;
  onAsk: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
  /** Parent registers startListening to call inside a user-gesture click chain (Safari). */
  onRegisterStart?: (start: () => Promise<void>) => void;
};

const WAKE_STRIP_RE = /^(hey\s+)?aileena\b[,!.?]?\s*/i;

function stripWakePhrase(text: string): string {
  return text
    .replace(WAKE_STRIP_RE, '')
    .replace(/\baileena\b[,!.?]?\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ACCENTS = [
  {
    key: 'shanghai' as const,
    label: 'Shanghai',
    // Bella — free-tier premade (Coco Li library voice is paid-API-only)
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    lang: 'zh-CN',
    hint: 'Soft Chinese (Bella)',
  },
  {
    key: 'london' as const,
    label: 'London',
    voiceId: 'pFZP5JQG7iQjIQuC4Bku', // Lily — free-tier OK
    lang: 'en-GB',
    hint: 'British English',
  },
  {
    key: 'berlin' as const,
    label: 'Berlin',
    voiceId: 'JBFqnCBsd6RMkjVDRZzb', // George — free-tier OK
    lang: 'de-DE',
    hint: 'Berlin German',
  },
] as const;

type AccentKey = (typeof ACCENTS)[number]['key'];
const VOICE_STORAGE_KEY = 'aileena.console.voiceAccent';

const SENTENCE_RE = /(?<=[.!?。！？…])\s+|(?<=\n)/;
const SPEECH_THRESH = 0.018;
const SILENCE_END_MS = 750;
const MIN_SPEECH_MS = 280;
const COOLDOWN_MS = 280;
const WHISPER_WATCHDOG_MS = 2800;
const SAFARI_FINAL_DEBOUNCE_MS = 450;

function isSafariUa(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /safari/i.test(ua) && !/chrome|crios|chromium|edg|android/i.test(ua);
}

export default function AgentVoiceOrb({
  active,
  busy,
  disabled,
  autoListen,
  speakText,
  speakId,
  onLiveCaption,
  onAsk,
  onListeningChange,
  onRegisterStart,
}: Props) {
  // Default tts:false — live Production often has no ElevenLabs; browser voice must work first.
  const [caps, setCaps] = useState<Caps>({ whisper: false, tts: false, mode: 'webspeech' });
  const [listening, setListening] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'listening' | 'hearing' | 'speaking'>('idle');
  const [level, setLevel] = useState(0);
  const [hint, setHint] = useState('Tap orb · speak');
  const [caption, setCaption] = useState('');
  const [accentKey, setAccentKey] = useState<AccentKey>('shanghai');

  const playCtxRef = useRef<AudioContext | null>(null);
  const voiceIdRef = useRef<string>(ACCENTS[0].voiceId);
  const langRef = useRef<string>(ACCENTS[0].lang);
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
  const commitTimerRef = useRef(0);
  const whisperWatchdogRef = useRef(0);
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsPlayingRef = useRef(false);
  const listeningRef = useRef(false);
  const onLiveCaptionRef = useRef(onLiveCaption);
  const busyRef = useRef(busy);
  busyRef.current = busy;
  onLiveCaptionRef.current = onLiveCaption;

  useEffect(() => {
    fetch('/api/voice/caps')
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d === 'object') {
          setCaps({
            whisper: Boolean(d.whisper),
            tts: d.tts !== false,
            mode: d.mode === 'openai' || d.mode === 'mixed' ? d.mode : 'webspeech',
          });
        }
      })
      .catch(() => {
        /* webspeech fallback */
      });
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VOICE_STORAGE_KEY) as AccentKey | null;
      if (saved && ACCENTS.some((p) => p.key === saved)) setAccentKey(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const accent = ACCENTS.find((p) => p.key === accentKey) ?? ACCENTS[0];
    voiceIdRef.current = accent.voiceId;
    langRef.current = accent.lang;
    try {
      localStorage.setItem(VOICE_STORAGE_KEY, accent.key);
    } catch {
      /* ignore */
    }
  }, [accentKey]);

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
    if (htmlAudioRef.current) {
      try {
        htmlAudioRef.current.pause();
        htmlAudioRef.current.removeAttribute('src');
        htmlAudioRef.current.load();
      } catch {
        /* ignore */
      }
      htmlAudioRef.current = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  const selectAccent = useCallback(
    (key: AccentKey) => {
      if (key === accentKey) return;
      stopPlayback();
      setAccentKey(key);
    },
    [accentKey, stopPlayback],
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
      setHint('Speaking…');
      src.onended = () => {
        sourcesRef.current = sourcesRef.current.filter((s) => s !== src);
        if (!sourcesRef.current.length && gen === playGenRef.current) {
          ttsPlayingRef.current = false;
          if (listeningRef.current) {
            setPhase('listening');
            setHint('Listening… speak anytime');
          } else {
            setPhase('idle');
            setHint('Tap orb · speak');
          }
        }
      };
    },
    [ensurePlayCtx],
  );

  const unlockBrowserVoice = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      // Chrome/Safari: first speak() must ride a user gesture or stays silent.
      window.speechSynthesis.getVoices();
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const warm = new SpeechSynthesisUtterance(' ');
      warm.volume = 0;
      warm.rate = 2;
      window.speechSynthesis.speak(warm);
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    try {
      ensurePlayCtx();
    } catch {
      /* ignore */
    }
  }, [ensurePlayCtx]);

  const speakBrowser = useCallback((text: string, gen: number) => {
    return new Promise<void>((resolve) => {
      if (!window.speechSynthesis || gen !== playGenRef.current) {
        resolve();
        return;
      }
      // Chrome: voices often empty until getVoices() / voiceschanged.
      const voices = window.speechSynthesis.getVoices();
      const lang = langRef.current;
      const prefer =
        voices.find((v) => v.lang === lang) ||
        voices.find((v) => v.lang?.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase())) ||
        (lang.startsWith('zh')
          ? voices.find((v) => /zh|cmn|chinese/i.test(`${v.lang} ${v.name}`))
          : null) ||
        null;

      const chunks: string[] = [];
      // Chrome cuts off long utterances — keep chunks short.
      const raw = text.trim();
      if (raw.length <= 180) {
        chunks.push(raw);
      } else {
        const parts = raw.split(/(?<=[.!?。！？…])\s+/);
        let buf = '';
        for (const p of parts) {
          if ((buf + ' ' + p).trim().length > 180) {
            if (buf) chunks.push(buf.trim());
            buf = p;
          } else {
            buf = (buf ? buf + ' ' : '') + p;
          }
        }
        if (buf.trim()) chunks.push(buf.trim());
      }

      ttsPlayingRef.current = true;
      setPhase('speaking');
      setHint('Speaking…');

      const finishIdle = () => {
        ttsPlayingRef.current = false;
        if (listeningRef.current) {
          setPhase('listening');
          setHint('Listening… speak anytime');
        } else {
          setPhase('idle');
          setHint('Tap orb · speak');
        }
        resolve();
      };

      const speakOne = (i: number) => {
        if (gen !== playGenRef.current || i >= chunks.length) {
          finishIdle();
          return;
        }
        const u = new SpeechSynthesisUtterance(chunks[i]);
        u.lang = lang;
        u.rate = lang.startsWith('zh') ? 0.95 : 1.02;
        if (prefer) u.voice = prefer;
        u.onend = () => speakOne(i + 1);
        u.onerror = () => speakOne(i + 1);
        try {
          window.speechSynthesis.resume();
        } catch {
          /* ignore */
        }
        window.speechSynthesis.speak(u);
      };

      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
      } catch {
        /* ignore */
      }
      speakOne(0);
    });
  }, []);

  // After one ElevenLabs failure, stay on browser voice for the session
  // (same as the first orb — machine voice that actually speaks).
  const skipElevenRef = useRef(false);

  const speakSentence = useCallback(
    async (text: string, gen: number) => {
      const t = text.trim();
      if (!t || gen !== playGenRef.current) return;

      // First orb behavior: browser speechSynthesis is the reliable path.
      // Soft ElevenLabs is optional — never block speaking on a 502.
      const tryEleven = caps.tts && !skipElevenRef.current;
      if (!tryEleven) {
        await speakBrowser(t, gen);
        return;
      }

      try {
        const ac = new AbortController();
        const timer = window.setTimeout(() => ac.abort(), 2500);
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: t.slice(0, 4000),
            voice: voiceIdRef.current,
          }),
          signal: ac.signal,
        });
        window.clearTimeout(timer);
        if (!res.ok) {
          skipElevenRef.current = true;
          throw new Error('tts ' + res.status);
        }
        const ab = await res.arrayBuffer();
        if (gen !== playGenRef.current) return;
        if (isSafariUa()) {
          const url = URL.createObjectURL(new Blob([ab], { type: 'audio/mpeg' }));
          const audio = new Audio(url);
          htmlAudioRef.current = audio;
          ttsPlayingRef.current = true;
          setPhase('speaking');
          setHint('Speaking… interrupt anytime');
          await new Promise<void>((resolve) => {
            audio.onended = () => {
              URL.revokeObjectURL(url);
              if (htmlAudioRef.current === audio) htmlAudioRef.current = null;
              ttsPlayingRef.current = false;
              if (listeningRef.current) {
                setPhase('listening');
                setHint('Listening… speak anytime');
              } else {
                setPhase('idle');
                setHint('Tap orb · speak');
              }
              resolve();
            };
            audio.onerror = () => {
              URL.revokeObjectURL(url);
              resolve();
            };
            void audio.play().catch(() => resolve());
          });
          return;
        }
        const ctx = ensurePlayCtx();
        const buf = await ctx.decodeAudioData(ab.slice(0));
        await enqueueBuffer(buf, gen);
      } catch {
        skipElevenRef.current = true;
        await speakBrowser(t, gen);
      }
    },
    [caps.tts, ensurePlayCtx, enqueueBuffer, speakBrowser],
  );

  useEffect(() => {
    if (!active || !speakText?.trim() || !speakId) return;
    if (speakId === lastSpokenIdRef.current) return;
    lastSpokenIdRef.current = speakId;
    const gen = playGenRef.current;
    const full = speakText.trim();
    const parts = full.split(SENTENCE_RE).map((s) => s.trim()).filter(Boolean);
    void (async () => {
      for (const p of parts.length ? parts : [full]) {
        if (gen !== playGenRef.current) break;
        await speakSentence(p, gen);
      }
    })();
  }, [active, speakText, speakId, speakSentence]);

  const pushCaption = useCallback((text: string, isFinal: boolean) => {
    setCaption(text);
    onLiveCaptionRef.current?.(text, isFinal);
  }, []);

  const handleUtterance = useCallback(
    (text: string) => {
      const t = stripWakePhrase(text);
      if (!t || disabled) return;
      const now = Date.now();
      // Allow barge-in while busy/speaking — only soft-throttle identical rapid finals.
      if (now - lastAskAtRef.current < COOLDOWN_MS && !ttsPlayingRef.current && !busyRef.current) {
        return;
      }
      lastAskAtRef.current = now;
      stopPlayback();
      pushCaption(t, true);
      onAsk(t);
      setHint('Heard you · answering…');
    },
    [disabled, onAsk, pushCaption, stopPlayback],
  );

  const pickMime = () => {
    const cands = isSafariUa()
      ? ['audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
      : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
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
    setHint('Got it…');
    try {
      const ext = (blob.type || '').includes('mp4') ? 'm4a' : 'webm';
      const lang = (langRef.current || '').split('-')[0] || '';
      const qs = new URLSearchParams({ filename: `audio.${ext}` });
      if (lang) qs.set('lang', lang);
      const res = await fetch(`/api/transcribe?${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': blob.type || 'audio/webm' },
        body: blob,
      });
      const data = (await res.json()) as { ok?: boolean; text?: string };
      if (data.ok && data.text) handleUtterance(data.text);
      else if (listeningRef.current) {
        setPhase('listening');
        setHint('Listening… speak anytime');
      }
    } catch {
      if (listeningRef.current) {
        setPhase('listening');
        setHint('Listening… speak anytime');
      }
    }
  }, [handleUtterance]);

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
        setHint('Listening… speak anytime');
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

  const startWebSpeech = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) throw new Error('no Web Speech');
    const safari = isSafariUa();

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

    const rec = new SR();
    webRecRef.current = rec;
    rec.lang = langRef.current;
    rec.interimResults = true;
    rec.continuous = !safari;
    rec.onstart = () => {
      setPhase(ttsPlayingRef.current ? 'speaking' : 'listening');
      setHint(ttsPlayingRef.current ? 'Speaking… interrupt anytime' : 'Listening… speak anytime');
    };
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      if (e.error === 'not-allowed') {
        setHint('Mic blocked — allow in Settings');
        listeningRef.current = false;
        setListening(false);
        onListeningChange?.(false);
        return;
      }
      setHint(e.error === 'network' ? 'Speech network error' : 'Mic issue');
    };
    rec.onend = () => {
      // Keep the loop alive even while the model answers — so barge-in works.
      if (!listeningRef.current) return;
      const retry = () => {
        if (!listeningRef.current) return;
        if (busyRef.current && !safari) {
          webRestartRef.current = window.setTimeout(retry, 400);
          return;
        }
        if (safari) {
          try {
            startWebSpeech();
          } catch {
            /* ignore */
          }
        } else {
          try {
            rec.start();
          } catch {
            /* ignore */
          }
        }
      };
      webRestartRef.current = window.setTimeout(retry, safari ? 180 : 120);
    };
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      let interim = '';
      let finalText = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const piece = (ev.results[i][0]?.transcript || '').trim();
        if (!piece) continue;
        if (ev.results[i].isFinal) finalText += (finalText ? ' ' : '') + piece;
        else interim += (interim ? ' ' : '') + piece;
      }
      // Barge-in: any live speech cuts TTS / lets a new turn take over.
      if ((interim || finalText) && ttsPlayingRef.current) {
        stopPlayback();
        setPhase('listening');
        setHint('Listening… speak anytime');
      }
      if (interim) {
        pushCaption(interim, false);
        setHint('Hearing you…');
      }
      if (finalText) {
        pushCaption(finalText, true);
        if (safari) {
          if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
          commitTimerRef.current = window.setTimeout(() => {
            handleUtterance(finalText);
          }, SAFARI_FINAL_DEBOUNCE_MS);
        } else {
          handleUtterance(finalText);
        }
      }
    };
    rec.start();
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
    if (disabled) return;
    unlockBrowserVoice();
    listeningRef.current = true;
    setListening(true);
    onListeningChange?.(true);
    setPhase('listening');
    setHint('Listening… speak anytime');
    ensurePlayCtx();
    window.clearTimeout(whisperWatchdogRef.current);
    try {
      const preferWhisper = caps.whisper && navigator.mediaDevices && window.MediaRecorder;
      if (preferWhisper) {
        await startOpenAiListen();
        const ctx = audioCtxRef.current;
        if (!ctx || ctx.state !== 'running') {
          stopOpenAiListen();
          startWebSpeech();
          setHint('Listening… browser dictation');
        } else {
          whisperWatchdogRef.current = window.setTimeout(() => {
            if (!listeningRef.current || speechActiveRef.current || mediaRecRef.current) return;
            if (isSafariUa()) {
              stopOpenAiListen();
              try {
                startWebSpeech();
                setHint('Listening… browser dictation');
              } catch {
                /* keep whisper */
              }
            }
          }, WHISPER_WATCHDOG_MS);
        }
      } else {
        startWebSpeech();
      }
    } catch {
      listeningRef.current = false;
      setListening(false);
      onListeningChange?.(false);
      setPhase('idle');
      setHint(isSafariUa() ? 'Allow mic in Settings, tap again' : 'Mic unavailable');
    }
  }, [
    caps.whisper,
    disabled,
    ensurePlayCtx,
    onListeningChange,
    startOpenAiListen,
    startWebSpeech,
    stopOpenAiListen,
    unlockBrowserVoice,
  ]);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    setListening(false);
    onListeningChange?.(false);
    window.clearTimeout(whisperWatchdogRef.current);
    stopPlayback();
    stopOpenAiListen();
    stopWebSpeech();
    setPhase('idle');
    setCaption('');
    pushCaption('', false);
    setHint('Tap orb · speak');
  }, [onListeningChange, pushCaption, stopOpenAiListen, stopPlayback, stopWebSpeech]);

  useEffect(() => {
    onRegisterStart?.(startListening);
  }, [onRegisterStart, startListening]);

  useEffect(() => {
    if (!active && listening) stopListening();
  }, [active, listening, stopListening]);

  // Voice summon / Voice toggle: start mic when requested.
  // Prefer parent calling startListening inside the same click chain (onRegisterStart).
  // Effect path still runs for desktop summon; Safari may need a follow-up orb tap.
  useEffect(() => {
    if (!active || !autoListen || disabled || listening) return;
    void startListening().then(() => {
      if (!listeningRef.current && isSafariUa()) {
        setHint('Tap orb to speak');
      }
    });
  }, [active, autoListen, disabled, listening, startListening]);

  useEffect(() => {
    return () => {
      stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!active) return null;

  const activeAccent = ACCENTS.find((p) => p.key === accentKey) ?? ACCENTS[0];

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
            {listening ? (phase === 'speaking' ? '…' : 'Stop') : 'Speak'}
          </span>
        </button>
        <div className="h-[3px] w-16 overflow-hidden rounded-sm bg-[#1b1713]/08">
          <i
            className="block h-full bg-[#00a89d] transition-[width] duration-75"
            style={{ width: `${level}%`, display: 'block' }}
          />
        </div>
        <div
          className="flex w-full max-w-md flex-col items-center gap-2.5"
          role="group"
          aria-label="Accent"
        >
          <p className="font-mono text-[0.7rem] font-medium tracking-[0.28em] uppercase text-[#007d75]">
            City accent
          </p>
          <div
            className={`relative grid w-full grid-cols-3 rounded-full border-2 border-[#00a89d]/55 bg-[#dff5f2] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_8px_24px_rgba(0,168,157,0.12)] ${
              listening ? 'opacity-50' : ''
            }`}
          >
            {/* Sliding thumb */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-1.5 left-1.5 w-[calc((100%-0.75rem)/3)] rounded-full bg-gradient-to-b from-[#1ad4c4] to-[#008f86] shadow-[0_6px_18px_rgba(0,168,157,0.5)] transition-transform duration-300 ease-out"
              style={{
                transform: `translateX(${Math.max(0, ACCENTS.findIndex((a) => a.key === accentKey)) * 100}%)`,
              }}
            />
            {ACCENTS.map((p) => {
              const on = p.key === accentKey;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => selectAccent(p.key)}
                  title={p.hint}
                  disabled={listening}
                  aria-pressed={on}
                  className={`relative z-10 rounded-full px-2 py-3 font-mono text-[0.78rem] uppercase tracking-[0.12em] transition-colors duration-200 disabled:cursor-not-allowed ${
                    on ? 'font-semibold text-white' : 'text-[#1b1713]/45 hover:text-[#007d75]'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
        <p className="min-h-[1.2rem] max-w-md px-2 text-center text-[0.85rem] sm:text-[0.95rem] leading-5 sm:leading-6 text-[#007d75]">
          {caption ? (
            <>
              <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-[#00a89d] align-middle" />
              {caption}
            </>
          ) : (
            <span className="text-[#1b1713]/35 italic">
              {listening ? 'Listening…' : 'Live caption idle'}
            </span>
          )}
        </p>
        <p className="max-w-[20rem] truncate text-center font-mono text-[0.55rem] tracking-[0.18em] uppercase text-[#008f86]/85">
          {hint}
          <span className="hidden sm:inline">
            {' · '}
            {caps.whisper ? 'whisper' : 'dictation'}
            {' · barge-in · '}
            {activeAccent.label}
          </span>
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
