'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

/**
 * Spotify-podcast-style narrated-reading card for a blog article.
 *
 * Playback path (in order):
 *   1. POST the article text to /api/tts. If a hosted provider is
 *      configured (ELEVENLABS_API_KEY preferred, then OPENAI_API_KEY), we
 *      get back a real British-female-warmth MP3 and play it via <audio>.
 *      Real-time progress + duration from the audio element.
 *   2. If /api/tts returns 503 (no key configured) or anything else fails,
 *      fall back to the browser's SpeechSynthesis. Lower quality, but
 *      always available; the brief is degraded but the feature still works.
 *
 * The article text is pulled from the DOM at play time
 * (querySelector('.substack-article article')), so the card doesn't need
 * the body passed in.
 */

type Props = {
  title: React.ReactNode;
  date: string;
  category?: string;
};

type Status = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'unsupported';
type Mode = 'hosted' | 'browser';

export default function ArticleNarration({ title, date, category }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [mode, setMode] = useState<Mode | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [errorNote, setErrorNote] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const browserStartTimeRef = useRef<number>(0);
  const browserElapsedAtPauseRef = useRef<number>(0);

  const browserAvailable =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Warm up browser voices so they're ready if we have to fall back.
  useEffect(() => {
    if (!browserAvailable) return;
    const warm = () => {
      window.speechSynthesis.getVoices();
    };
    warm();
    window.speechSynthesis.addEventListener?.('voiceschanged', warm);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', warm);
      window.speechSynthesis.cancel();
    };
  }, [browserAvailable]);

  // Cleanup audio object URL on unmount.
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  // Tick elapsed time while playing in browser mode.
  useEffect(() => {
    if (mode !== 'browser' || status !== 'playing') return;
    const id = setInterval(() => {
      setElapsed(
        browserElapsedAtPauseRef.current +
          (performance.now() - browserStartTimeRef.current) / 1000,
      );
    }, 250);
    return () => clearInterval(id);
  }, [mode, status]);

  function extractText(): string {
    const article = document.querySelector('.substack-article article');
    if (!article) return '';
    const clone = article.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('pre, code, .narration-card').forEach((el) => el.remove());
    const raw = (clone.textContent || '').replace(/\s+/g, ' ').trim();
    return raw.length > 30000 ? raw.slice(0, 30000) : raw;
  }

  function pickBrowserVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const matchers: ((v: SpeechSynthesisVoice) => boolean)[] = [
      (v) =>
        v.lang === 'en-GB' &&
        /female|hazel|kate|serena|susan|emma|amelia|libby|sonia/i.test(v.name),
      (v) => v.lang === 'en-GB' && /google/i.test(v.name),
      (v) => v.lang === 'en-GB',
      (v) =>
        v.lang === 'en-US' &&
        /female|samantha|allison|ava|karen|tessa|nicky/i.test(v.name),
      (v) => v.lang.startsWith('en'),
    ];
    for (const m of matchers) {
      const hit = voices.find(m);
      if (hit) return hit;
    }
    return voices[0];
  }

  function teardownAudio() {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.src = '';
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    audioRef.current = null;
  }

  async function playHosted(text: string): Promise<boolean> {
    setErrorNote(null);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.status === 503) return false; // not configured — silent fallback
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `TTS request failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;

      const a = new Audio(url);
      a.preload = 'auto';
      a.addEventListener('loadedmetadata', () => setDuration(a.duration || 0));
      a.addEventListener('timeupdate', () => {
        setElapsed(a.currentTime);
        if (a.duration > 0) setProgress(a.currentTime / a.duration);
      });
      a.addEventListener('play', () => setStatus('playing'));
      a.addEventListener('pause', () => setStatus('paused'));
      a.addEventListener('ended', () => {
        setStatus('ended');
        setProgress(1);
      });
      a.addEventListener('error', () => setErrorNote('Audio playback failed.'));

      audioRef.current = a;
      setMode('hosted');
      await a.play();
      return true;
    } catch (err) {
      console.error('[narration] hosted failed', err);
      setErrorNote(err instanceof Error ? err.message : String(err));
      return false;
    }
  }

  function playBrowser(text: string) {
    if (!browserAvailable) {
      setStatus('unsupported');
      setErrorNote('No voice available on this device.');
      return;
    }
    setMode('browser');

    const u = new SpeechSynthesisUtterance(text);
    const voice = pickBrowserVoice();
    if (voice) u.voice = voice;
    u.rate = 1.0;
    u.pitch = 1.0;
    u.lang = voice?.lang || 'en-GB';

    const words = text.split(/\s+/).length;
    setDuration((words / 155) * 60);

    u.onstart = () => {
      browserStartTimeRef.current = performance.now();
      browserElapsedAtPauseRef.current = 0;
      setStatus('playing');
    };
    u.onend = () => {
      setStatus('ended');
      setProgress(1);
    };
    u.onpause = () => {
      browserElapsedAtPauseRef.current =
        browserElapsedAtPauseRef.current +
        (performance.now() - browserStartTimeRef.current) / 1000;
      setStatus('paused');
    };
    u.onresume = () => {
      browserStartTimeRef.current = performance.now();
      setStatus('playing');
    };
    u.onboundary = (e) => {
      if (e.name === 'word' && text.length > 0) {
        setProgress(Math.min(1, e.charIndex / text.length));
      }
    };
    u.onerror = () => setStatus('idle');

    utterRef.current = u;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  async function startPlayback() {
    const text = extractText();
    if (!text) return;
    setStatus('loading');
    setProgress(0);
    setElapsed(0);

    const hostedOk = await playHosted(text);
    if (!hostedOk) playBrowser(text);
  }

  function onPlayToggle() {
    // hosted mode: pause / resume / start
    if (mode === 'hosted' && audioRef.current) {
      if (status === 'playing') audioRef.current.pause();
      else if (status === 'paused' || status === 'ended') audioRef.current.play();
      return;
    }
    // browser mode: pause / resume / start
    if (mode === 'browser' && browserAvailable) {
      if (status === 'playing') {
        window.speechSynthesis.pause();
        return;
      }
      if (status === 'paused') {
        window.speechSynthesis.resume();
        return;
      }
    }
    startPlayback();
  }

  function onRestart() {
    teardownAudio();
    if (browserAvailable) window.speechSynthesis.cancel();
    setProgress(0);
    setElapsed(0);
    setMode(null);
    setStatus('idle');
    setTimeout(() => startPlayback(), 50);
  }

  if (!browserAvailable && typeof window !== 'undefined') {
    // No browser TTS AND likely no hosted either — hide the card rather than
    // render a dead button. We optimistically render in SSR; on mount this
    // will run and remove the card if the platform can't do audio at all.
  }

  const isPlaying = status === 'playing';
  const isPaused = status === 'paused';
  const isLoading = status === 'loading';

  const subtitleText = (() => {
    if (errorNote) return errorNote;
    if (isLoading) return 'Generating audio…';
    if (mode === 'hosted')
      return `Voiced by a warm British female narrator${duration > 0 ? ` · ~${Math.max(1, Math.round(duration / 60))} min` : ''}.`;
    if (mode === 'browser')
      return `Voiced live by your browser${duration > 0 ? ` · ~${Math.max(1, Math.round(duration / 60))} min` : ''}.`;
    return 'Press play for a narrated reading — English-accent female where available.';
  })();

  return (
    <div style={cardOuter} className="narration-card">
      <div style={cover} aria-hidden>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 144 144"
          style={{ position: 'absolute', inset: 0 }}
        >
          <defs>
            <radialGradient id="narr-grad" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#0e2a2e" />
              <stop offset="100%" stopColor="#070b0d" />
            </radialGradient>
          </defs>
          <rect width="144" height="144" fill="url(#narr-grad)" />
          <circle cx="72" cy="72" r="50" fill="none" stroke="#00ffea" strokeOpacity="0.22" />
          <circle cx="72" cy="72" r="34" fill="none" stroke="#00ffea" strokeOpacity="0.18" />
          <circle cx="72" cy="72" r="20" fill="none" stroke="#00ffea" strokeOpacity="0.32" />
          <g transform="translate(72,72)" fill="#00ffea" fillOpacity="0.55">
            <rect x="-22" y="-3" width="3" height="6" rx="1" />
            <rect x="-15" y="-7" width="3" height="14" rx="1" />
            <rect x="-8" y="-11" width="3" height="22" rx="1" />
            <rect x="-1" y="-8" width="3" height="16" rx="1" />
            <rect x="6" y="-13" width="3" height="26" rx="1" />
            <rect x="13" y="-6" width="3" height="12" rx="1" />
            <rect x="20" y="-4" width="3" height="8" rx="1" />
          </g>
        </svg>
        <div style={coverTopBadge}>{(category || 'Dispatch').toUpperCase()}</div>
        <div style={coverBottomBadge}>AILEENA · NARRATION</div>
      </div>

      <div style={info}>
        <p style={metaLine}>▸ Narrated reading · {date}</p>
        <h3 style={titleStyle}>{title}</h3>
        <p style={subtle}>{subtitleText}</p>

        <div style={progressBg} aria-hidden>
          <div style={{ ...progressFill, width: `${progress * 100}%` }} />
        </div>

        <div style={controls}>
          <span style={time}>{fmt(elapsed)}</span>
          <div style={{ flex: 1 }} />
          <button
            onClick={onRestart}
            style={ghostBtn}
            aria-label="Restart"
            title="Restart"
            disabled={status === 'idle' && progress === 0}
          >
            ↺
          </button>
          <button
            onClick={onPlayToggle}
            style={playBtn}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause' : 'Play'}
            disabled={isLoading}
          >
            {isLoading ? (
              <svg width="14" height="14" viewBox="0 0 14 14">
                <circle
                  cx="7"
                  cy="7"
                  r="5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="20 8"
                  strokeLinecap="round"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 7 7"
                    to="360 7 7"
                    dur="0.9s"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
            ) : isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect x="3" y="2" width="3" height="10" rx="1" />
                <rect x="8" y="2" width="3" height="10" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M3 2 L12 7 L3 12 Z" />
              </svg>
            )}
          </button>
          <span style={time}>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}

function fmt(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${ss.toString().padStart(2, '0')}`;
}

