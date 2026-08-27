'use client';

/**
 * Voice orb for Aileena · Console — accents: Shanghai | London | Berlin.
 *
 * Transport only — brain stays /api/chat via parent `onAsk`.
 * STT: Whisper+VAD when caps.whisper (Safari: resume AudioContext + fallback
 * to Web Speech); else Web Speech (Safari: non-continuous, new instance).
 * Chrome continuous finals are accumulated + silence-committed (full sentence,
 * not one-word turns). Silence window ~1.8–2.4s; interim never replaces finals.
 * Debug logs on by default ([voice]); set localStorage.aileena_voice_debug='0' to silence.
 * TTS: /api/tts (HTMLAudio on iOS/Safari) with speechSynthesis fallback.
 * Speak only after the assistant stream settles (!busy) — never the first
 * streamed token. Long replies: sentence/clause chunks with short breaths,
 * slower warmer SpeechSynthesis rate/pitch (not PA-broadcast).
 * Live caption + barge-in. Voice path: Console → Voice → speak.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ELEVEN_VOICE_ID,
  parseVoiceAccent,
  VOICE_ACCENT_STORAGE_KEY,
  type VoiceAccent,
} from '../lib/voiceAccent';

type Caps = {
  whisper: boolean;
  tts: boolean;
  mode: 'openai' | 'webspeech' | 'mixed';
};

type Props = {
  active: boolean;
  busy: boolean;
  disabled?: boolean;
  /** When true and active, start listening once (Voice toggle). */
  autoListen?: boolean;
  speakText?: string;
  speakId?: string;
  /** Live STT captions — interim + final (streaming input). */
  onLiveCaption?: (text: string, isFinal: boolean) => void;
  onAsk: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
  /** Parent registers startListening to call inside a user-gesture click chain (Safari). */
  onRegisterStart?: (start: () => Promise<void>) => void;
  /** Parent registers audio unlock to warm HTMLAudio/speechSynthesis in the Voice click. */
  onRegisterUnlock?: (unlock: () => void) => void;
  /** City accent changed — parent starts a new frozen root when one is live. */
  onAccentChange?: (key: VoiceAccent) => void;
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
    voiceId: ELEVEN_VOICE_ID.shanghai,
    lang: 'zh-CN',
    hint: 'Soft Chinese (Bella)',
  },
  {
    key: 'london' as const,
    label: 'London',
    voiceId: ELEVEN_VOICE_ID.london,
    lang: 'en-GB',
    hint: 'British English',
  },
  {
    key: 'berlin' as const,
    label: 'Berlin',
    voiceId: ELEVEN_VOICE_ID.berlin,
    lang: 'de-DE',
    hint: 'Berlin German',
  },
] as const;

type AccentKey = VoiceAccent;

/**
 * Sentence / clause boundaries for TTS pacing (never word chunks).
 * Keep punctuation on the preceding piece so pauses land after ，。！？ etc.
 * Chinese 。！？ rarely have a following space — split without requiring \s.
 */
const SPEAK_BOUNDARY_RE =
  /(?<=[。！？…])|(?<=[.!?])\s+|(?<=[；;])\s*|(?<=[：:])\s*|(?<=[，、])|(?<=[,])\s+|(?<=\n+)/;

/** Split a finished reply into speakable sentence/clause chunks (never by word). */
function splitSpeakableChunks(full: string): string[] {
  const text = full.trim();
  if (!text) return [];

  const raw = text
    .split(SPEAK_BOUNDARY_RE)
    .map((s) => s.trim())
    .filter(Boolean);
  if (raw.length <= 1) return [text];

  // Merge tiny fragments so we don't sound choppy; still prefer short breaths.
  const out: string[] = [];
  let buf = '';
  for (const s of raw) {
    const prev = buf.slice(-1);
    const noSpace =
      Boolean(buf) &&
      (/[\u4e00-\u9fff]/.test(prev) || /[，。！？、；：…]/.test(prev)) &&
      /^[\u4e00-\u9fff]/.test(s);
    const next = buf ? `${buf}${noSpace ? '' : ' '}${s}` : s;
    const softCap = /[.!?。！？…]$/.test(buf) ? 1 : /[;；：:]$/.test(buf) ? 90 : 140;
    if (buf && (buf.length >= softCap || next.length > 180)) {
      out.push(buf);
      buf = s;
    } else {
      buf = next;
    }
  }
  if (buf) out.push(buf);
  return out.length ? out : [text];
}

