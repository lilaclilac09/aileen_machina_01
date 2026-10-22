'use client';

/**
 * Per-reply "listen" button for the chat transcript. Browser speechSynthesis
 * only — no server route, no key, nothing plays until the visitor taps.
 * Renders nothing where speechSynthesis is missing.
 *
 * One reply speaks at a time. stopReplySpeech() is called by the chat on a
 * new message; it only cancels speech this button started, so the Voice orb
 * keeps its own playback.
 */

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  chunkSpeakableText,
  pickNaturalVoice,
  prepareSpeakText,
  replySpeechLang,
  ttsPitchForLang,
  ttsRateForLang,
} from '../lib/tts';

let activeStop: (() => void) | null = null;

const noopSubscribe = () => () => {};
const browserCanSpeak = () =>
  'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';

export function stopReplySpeech(): void {
  if (!activeStop) return;
  const stop = activeStop;
  activeStop = null;
  stop();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}

export default function SpeakReplyButton({ text }: { text: string }) {
  // Server render and unsupported browsers: false → the button is not drawn.
  const supported = useSyncExternalStore(noopSubscribe, browserCanSpeak, () => false);
  const [speaking, setSpeaking] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (stopRef.current && activeStop === stopRef.current) stopReplySpeech();
    };
  }, []);

  if (!supported) return null;

  const speak = () => {
    if (speaking) {
      stopReplySpeech();
      return;
    }
    const chunks = chunkSpeakableText(prepareSpeakText(text));
    if (!chunks.length) return;
    stopReplySpeech();
    const synth = window.speechSynthesis;
    const lang = replySpeechLang(text);
    const voice = pickNaturalVoice(synth.getVoices(), lang);
    let live = true;
    const stop = () => {
      live = false;
      setSpeaking(false);
    };
    stopRef.current = stop;
    activeStop = stop;
    setSpeaking(true);
    chunks.forEach((chunk, i) => {
      const u = new SpeechSynthesisUtterance(chunk);
      u.lang = voice?.lang || lang;
      if (voice) u.voice = voice;
      u.rate = ttsRateForLang(lang);
      u.pitch = ttsPitchForLang(lang);
      if (i === chunks.length - 1) {
        u.onend = () => {
          if (!live) return;
          if (activeStop === stop) activeStop = null;
          stop();
        };
      }
      u.onerror = () => {
        if (!live) return;
        if (activeStop === stop) activeStop = null;
        stop();
      };
      synth.speak(u);
    });
  };

  return (
    <button
      type="button"
      data-testid="agent-speak-reply"
      onClick={speak}
      aria-pressed={speaking}
      aria-label={speaking ? 'Stop reading this reply' : 'Read this reply aloud'}
      title={speaking ? 'Stop' : 'Listen'}
      className="ml-[1.1rem] mt-1 inline-flex items-center gap-1.5 rounded-full border border-[#00a89d]/25 px-2.5 py-0.5 text-[0.68rem] tracking-[0.06em] text-[#007d75]/80 transition-colors hover:border-[#00a89d]/55 hover:text-[#007d75] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00a89d]/60"
    >
      <span aria-hidden="true">{speaking ? '■' : '▸'}</span>
      {speaking ? 'stop' : 'listen'}
    </button>
  );
}