/* ── styles ─────────────────────────────────────────────────── */

const cardOuter: CSSProperties = {
  display: 'flex',
  gap: 18,
  maxWidth: 680,
  margin: '24px auto 8px',
  padding: 16,
  background: 'rgba(18, 20, 22, 0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(0, 255, 234, 0.18)',
  borderRadius: 14,
  boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
  alignItems: 'stretch',
};

const cover: CSSProperties = {
  width: 132,
  height: 132,
  flexShrink: 0,
  position: 'relative',
  borderRadius: 10,
  overflow: 'hidden',
  border: '1px solid rgba(0,255,234,0.14)',
};

const coverTopBadge: CSSProperties = {
  position: 'absolute',
  top: 10,
  left: 12,
  fontFamily: 'monospace',
  fontSize: '0.5rem',
  letterSpacing: '0.28em',
  color: 'rgba(0, 255, 234, 0.72)',
};

const coverBottomBadge: CSSProperties = {
  position: 'absolute',
  bottom: 10,
  left: 12,
  right: 12,
  fontFamily: 'monospace',
  fontSize: '0.46rem',
  letterSpacing: '0.32em',
  color: 'rgba(255,255,255,0.42)',
};

const info: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
};

const metaLine: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.52rem',
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  color: '#00ffea',
  opacity: 0.7,
  margin: '0 0 8px',
};