/** Primary utterance lang from text script (accent used as English/German hint). */
function detectUtteranceLang(text: string, accentLang: string): string {
  const zh = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const de = (text.match(/[äöüÄÖÜß]/g) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  if (zh >= 2 && zh >= latin * 0.25) return 'zh-CN';
  if (accentLang.startsWith('de') && (de > 0 || latin > zh)) return 'de-DE';
  if (accentLang.startsWith('en-GB')) return 'en-GB';
  if (accentLang.startsWith('en')) return 'en-US';
  if (latin > 0 && zh === 0) return accentLang.startsWith('zh') ? 'en-US' : accentLang;
  return accentLang || 'en-US';
}

/** Prefer warmer local / neural voices; avoid novelty and overly “PA system” picks. */
function pickNaturalVoice(
  voices: SpeechSynthesisVoice[],
  lang: string,
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const base = lang.slice(0, 2).toLowerCase();
  const pool = voices.filter((v) => {
    const hay = `${v.lang} ${v.name}`.toLowerCase();
    if (v.lang?.toLowerCase() === lang.toLowerCase()) return true;
    if (v.lang?.toLowerCase().startsWith(base)) return true;
    if (base === 'zh') return /zh|cmn|chinese|华文|中文/.test(hay);
    return false;
  });
  const list = pool.length ? pool : voices;

  const score = (v: SpeechSynthesisVoice): number => {
    const n = `${v.name} ${v.lang}`.toLowerCase();
    let s = 0;
    if (v.localService) s += 4;
    if (v.lang?.toLowerCase() === lang.toLowerCase()) s += 5;
    else if (v.lang?.toLowerCase().startsWith(base)) s += 2;
    if (/neural|natural|enhanced|premium|online \(natural\)|premium online/.test(n)) s += 8;
    if (/google|microsoft|apple|siri/.test(n)) s += 3;
    if (base === 'zh' && /tingting|mei-jia|meijia|xiaoxiao|xiaoyi|yunxi|sin-ji|li-mu|hanhan|yaoyao/.test(n)) {
      s += 7;
    }
    if (base === 'en') {
      const gb = /en-gb|uk english|british|gbr|daniel|serena|hazel|kate|libby|sonia/.test(n) || v.lang?.toLowerCase() === 'en-gb';
      const us = /en-us|us english|samantha|aaron|google us english/.test(n);
      if (lang.toLowerCase() === 'en-gb') {
        if (gb) s += 10;
        if (us) s -= 8;
      } else if (/samantha|karen|moira|serena|fiona|martha|aria|jenny|google us english|google uk english|siri/.test(n)) {
        s += 7;
      }
    }
    // Soften “customer service / PA” defaults without blocking them entirely.
    // Daniel is the common British system voice — do not penalize it for en-GB.
    if (/microsoft david|microsoft mark|alex\b|ralph|bruce/.test(n)) s -= 3;
    if (lang.toLowerCase() !== 'en-gb' && /daniel\b/.test(n)) s -= 3;
    if (/compact|eloquence|novelty|whisper|zarvox|bad news|bahh|boing|bells|cellos|trinoids/.test(n)) {
      s -= 12;
    }
    return s;
  };

  return list.slice().sort((a, b) => score(b) - score(a))[0] ?? null;
}

/** Breath between chunks — longer after sentence/paragraph, shorter after commas. */
function pauseAfterChunkMs(chunk: string, isLast: boolean): number {
  if (isLast) return 0;
  if (/\n/.test(chunk)) return 480;
  if (/[.!?。！？…]\s*$/.test(chunk)) return 380;
  if (/[;；：:]\s*$/.test(chunk)) return 300;
  if (/[,，、]\s*$/.test(chunk)) return 240;
  return 320;
}

function ttsRateForLang(lang: string): number {
  if (lang.startsWith('zh')) return 0.85;
  if (lang.startsWith('de')) return 0.88;
  return 0.9; // en — warm, not call-center rush
}

function ttsPitchForLang(lang: string): number {
  if (lang.startsWith('zh')) return 1.0;
  if (lang.startsWith('de')) return 0.98;
  return 0.98;
}
const SPEECH_THRESH = 0.018;
/** Whisper VAD: end chunk after this much silence (was 900 — cut mid-sentence). */
const SILENCE_END_MS = 1400;
const MIN_SPEECH_MS = 420;
const COOLDOWN_MS = 280;
const WHISPER_WATCHDOG_MS = 2800;
/**
 * Wait after last *final* STT result before committing a user turn.
 * Chrome continuous finalizes word-by-word; 1s was committing one-word turns.
 */
const UTTERANCE_COMMIT_MS = 1800;
/** Extra silence when the buffer is still very short (1–2 tokens). */
const SHORT_UTTERANCE_COMMIT_MS = 2400;
const SAFARI_FINAL_DEBOUNCE_MS = 1600;

/** TEMP voice pipeline debug — always on; set localStorage.aileena_voice_debug='0' to silence. */
function vlog(...args: unknown[]) {
  try {
    if (typeof window === 'undefined') return;
    if (window.localStorage?.getItem('aileena_voice_debug') === '0') return;
    console.log('[voice]', ...args);
  } catch {
    /* ignore */
  }
}

function commitDelayFor(text: string, baseMs: number): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words > 0 && words <= 2) return Math.max(baseMs, SHORT_UTTERANCE_COMMIT_MS);
  return baseMs;
}

function isSafariUa(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /safari/i.test(ua) && !/chrome|crios|chromium|edg|android/i.test(ua);
}