const titleStyle: CSSProperties = {
  fontFamily: "'Nunito', system-ui, -apple-system, sans-serif",
  fontSize: '1.05rem',
  fontWeight: 600,
  lineHeight: 1.3,
  color: '#fff',
  margin: '0 0 6px',
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  overflow: 'hidden',
};

const subtle: CSSProperties = {
  fontFamily: "'Iowan Old Style', 'Charter', 'Source Serif Pro', serif",
  fontSize: '0.8rem',
  lineHeight: 1.4,
  color: 'rgba(255,255,255,0.45)',
  margin: '0 0 14px',
};

const progressBg: CSSProperties = {
  height: 3,
  background: 'rgba(255,255,255,0.08)',
  borderRadius: 2,
  overflow: 'hidden',
  marginTop: 'auto',
};

const progressFill: CSSProperties = {
  height: '100%',
  background: '#00ffea',
  transition: 'width 0.2s linear',
};

const controls: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginTop: 10,
  fontFamily: 'monospace',
  fontSize: '0.65rem',
  color: 'rgba(255,255,255,0.5)',
};

const time: CSSProperties = {
  minWidth: 36,
  textAlign: 'center',
};

const playBtn: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: '1px solid rgba(0,255,234,0.55)',
  background: 'rgba(0,255,234,0.14)',
  color: '#00ffea',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  transition: 'background 0.15s, border-color 0.15s',
};

const ghostBtn: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'transparent',
  color: 'rgba(255,255,255,0.55)',
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: '0.85rem',
  padding: 0,
  lineHeight: 1,
};