/** iPhone/iPad (any browser) — WebKit gesture / autoplay rules. */
function isIosUa(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/** Phone / tablet: require orb tap to start STT (autoListen often fails). */
function needsTapToSpeak(): boolean {
  if (typeof window === 'undefined') return false;
  if (isIosUa() || isSafariUa()) return true;
  try {
    return window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

/** Prefer HTMLAudio talk-back (iOS / Safari). */
function preferHtmlAudioTts(): boolean {
  return isIosUa() || isSafariUa();
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
  onRegisterUnlock,
  onAccentChange,
}: Props) {
  // Default tts:false — live Production often has no ElevenLabs; browser voice must work first.
  const [caps, setCaps] = useState<Caps>({ whisper: false, tts: false, mode: 'webspeech' });
  const [listening, setListening] = useState(false);
  const [phase, setPhase] = useState<
    'idle' | 'listening' | 'hearing' | 'thinking' | 'speaking' | 'mic-blocked'
  >('idle');
  const [level, setLevel] = useState(0);
  const [hint, setHint] = useState('Tap speak to start');
  const [caption, setCaption] = useState('');
  const [accentKey, setAccentKey] = useState<AccentKey>('shanghai');
  const [accentReady, setAccentReady] = useState(false);
  const [needsHearTap, setNeedsHearTap] = useState(false);

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
  const finalAccumRef = useRef('');
  const interimRef = useRef('');
  const whisperWatchdogRef = useRef(0);
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingHearRef = useRef<{ url: string; gen: number } | null>(null);
  const webMeterStreamRef = useRef<MediaStream | null>(null);
  const webMeterRafRef = useRef(0);
  const stickyErrorRef = useRef(false);
  const ttsPlayingRef = useRef(false);
  const listeningRef = useRef(false);
  /** User tapped stop — do not auto-restart recognition. */
  const manualStopRef = useRef(false);
  /** Guard against tight onend → start loops. */
  const restartCountRef = useRef(0);
  const restartWindowRef = useRef(0);
  const pauseWebSpeechForTtsRef = useRef<() => void>(() => {});
  const kickWebSpeechRestartRef = useRef<() => void>(() => {});
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
    let saved: AccentKey = 'shanghai';
    try {
      const parsed = parseVoiceAccent(localStorage.getItem(VOICE_ACCENT_STORAGE_KEY));
      if (parsed && ACCENTS.some((p) => p.key === parsed)) saved = parsed;
    } catch {
      /* ignore */
    }
    const accent = ACCENTS.find((p) => p.key === saved) ?? ACCENTS[0];
    voiceIdRef.current = accent.voiceId;
    langRef.current = accent.lang;
    setAccentKey(saved);
    setAccentReady(true);
  }, []);

  useEffect(() => {
    if (!accentReady) return;
    const accent = ACCENTS.find((p) => p.key === accentKey) ?? ACCENTS[0];
    voiceIdRef.current = accent.voiceId;
    langRef.current = accent.lang;
    try {
      localStorage.setItem(VOICE_ACCENT_STORAGE_KEY, accent.key);
    } catch {
      /* ignore */
    }
  }, [accentKey, accentReady]);

  const ensurePlayCtx = useCallback(() => {
    if (!playCtxRef.current) {
      playCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (playCtxRef.current.state === 'suspended') void playCtxRef.current.resume();
    return playCtxRef.current;
  }, []);

  const stopPlayback = useCallback(() => {
    playGenRef.current += 1;
    vlog('tts cancel/stopPlayback', { gen: playGenRef.current });
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
    // Keep the HTMLAudio element alive (iOS session unlock); only pause.
    if (htmlAudioRef.current) {
      try {
        htmlAudioRef.current.pause();
        htmlAudioRef.current.removeAttribute('src');
        htmlAudioRef.current.load();
      } catch {
        /* ignore */
      }
    }
    if (pendingHearRef.current) {
      try {
        URL.revokeObjectURL(pendingHearRef.current.url);
      } catch {
        /* ignore */
      }
      pendingHearRef.current = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  const selectAccent = useCallback(
    (key: AccentKey) => {
      if (key === accentKey) return;
      stopPlayback();
      const accent = ACCENTS.find((p) => p.key === key) ?? ACCENTS[0];
      voiceIdRef.current = accent.voiceId;
      langRef.current = accent.lang;
      try {
        localStorage.setItem(VOICE_ACCENT_STORAGE_KEY, key);
      } catch {
        /* ignore */
      }
      setAccentKey(key);
      onAccentChange?.(key);
      if (listeningRef.current && !manualStopRef.current) {
        try {
          startWebSpeechRef.current?.();
        } catch {
          /* recognition restart is best-effort */
        }
      }
    },
    [accentKey, stopPlayback, onAccentChange],
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
      pauseWebSpeechForTtsRef.current();
      setPhase('speaking');
      setCaption('');
      setHint('Speaking…');
      vlog('tts start', { via: 'webaudio' });
      src.onended = () => {
        sourcesRef.current = sourcesRef.current.filter((s) => s !== src);
        if (!sourcesRef.current.length && gen === playGenRef.current) {
          ttsPlayingRef.current = false;
          vlog('tts end', { via: 'webaudio' });
          if (listeningRef.current) {
            setPhase('listening');
            setHint('Listening… speak anytime');
            kickWebSpeechRestartRef.current();
          } else {
            setPhase('idle');
            setHint('Tap speak to start');
          }
        }
      };
    },
    [ensurePlayCtx],
  );

  const ensureHtmlAudio = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!htmlAudioRef.current) {
      const a = new Audio();
      a.setAttribute('playsinline', 'true');
      a.preload = 'auto';
      htmlAudioRef.current = a;
    }
    return htmlAudioRef.current;
  }, []);

  const unlockBrowserVoice = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.speechSynthesis) {
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
    }
    // Warm a long-lived HTMLAudio element for later async /api/tts play on iOS.
    try {
      const a = ensureHtmlAudio();
      if (a) {
        a.src =
          'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
        void a
          .play()
          .then(() => {
            try {
              a.pause();
              a.removeAttribute('src');
              a.load();
            } catch {
              /* ignore */
            }
          })
          .catch(() => {
            /* ignore — unlock best-effort */
          });
      }
    } catch {
      /* ignore */
    }
    try {
      ensurePlayCtx();
    } catch {
      /* ignore */
    }
  }, [ensureHtmlAudio, ensurePlayCtx]);

  const playHtmlBlobUrl = useCallback(
    (url: string, gen: number) => {
      return new Promise<void>((resolve) => {
        const audio = ensureHtmlAudio();
        if (!audio || gen !== playGenRef.current) {
          URL.revokeObjectURL(url);
          resolve();
          return;
        }
        try {
          audio.pause();
        } catch {
          /* ignore */
        }
        audio.src = url;
        ttsPlayingRef.current = true;
        pauseWebSpeechForTtsRef.current();
        setPhase('speaking');
        setCaption('');
        setHint('Speaking… interrupt anytime');
        stickyErrorRef.current = false;
        vlog('tts start', { via: 'htmlaudio' });

        const finish = (revoke: boolean) => {
          if (revoke) {
            try {
              URL.revokeObjectURL(url);
            } catch {
              /* ignore */
            }
          }
          ttsPlayingRef.current = false;
          setNeedsHearTap(false);
          vlog('tts end', { via: 'htmlaudio' });
          if (listeningRef.current) {
            setPhase('listening');
            setHint('Listening… speak anytime');
            kickWebSpeechRestartRef.current();
          } else {
            setPhase('idle');
            setHint('Tap speak to start');
          }
          resolve();
        };

        audio.onended = () => finish(true);
        audio.onerror = () => {
          pendingHearRef.current = { url, gen };
          setNeedsHearTap(true);
          setHint('Tap orb to hear reply');
          stickyErrorRef.current = true;
          ttsPlayingRef.current = false;
          setPhase('idle');
          resolve();
        };
        void audio.play().then(
          () => {
            pendingHearRef.current = null;
            setNeedsHearTap(false);
          },
          () => {
            pendingHearRef.current = { url, gen };
            setNeedsHearTap(true);
            setHint('Tap orb to hear reply');
            stickyErrorRef.current = true;
            ttsPlayingRef.current = false;
            setPhase('idle');
            resolve();
          },
        );
      });
    },
    [ensureHtmlAudio],
  );

  const speakBrowser = useCallback(async (text: string, gen: number) => {
    if (!window.speechSynthesis || gen !== playGenRef.current) return;
    let voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
      voices = await new Promise((resolve) => {
        const finish = () => resolve(window.speechSynthesis.getVoices());
        window.speechSynthesis.addEventListener('voiceschanged', finish, { once: true });
        window.setTimeout(finish, 500);
      });
    }
    return new Promise<void>((resolve) => {
      if (gen !== playGenRef.current) {
        resolve();
        return;
      }

      // Sentence/clause queue — never one long PA-style blast.
      const chunks = splitSpeakableChunks(text);
      vlog('tts speechSynthesis queue', {
        length: text.trim().length,
        chunks: chunks.length,
        preview: text.trim().slice(0, 100),
      });

      ttsPlayingRef.current = true;
      pauseWebSpeechForTtsRef.current();
      setPhase('speaking');
      setCaption('');
      setHint('Speaking…');
      vlog('tts start', { via: 'speechSynthesis' });

      let cancelled = false;
      const pauseTimers: number[] = [];

      const finishIdle = () => {
        if (cancelled) return;
        cancelled = true;
        for (const t of pauseTimers) window.clearTimeout(t);
        ttsPlayingRef.current = false;
        vlog('tts end', { via: 'speechSynthesis' });
        if (listeningRef.current) {
          setPhase('listening');
          setHint('Listening… speak anytime');
          kickWebSpeechRestartRef.current();
        } else {
          setPhase('idle');
          setHint('Tap speak to start');
        }
        resolve();
      };

      const speakOne = (i: number) => {
        if (cancelled || gen !== playGenRef.current) {
          finishIdle();
          return;
        }
        if (i >= chunks.length) {
          finishIdle();
          return;
        }
        const piece = chunks[i];
        const lang = detectUtteranceLang(piece, langRef.current);
        const prefer = pickNaturalVoice(voices, lang);
        const u = new SpeechSynthesisUtterance(piece);
        u.lang = lang;
        u.rate = ttsRateForLang(lang);
        u.pitch = ttsPitchForLang(lang);
        u.volume = 0.92;
        if (prefer) u.voice = prefer;
        u.onstart = () => {
          vlog('tts utterance start', {
            i,
            length: piece.length,
            lang,
            rate: u.rate,
            pitch: u.pitch,
            voice: prefer?.name ?? '(default)',
          });
        };
        u.onend = () => {
          vlog('tts utterance end', { i, length: piece.length });
          if (cancelled || gen !== playGenRef.current) {
            finishIdle();
            return;
          }
          const gap = pauseAfterChunkMs(piece, i >= chunks.length - 1);
          if (gap <= 0) {
            speakOne(i + 1);
            return;
          }
          const tid = window.setTimeout(() => speakOne(i + 1), gap);
          pauseTimers.push(tid);
        };
        u.onerror = (ev) => {
          vlog('tts utterance error', { i, error: (ev as SpeechSynthesisErrorEvent).error });
          if (cancelled || gen !== playGenRef.current) {
            finishIdle();
            return;
          }
          // Skip gap on error — keep the queue moving.
          speakOne(i + 1);
        };
        try {
          window.speechSynthesis.resume();
        } catch {
          /* ignore */
        }
        window.speechSynthesis.speak(u);
      };

      // Clear only once at the start of this reply queue — not per streamed token.
      try {
        window.speechSynthesis.cancel();
        vlog('tts cancel once before reply queue');
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

      const tryHosted = caps.tts && !skipElevenRef.current;
      if (!tryHosted) {
        // iOS speechSynthesis after async chat is unreliable — ask for a tap if needed.
        if (preferHtmlAudioTts()) {
          setHint('No TTS audio — check /api/tts keys, or tap orb after reply');
        }
        await speakBrowser(t, gen);
        return;
      }

      try {
        const ac = new AbortController();
        const timer = window.setTimeout(() => ac.abort(), 8000);
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: t.slice(0, 4000),
            voice: voiceIdRef.current,
            accent: accentKey,
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
        if (preferHtmlAudioTts()) {
          const url = URL.createObjectURL(new Blob([ab], { type: 'audio/mpeg' }));
          await playHtmlBlobUrl(url, gen);
          return;
        }
        const ctx = ensurePlayCtx();
        const buf = await ctx.decodeAudioData(ab.slice(0));
        await enqueueBuffer(buf, gen);
      } catch {
        skipElevenRef.current = true;
        if (preferHtmlAudioTts()) {
          setHint('TTS failed — tap orb after next reply, or check keys');
          stickyErrorRef.current = true;
        }
        await speakBrowser(t, gen);
      }
    },
    [accentKey, caps.tts, ensurePlayCtx, enqueueBuffer, playHtmlBlobUrl, speakBrowser],
  );

  useEffect(() => {
    if (!active || !speakText?.trim() || !speakId) return;
    // Wait until the assistant stream settles — speaking on the first token
    // locks lastSpokenIdRef and produces one-word TTS.
    if (busy) {
      vlog('tts wait for stream end', {
        speakId,
        length: speakText.trim().length,
        preview: speakText.trim().slice(0, 40),
      });
      return;
    }
    if (speakId === lastSpokenIdRef.current) return;
    lastSpokenIdRef.current = speakId;
    const gen = playGenRef.current;
    const full = speakText.trim();
    const parts = splitSpeakableChunks(full);
    // Claim speaking before async work so the stream-end effect does not
    // restart the mic and cancel the utterance mid-start.
    ttsPlayingRef.current = true;
    setPhase('speaking');
    setHint('Speaking…');
    vlog('tts speak full reply', {
      speakId,
      length: full.length,
      chunks: parts.length,
      preview: full.slice(0, 120),
    });
    // One speakSentence for the whole reply — internal queue adds breaths;
    // avoids reopening the mic between sentences.
    void speakSentence(full, gen);
  }, [active, busy, speakText, speakId, speakSentence]);

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
        vlog('utterance throttled', t);
        return;
      }
      lastAskAtRef.current = now;
      stopPlayback();
      // Clear live caption so it doesn't permanently duplicate the transcript line.
      finalAccumRef.current = '';
      interimRef.current = '';
      setCaption('');
      onLiveCaptionRef.current?.('', false);
      vlog('user utterance sent', t);
      onAsk(t);
      setHint('Heard you · answering…');
      setPhase('thinking');
      vlog('orb status → thinking');
    },
    [disabled, onAsk, stopPlayback],
  );

  const scheduleUtteranceCommit = useCallback(
    (delayMs: number) => {
      if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
      commitTimerRef.current = window.setTimeout(() => {
        commitTimerRef.current = 0;
        // Prefer finals; interim-only only if the engine never finalized (rare).
        const finals = finalAccumRef.current.trim();
        const interim = interimRef.current.trim();
        const utterance = (finals || interim).trim();
        if (!utterance) {
          vlog('commit skipped — empty buffer');
          return;
        }
        if (ttsPlayingRef.current) {
          vlog('commit deferred — TTS playing', utterance);
          commitTimerRef.current = window.setTimeout(() => {
            commitTimerRef.current = 0;
            const again = (finalAccumRef.current || interimRef.current).trim() || utterance;
            if (!again || ttsPlayingRef.current) return;
            finalAccumRef.current = '';
            interimRef.current = '';
            handleUtterance(again);
          }, 400);
          return;
        }
        vlog('commit utterance after silence', {
          utterance,
          delayMs,
          from: finals ? 'final' : 'interim-only',
        });
        finalAccumRef.current = '';
        interimRef.current = '';
        handleUtterance(utterance);
      }, delayMs);
    },
    [handleUtterance],
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
      if (data.ok && data.text) {
        vlog('whisper transcript', data.text);
        handleUtterance(data.text);
      } else if (listeningRef.current) {
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

      if (!ttsPlayingRef.current) {
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

  const stopWebSpeechMeter = useCallback(() => {
    cancelAnimationFrame(webMeterRafRef.current);
    webMeterRafRef.current = 0;
    webMeterStreamRef.current?.getTracks().forEach((t) => t.stop());
    webMeterStreamRef.current = null;
    setLevel(0);
  }, []);

  const startWebSpeechMeter = useCallback(async () => {
    stopWebSpeechMeter();
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      webMeterStreamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') await ctx.resume();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        if (!webMeterStreamRef.current) {
          void ctx.close();
          return;
        }
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setLevel(Math.min(100, Math.round(rms * 450)));
        webMeterRafRef.current = requestAnimationFrame(tick);
      };
      webMeterRafRef.current = requestAnimationFrame(tick);
    } catch {
      /* meter is best-effort */
    }
  }, [stopWebSpeechMeter]);

  const stopWebSpeech = useCallback(() => {
    clearTimeout(webRestartRef.current);
    if (commitTimerRef.current) {
      window.clearTimeout(commitTimerRef.current);
      commitTimerRef.current = 0;
    }
    finalAccumRef.current = '';
    interimRef.current = '';
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
    stopWebSpeechMeter();
  }, [stopWebSpeechMeter]);

  /** Soft-stop recognition during TTS without clearing the live accumulators / listening flag. */
  const pauseWebSpeechForTts = useCallback(() => {
    clearTimeout(webRestartRef.current);
    const rec = webRecRef.current;
    if (!rec) return;
    vlog('tts start — pause recognition');
    try {
      // Keep handlers; onend will see ttsPlaying and defer restart.
      rec.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const startWebSpeechRef = useRef<(() => void) | null>(null);

  const kickWebSpeechRestart = useCallback(() => {
    if (!listeningRef.current || manualStopRef.current || ttsPlayingRef.current) return;
    const now = Date.now();
    if (now - restartWindowRef.current > 5000) {
      restartWindowRef.current = now;
      restartCountRef.current = 0;
    }
    restartCountRef.current += 1;
    if (restartCountRef.current > 12) {
      vlog('recognition restart aborted — loop guard');
      setHint('Mic restarted too often — tap orb');
      return;
    }
    const safariLike = isSafariUa() || isIosUa();
    vlog('recognition restart', { safariLike, count: restartCountRef.current });
    if (safariLike) {
      try {
        startWebSpeechRef.current?.();
      } catch {
        /* ignore */
      }
    } else if (webRecRef.current) {
      try {
        webRecRef.current.start();
      } catch {
        try {
          startWebSpeechRef.current?.();
        } catch {
          /* ignore */
        }
      }
    } else {
      startWebSpeechRef.current?.();
    }
  }, []);

  const startWebSpeech = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) throw new Error('no Web Speech');
    const safariLike = isSafariUa() || isIosUa();
    const commitMs = safariLike ? SAFARI_FINAL_DEBOUNCE_MS : UTTERANCE_COMMIT_MS;

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

    void startWebSpeechMeter();

    const rec = new SR();
    webRecRef.current = rec;
    rec.lang = langRef.current;
    rec.interimResults = true;
    // Chrome: continuous so we accumulate a full sentence.
    // Safari/iOS: non-continuous (engine quirk) + restart on end.
    rec.continuous = !safariLike;
    vlog('recognition start', { continuous: rec.continuous, lang: rec.lang, safariLike });
    rec.onstart = () => {
      stickyErrorRef.current = false;
      setPhase(ttsPlayingRef.current ? 'speaking' : busyRef.current ? 'thinking' : 'listening');
      setHint(
        ttsPlayingRef.current
          ? 'Speaking… interrupt anytime'
          : busyRef.current
            ? 'Answering… you can still barge in'
            : 'Listening… speak anytime',
      );
      vlog('recognition onstart', { tts: ttsPlayingRef.current, busy: busyRef.current });
    };
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      vlog('recognition onerror', e.error);
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      if (e.error === 'not-allowed') {
        setHint('mic blocked · allow in browser settings');
        stickyErrorRef.current = true;
        listeningRef.current = false;
        setListening(false);
        onListeningChange?.(false);
        setPhase('mic-blocked');
        vlog('orb status → mic-blocked');
        return;
      }
      stickyErrorRef.current = true;
      setHint(e.error === 'network' ? 'Speech network error — tap orb again' : 'Mic issue — tap orb again');
    };
    rec.onend = () => {
      vlog('recognition onend', {
        listening: listeningRef.current,
        manualStop: manualStopRef.current,
        busy: busyRef.current,
        tts: ttsPlayingRef.current,
        accum: finalAccumRef.current,
        interim: interimRef.current,
      });
      // Chrome auto-ends even with continuous=true. Do NOT flush a short buffer
      // immediately — that caused one-word turns. Keep accumulators; restart;
      // let the silence timer from onresult commit the full utterance.
      if (safariLike && listeningRef.current && (finalAccumRef.current || interimRef.current)) {
        const buf = (finalAccumRef.current || interimRef.current).trim();
        scheduleUtteranceCommit(commitDelayFor(buf, commitMs));
      }
      if (!listeningRef.current || manualStopRef.current) return;
      const retry = () => {
        if (!listeningRef.current || manualStopRef.current) return;
        // Pause restarts while TTS plays (avoid feedback). Resume after TTS ends.
        if (ttsPlayingRef.current) {
          webRestartRef.current = window.setTimeout(retry, 350);
          return;
        }
        kickWebSpeechRestart();
      };
      webRestartRef.current = window.setTimeout(retry, safariLike ? 180 : 120);
    };
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      let interim = '';
      let newFinals = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const piece = (ev.results[i][0]?.transcript || '').trim();
        if (!piece) continue;
        if (ev.results[i].isFinal) newFinals += (newFinals ? ' ' : '') + piece;
        else interim += (interim ? ' ' : '') + piece;
      }
      vlog('recognition result', {
        resultIndex: ev.resultIndex,
        results: ev.results.length,
        newFinals,
        interim,
        accumBefore: finalAccumRef.current,
      });

      // Barge-in: any live speech cuts TTS / lets a new turn take over.
      if ((interim || newFinals) && ttsPlayingRef.current) {
        stopPlayback();
        setPhase('listening');
        setHint('Listening… speak anytime');
        vlog('orb status → listening (barge-in)');
      }

      if (newFinals) {
        // Accumulate finals — never replace the whole buffer with only the latest word.
        finalAccumRef.current = `${finalAccumRef.current} ${newFinals}`.trim();
      }
      // Interim is the *current* hypothesis only (not appended across events).
      interimRef.current = interim;

      const live = `${finalAccumRef.current}${interim ? ` ${interim}` : ''}`.trim();
      if (live) {
        pushCaption(live, Boolean(newFinals) && !interim);
        setPhase('hearing');
        setHint('Hearing you…');
      }

      // Commit only after silence following finals (or extend timer if finals exist).
      // Interim-only updates the live caption — do not send yet.
      if (newFinals) {
        const delay = commitDelayFor(finalAccumRef.current, commitMs);
        scheduleUtteranceCommit(delay);
      } else if (interim && finalAccumRef.current) {
        // Still talking after some finals — keep extending the silence window.
        scheduleUtteranceCommit(commitMs);
      }
    };
    try {
      rec.start();
    } catch (err) {
      vlog('recognition start threw', err);
      throw err;
    }
  }, [
    kickWebSpeechRestart,
    onListeningChange,
    pushCaption,
    scheduleUtteranceCommit,
    startWebSpeechMeter,
    stopPlayback,
  ]);

  startWebSpeechRef.current = startWebSpeech;
  pauseWebSpeechForTtsRef.current = pauseWebSpeechForTts;
  kickWebSpeechRestartRef.current = kickWebSpeechRestart;

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
    stickyErrorRef.current = false;
    manualStopRef.current = false;
    restartCountRef.current = 0;
    listeningRef.current = true;
    setListening(true);
    onListeningChange?.(true);
    setPhase('listening');
    setHint('Listening… speak anytime');
    finalAccumRef.current = '';
    interimRef.current = '';
    ensurePlayCtx();
    window.clearTimeout(whisperWatchdogRef.current);
    vlog('orb listening start', { whisper: caps.whisper });
    try {
      // Prefer Whisper when available (more reliable than Web Speech on iOS).
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
            if (isSafariUa() || isIosUa()) {
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
      setPhase('mic-blocked');
      stickyErrorRef.current = true;
      setHint(
        isIosUa() || isSafariUa()
          ? 'mic blocked · allow in browser settings'
          : 'mic unavailable · tap orb again',
      );
      vlog('orb listening failed / mic blocked');
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
    manualStopRef.current = true;
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
    if (!stickyErrorRef.current) setHint('Tap speak to start');
    vlog('orb listening stop (manual)');
  }, [onListeningChange, pushCaption, stopOpenAiListen, stopPlayback, stopWebSpeech]);

  const onOrbClick = useCallback(() => {
    // Replay blocked TTS from a fresh user gesture (iOS autoplay).
    const pending = pendingHearRef.current;
    if (pending) {
      pendingHearRef.current = null;
      setNeedsHearTap(false);
      stickyErrorRef.current = false;
      void playHtmlBlobUrl(pending.url, pending.gen);
      return;
    }
    if (listening) stopListening();
    else void startListening();
  }, [listening, playHtmlBlobUrl, startListening, stopListening]);

  useEffect(() => {
    onRegisterStart?.(startListening);
  }, [onRegisterStart, startListening]);

  useEffect(() => {
    onRegisterUnlock?.(unlockBrowserVoice);
  }, [onRegisterUnlock, unlockBrowserVoice]);

  useEffect(() => {
    if (!active && listening) stopListening();
  }, [active, listening, stopListening]);

  // Desktop only: Voice toggle may auto-start. Coarse/iOS must tap orb (gesture).
  useEffect(() => {
    if (!active || !autoListen || disabled || listening) return;
    if (needsTapToSpeak()) {
      setHint('Tap speak to start');
      return;
    }
    void startListening().then(() => {
      if (!listeningRef.current) {
        setHint('Tap speak to start');
      }
    });
  }, [active, autoListen, disabled, listening, startListening]);

  // When chat finishes streaming and TTS is not playing, return to listening.
  useEffect(() => {
    if (!listeningRef.current) return;
    if (busy) return;
    if (ttsPlayingRef.current) return;
    if (phase === 'thinking') {
      setPhase('listening');
      setHint('Listening… speak anytime');
      vlog('orb status → listening (stream end)');
      kickWebSpeechRestartRef.current();
    }
  }, [busy, phase]);

  useEffect(() => {
    return () => {
      stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!active) return null;

  const activeAccent = ACCENTS.find((p) => p.key === accentKey) ?? ACCENTS[0];
  const hintIsError =
    needsHearTap ||
    /blocked|error|failed|allow mic|tap orb to hear|unavailable/i.test(hint);
  const hintIsMicBlocked = /mic blocked|mic unavailable|not-allowed|allow in browser/i.test(
    hint,
  );

  const statusLine =
    listening && (phase === 'listening' || phase === 'hearing') && caption.trim()
      ? caption.trim()
      : needsHearTap
        ? 'Tap orb to hear reply'
        : phase === 'mic-blocked'
          ? hint
          : listening
            ? phase === 'speaking'
              ? 'Speaking…'
              : phase === 'thinking'
                ? 'Thinking…'
                : phase === 'hearing'
                  ? 'Hearing you…'
                  : 'Listening…'
            : hintIsError
              ? hint
              : hint && /answering|Speaking|Heard|Got it|Hearing|Thinking/i.test(hint)
                ? hint
                : 'Tap speak to start';

  return (
    <div className="border-t border-[#e7e0d6] px-5 py-2.5 sm:py-3 bg-[#faf7f0]/80">
      {/* Compact but ceremonial — instrument panel, not a squashed form row. */}
      <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-4">
        <button
          type="button"
          disabled={disabled}
          onClick={onOrbClick}
          aria-label={
            needsHearTap ? 'Tap to hear reply' : listening ? 'Stop listening' : 'Start voice'
          }
          className={`relative h-[52px] w-[52px] sm:h-[60px] sm:w-[60px] shrink-0 rounded-full border-0 transition-transform hover:scale-[1.04] disabled:cursor-not-allowed disabled:opacity-40 ${
            phase === 'listening' || phase === 'hearing'
              ? 'animate-pulse shadow-[0_0_0_2px_#fffdf8,0_0_0_4px_rgba(0,255,234,0.38),0_10px_26px_rgba(0,168,157,0.3)]'
              : phase === 'speaking' || phase === 'thinking'
                ? 'shadow-[0_0_0_2px_#fffdf8,0_0_0_4px_rgba(0,168,157,0.42),0_12px_28px_rgba(0,127,117,0.32)]'
                : 'shadow-[0_0_0_2px_#fffdf8,0_0_0_3px_rgba(0,168,157,0.3),0_8px_22px_rgba(0,127,117,0.24)]'
          }`}
          style={{
            background:
              'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95), transparent 42%), radial-gradient(circle at 60% 65%, rgba(0,200,180,0.55), transparent 52%), radial-gradient(circle at 50% 50%, #7ee8dc 0%, #008f86 45%, #12332f 78%)',
          }}
        >
          <span className="absolute inset-0 grid place-items-center font-mono text-[0.5rem] sm:text-[0.52rem] uppercase tracking-[0.22em] text-white [text-shadow:0_1px_8px_rgba(0,40,36,0.45)]">
            {needsHearTap ? 'Hear' : listening ? (phase === 'speaking' ? '…' : 'Stop') : 'Speak'}
          </span>
        </button>

        <div
          className="relative grid h-11 min-h-11 sm:h-12 flex-1 min-w-[16rem] max-w-[20rem] sm:max-w-[22rem] grid-cols-3 items-stretch rounded-full border border-[#00a89d]/28 bg-[#e8f7f4]/90 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
          role="group"
          aria-label="City accent"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-gradient-to-b from-[#1ad4c4] to-[#008f86] shadow-[0_3px_10px_rgba(0,168,157,0.32)] transition-transform duration-300 ease-out"
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
                aria-pressed={on}
                className={`relative z-10 rounded-full px-1.5 font-mono text-[0.6rem] sm:text-[0.64rem] uppercase tracking-[0.12em] transition-colors duration-200 ${
                  on ? 'font-semibold text-white' : 'text-[#1b1713]/32 hover:text-[#007d75]/75'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div
          className="hidden sm:block h-[2px] w-10 shrink-0 overflow-hidden rounded-sm bg-[#1b1713]/06"
          aria-hidden
        >
          <i
            className="block h-full bg-[#00a89d]/80 transition-[width] duration-75"
            style={{ width: `${level}%`, display: 'block' }}
          />
        </div>
      </div>

      <p
        className={`mt-1.5 sm:mt-2 truncate font-mono text-[0.48rem] sm:text-[0.52rem] tracking-[0.14em] uppercase leading-4 ${
          hintIsMicBlocked
            ? 'text-[#8a6a68]/70'
            : hintIsError
              ? 'text-[#8a6a68]/80'
              : 'text-[#1b1713]/40'
        }`}
      >
        {listening && (phase === 'listening' || phase === 'hearing') && caption.trim() ? (
          <>
            <span className="mr-1.5 inline-block h-1 w-1 animate-pulse rounded-full bg-[#00a89d] align-middle" />
            <span className="text-[#1b1713]/35 mr-1.5">
              {phase === 'hearing' ? 'hearing' : 'listening'}
            </span>
            <span className="normal-case tracking-normal text-[#007d75]/80">{statusLine}</span>
          </>
        ) : (
          <span className={hintIsError || hintIsMicBlocked ? undefined : 'text-[#1b1713]/32'}>
            {statusLine}
          </span>
        )}
        <span className="text-[#1b1713]/28">
          {' · '}
          {caps.whisper ? 'whisper' : 'dictation'}
          {' · '}
          <span className="text-[#008f86]/55">
            {activeAccent.key === 'london' ? 'London · British' : activeAccent.label}
          </span>
        </span>
      </p>
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
