'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { SYSTEM_PROMPT_LITE } from '../lib/agentContextLite';
import {
  getBrowserAgentAvailability,
  createBrowserSession,
  type Availability as BrowserAvailability,
  type BrowserSession,
} from '../lib/browserAgent';
import { appendUserTopic, readTopicMemory, buildCatchUpGreeting, buildCatchUpHint, clearTopicMemory } from '../lib/articleTopicMemory';
import { matchCanned } from '../lib/agentCannedResponses';
import { composeSoftHint } from '../lib/softOracle';
import {
  isVoiceCodeIntent,
  quotaDayKey as vcodeDayKey,
  readStoredVcodeCount,
  writeStoredVcodeCount,
  VCODE_DAILY_LIMIT,
} from '../lib/voiceCodeIntent';
import SiteLeftChrome from './SiteLeftChrome';
import AgentVoiceOrb from './AgentVoiceOrb';

const STARTER_PROMPTS = [
  "what's her solana stack?",
  'show me her writing on mev',
  'is she available for hire?',
  'Voice → code: sketch a small patch for the Console footer',
];

const DAILY_LIMIT = 20;
const SESSION_KEY = 'aileena_chat_count_daily_v3'; // { date: 'YYYY-MM-DD' local, count: number }
const RUNTIME_KEY = 'aileena_runtime';
type Runtime = 'cloud' | 'browser';

/** Local calendar day — matches how people think “20 questions per day”, not UTC jargon. */
function quotaDayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function readStoredDailyCount(): number {
  try {
    const today = quotaDayKey();
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ count: 0, date: today }));
      return 0;
    }
    const parsed = JSON.parse(raw) as { date?: unknown; count?: unknown };
    if (parsed.date !== today) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ count: 0, date: today }));
      return 0;
    }
    const n = Number(parsed.count);
    return Number.isFinite(n) ? Math.max(0, Math.min(n, 99)) : 0;
  } catch {
    return 0;
  }
}

function writeStoredDailyCount(count: number): void {
  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ count: Math.max(0, Math.min(count, 99)), date: quotaDayKey() }),
    );
  } catch {
    /* private mode — in-memory only */
  }
}

// Shown instead of the provider's raw billing / credit errors.
const MODEL_PAUSE_MSG =
  "I'm pausing for a moment on the model side. Leave a note below if you'd like Aileen to see it, or try again shortly.";
const LEAD_SOFT_AFTER = 5; // soft nudge only — never blocks the daily 20
const LEAD_DISMISS_KEY = 'aileena_lead_state'; // 'sent' | (unset) — historical 'dismissed' values are tolerated but no longer set

/**
 * Aileena · Console
 *
 * Not a chat widget. A command-palette-style overlay that matches the site's
 * SAT-LINK / terminal language. Invoked via `/` from anywhere on the site or
 * via the machina-portrait launcher at the bottom-left of the viewport.
 *
 * Voice: tap Voice in Console (mic unlock in that click) → speak. No always-on
 * name wake — browsers require a gesture; "Say Aileena" was misleading UX.
 *
 * Rate limiting — product promise:
 *   - 20 questions per visitor per local calendar day (not UTC).
 *   - Client: localStorage day key. Server: signed cookie keyed by X-Quota-Day.
 *   - Contact / email is optional outreach — it must never cut the daily 20 short.
 *
 * Auto-forward to Aileen's inbox:
 *   Every chat session is forwarded to her email via /api/chat/forward,
 *   triggered on three signals: 4 s debounce after an assistant response,
 *   on `pagehide` (tab close / navigation), and immediately when the per-
 *   session limit is reached. Snapshots are best-effort via sendBeacon.
 *   Subject line carries a sessionId prefix so Gmail threads them.
 */
type LeadState = 'idle' | 'submitting' | 'sent';

export default function AgentChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sessionCount, setSessionCount] = useState(0);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadState, setLeadState] = useState<LeadState>('idle');
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadOpen, setLeadOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceLive, setVoiceLive] = useState('');
  /** Start orb listen once after Voice toggle / open-agent-chat autoListen. */
  const [autoListen, setAutoListen] = useState(false);
  const [vcodeCount, setVcodeCount] = useState(0);
  const [vcodeBusy, setVcodeBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const welcomedRef = useRef(false);

  const { messages, setMessages, sendMessage, status, error, stop, clearError } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      // Keep server cookie day keyed to the visitor's local calendar day
      // (same as localStorage). UTC-only keys made the counter look stuck
      // between local midnight and UTC midnight.
      headers: () => ({ 'X-Quota-Day': quotaDayKey() }),
      // Cross-session "topic memory" — what this visitor cared about on
      // previous visits, read fresh from localStorage on every request so
      // the server can soft-condition the system prompt on it. See
      // lib/articleTopicMemory.ts.
      body: () => ({ priorTopics: readTopicMemory().topics }),
    }),
  });
  // useChat keeps `error` until the next successful turn. Mute it on reset
  // so a snag doesn't stick across a fresh thread.
  const [errorMuted, setErrorMuted] = useState(false);
  useEffect(() => {
    if (error) setErrorMuted(false);
  }, [error]);
  const showError = Boolean(error) && !errorMuted;

  // Open console → greet first (catch-up if we remember prior topics).
  // Closing clears the transcript (see closeConsole) so this runs fresh each open.
  useEffect(() => {
    if (!open) return;
    if (welcomedRef.current || messages.length > 0) return;
    welcomedRef.current = true;
    const topics = readTopicMemory().topics;
    const greeting = buildCatchUpGreeting(topics);
    const soft = composeSoftHint(topics);
    const text = `${greeting}\n\n— Soft hint: ${soft}`;
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `welcome-${Date.now()}`;
    setMessages([
      {
        id,
        role: 'assistant',
        parts: [{ type: 'text', text }],
      },
    ]);
  }, [open, messages.length, setMessages]);

  // ──────────────── On-device runtime (Chrome Prompt API) ────────────────
  const [runtime, setRuntime] = useState<Runtime>('cloud');
  const [browserAvail, setBrowserAvail] = useState<BrowserAvailability>('unsupported');
  const [browserBusy, setBrowserBusy] = useState(false);
  const browserSessionRef = useRef<BrowserSession | null>(null);
  const browserAbortRef = useRef<AbortController | null>(null);

  // Detect availability once at mount + restore preference.
  useEffect(() => {
    getBrowserAgentAvailability().then(setBrowserAvail);
    try {
      const saved = localStorage.getItem(RUNTIME_KEY);
      if (saved === 'browser' || saved === 'cloud') setRuntime(saved);
    } catch {
      /* ignore */
    }
  }, []);

  // Persist preference whenever it changes.
  useEffect(() => {
    try {
      localStorage.setItem(RUNTIME_KEY, runtime);
    } catch {
      /* ignore */
    }
  }, [runtime]);

  // Tear down session + any in-flight stream on unmount.
  useEffect(() => {
    return () => {
      browserAbortRef.current?.abort();
      browserSessionRef.current?.destroy();
    };
  }, []);

  // The runtime that actually executes: browser only when the user picked it
  // AND the on-device model is ready. Anything else falls through to cloud.
  const browserReady = browserAvail === 'available';
  const activeRuntime: Runtime = runtime === 'browser' && browserReady ? 'browser' : 'cloud';

  // Pre-warm the on-device session as soon as the console opens (or as soon
  // as browser mode becomes the active runtime). Chrome's LanguageModel.create
  // takes 2–5 s the first time — doing it lazily inside sendBrowser pushes
  // that latency onto the user's first keypress→answer. Doing it here hides
  // it behind the "what do I want to ask" beat.
  useEffect(() => {
    if (!open) return;
    if (activeRuntime !== 'browser') return;
    if (browserSessionRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const s = await createBrowserSession(SYSTEM_PROMPT_LITE);
        if (cancelled) {
          s?.destroy();
          return;
        }
        browserSessionRef.current = s;
      } catch {
        // creation failed — sendBrowser will surface a clean error on its
        // own next attempt; we don't need to handle it here.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, activeRuntime]);

  const busy = status === 'submitted' || status === 'streaming' || browserBusy || vcodeBusy;
  // Hard stop only when today's 20 are gone — email must never unlock extra quota.
  const sessionMaxed = sessionCount >= DAILY_LIMIT;
  const vcodeMaxed = vcodeCount >= VCODE_DAILY_LIMIT;
  // Soft nudge after a few turns; contact stays optional for the full daily 20.
  const leadSoftNudge = sessionCount >= LEAD_SOFT_AFTER && leadState !== 'sent';

  // Restore + re-check daily quota. Must run on open / tab focus — otherwise a
  // phone Safari tab left open overnight keeps yesterday's count forever.
  const reconcileDailyQuota = useCallback(() => {
    const next = readStoredDailyCount();
    setSessionCount((prev) => (prev === next ? prev : next));
    const vc = readStoredVcodeCount();
    setVcodeCount((prev) => (prev === vc ? prev : vc));
  }, []);

  useEffect(() => {
    reconcileDailyQuota();
    try {
      // Drop pre-fix keys so UTC-stuck / hard-gate counts can't linger.
      localStorage.removeItem('aileena_chat_count_daily');
      localStorage.removeItem('aileena_chat_count_daily_v2');
      const lead = sessionStorage.getItem(LEAD_DISMISS_KEY);
      if (lead === 'sent') setLeadState('sent');
      else if (typeof document !== 'undefined' && document.cookie.includes('__aileena_lead')) setLeadState('sent');
    } catch {
      /* storage unavailable — ignore */
    }
  }, [reconcileDailyQuota]);

  useEffect(() => {
    if (open) reconcileDailyQuota();
  }, [open, reconcileDailyQuota]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') reconcileDailyQuota();
    };
    window.addEventListener('focus', reconcileDailyQuota);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', reconcileDailyQuota);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reconcileDailyQuota]);

  // Only bump the daily counter after a successful cloud turn (not on 429 / errors).
  const pendingDailyBumpRef = useRef(false);
  const prevStatusRef = useRef(status);
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (!pendingDailyBumpRef.current) return;

    if (status === 'ready' && (prev === 'submitted' || prev === 'streaming')) {
      pendingDailyBumpRef.current = false;
      setSessionCount((prevCount) => {
        const base = readStoredDailyCount();
        const next = Math.max(prevCount, base) + 1;
        writeStoredDailyCount(next);
        return next;
      });
      return;
    }

    if (status === 'error') {
      pendingDailyBumpRef.current = false;
      const raw = error?.message ?? '';
      if (/daily limit|stopped DJing|Fresh set tomorrow|used today's|fresh set lands tomorrow/i.test(raw)) {
        writeStoredDailyCount(DAILY_LIMIT);
        setSessionCount(DAILY_LIMIT);
      }
    }
  }, [status, error]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, status]);

  // Listen for external open events (hero pill, prompt chips, AI Agents
  // callout, voice summon, prophecy hall, etc.). CustomEvent.detail.prompt —
  // if present — triggers an auto-send. detail.voice / detail.autoListen arm
  // the orb. ask is captured via a ref refreshed on every render.
  const askRef = useRef<((text: string) => void) | null>(null);
  const startOrbListenRef = useRef<(() => Promise<void>) | null>(null);
  const unlockOrbAudioRef = useRef<(() => void) | null>(null);

  const unlockMic = useCallback(async () => {
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        s.getTracks().forEach((t) => t.stop());
      }
      return true;
    } catch {
      setInput('Mic blocked — allow microphone in the address bar');
      return false;
    }
  }, []);

  const isPhoneLike = useCallback(() => {
    if (typeof window === 'undefined') return false;
    try {
      if (window.matchMedia('(pointer: coarse)').matches) return true;
    } catch {
      /* ignore */
    }
    const ua = navigator.userAgent || '';
    return (
      /iPad|iPhone|iPod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{
        prompt?: string;
        voice?: boolean;
        autoListen?: boolean;
        prophecy?: string;
        inject?: Array<{ role: 'user' | 'assistant'; text: string }>;
      }>;
      setOpen(true);
      if (ce.detail?.voice || ce.detail?.autoListen) {
        setVoiceMode(true);
        if (ce.detail?.autoListen) setAutoListen(true);
      }
      const inject = ce.detail?.inject;
      if (inject?.length) {
        welcomedRef.current = true;
        setTimeout(() => {
          const lines = inject.map((row) => {
            const id =
              typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `inj-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            return {
              id,
              role: row.role,
              parts: [{ type: 'text' as const, text: row.text }],
            };
          });
          setMessages((prev) => {
            // Drop canned welcome if it raced in before inject.
            const base =
              prev.length === 1 && prev[0]?.role === 'assistant' ? [] : prev;
            return [...base, ...lines];
          });
        }, 80);
        return;
      }
      const prompt = ce.detail?.prophecy || ce.detail?.prompt;
      if (prompt && askRef.current) {
        setTimeout(() => askRef.current?.(prompt), 80);
      }
    };
    window.addEventListener('open-agent-chat', handler);
    return () => window.removeEventListener('open-agent-chat', handler);
  }, [setMessages]);

  // Focus input when opened — skip on touch so iOS keyboard does not cover Console.
  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    const coarse =
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(hover: none)').matches;
    if (coarse) return;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);

  // ──────────────── Auto-forward transcript to Aileen ────────────────
  // sessionId stays stable for the life of this AgentChat instance so Gmail
  // threads multiple snapshots of the same conversation together.
  const sessionIdRef = useRef<string>('');
  if (!sessionIdRef.current) {
    sessionIdRef.current =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `s-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
  }

  // Hash-based dedup: if the transcript hasn't changed since the last forward
  // (e.g. the unload handler fires after the debounced timer already sent),
  // skip the duplicate send.
  const lastForwardedHashRef = useRef<string>('');
  const forwardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const forwardTranscriptNow = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (messages.length === 0) return;
    const transcript = messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      text: getMessageText(m),
    }));
    const hash = `${transcript.length}:${transcript.map((t) => t.text.length).join(',')}`;
    if (hash === lastForwardedHashRef.current) return;
    lastForwardedHashRef.current = hash;
    const payload = JSON.stringify({ sessionId: sessionIdRef.current, transcript });
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon(
          '/api/chat/forward',
          new Blob([payload], { type: 'application/json' }),
        );
      } else {
        fetch('/api/chat/forward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      /* best-effort */
    }
  }, [messages]);

  const scheduleForward = useCallback(() => {
    if (forwardTimerRef.current) clearTimeout(forwardTimerRef.current);
    forwardTimerRef.current = setTimeout(() => {
      forwardTranscriptNow();
    }, 4000);
  }, [forwardTranscriptNow]);

  const closeConsole = useCallback(() => {
    // Flush any pending transcript to inbox before wiping the thread.
    if (forwardTimerRef.current) {
      clearTimeout(forwardTimerRef.current);
      forwardTimerRef.current = null;
    }
    forwardTranscriptNow();

    browserAbortRef.current?.abort();
    browserAbortRef.current = null;
    browserSessionRef.current?.destroy();
    browserSessionRef.current = null;
    setBrowserBusy(false);

    setMessages([]);
    setInput('');
    setErrorMuted(true);
    clearTopicMemory();
    welcomedRef.current = false;
    lastForwardedHashRef.current = '';
    // New Gmail thread for the next conversation.
    sessionIdRef.current =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `s-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;

    setVoiceMode(false);
    setVoiceLive('');
    setLeadOpen(false);
    setLeadError(null);
    setOpen(false);
  }, [forwardTranscriptNow, setMessages]);

  /** Keep console open, wipe thread + topic memory, fresh welcome. */
  const resetChat = useCallback(() => {
    if (forwardTimerRef.current) {
      clearTimeout(forwardTimerRef.current);
      forwardTimerRef.current = null;
    }
    forwardTranscriptNow();

    browserAbortRef.current?.abort();
    browserAbortRef.current = null;
    browserSessionRef.current?.destroy();
    browserSessionRef.current = null;
    setBrowserBusy(false);

    setMessages([]);
    setInput('');
    setErrorMuted(true);
    clearTopicMemory();
    welcomedRef.current = false;
    lastForwardedHashRef.current = '';
    sessionIdRef.current =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `s-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
    setVoiceLive('');
    setLeadOpen(false);
    setLeadError(null);
  }, [forwardTranscriptNow, setMessages]);

  // Phone: lock page scroll while console covers the viewport.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // `/` opens, Esc closes (+ resets transcript), ignore when typing in a field.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeConsole();
        return;
      }
      if (e.key === '/' && !open) {
        const t = e.target as HTMLElement | null;
        const tag = t?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || t?.isContentEditable) return;
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeConsole]);

  // After an assistant response settles (status drops out of streaming),
  // schedule a debounced forward.
  useEffect(() => {
    if (messages.length === 0) return;
    if (status === 'submitted' || status === 'streaming') return;
    const last = messages[messages.length - 1];
    if (last.role !== 'assistant') return;
    scheduleForward();
  }, [messages, status, scheduleForward]);

  // Tab close / navigation away — flush immediately.
  useEffect(() => {
    const handler = () => {
      if (forwardTimerRef.current) clearTimeout(forwardTimerRef.current);
      forwardTranscriptNow();
    };
    window.addEventListener('pagehide', handler);
    return () => window.removeEventListener('pagehide', handler);
  }, [forwardTranscriptNow]);

  // Per-session limit hit — force-flush the final state.
  useEffect(() => {
    if (sessionMaxed && messages.length > 0) {
      if (forwardTimerRef.current) clearTimeout(forwardTimerRef.current);
      forwardTranscriptNow();
    }
  }, [sessionMaxed, messages.length, forwardTranscriptNow]);

  async function ensureBrowserSession(): Promise<BrowserSession | null> {
    if (browserSessionRef.current) return browserSessionRef.current;
    const session = await createBrowserSession(SYSTEM_PROMPT_LITE);
    browserSessionRef.current = session;
    return session;
  }

  async function sendBrowser(text: string) {
    setBrowserBusy(true);
    browserAbortRef.current?.abort();
    const ac = new AbortController();
    browserAbortRef.current = ac;

    const userId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `u-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const assistantId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `a-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Push user + empty assistant placeholder atomically so the typing
    // indicator anchors against the right id even before the first token
    // streams back.
    setMessages((prev) => [
      ...prev,
      { id: userId, role: 'user', parts: [{ type: 'text', text }] },
      { id: assistantId, role: 'assistant', parts: [{ type: 'text', text: '' }] },
    ]);

    try {
      const session = await ensureBrowserSession();
      if (!session) throw new Error('On-device agent unavailable on this browser.');
      const stream = session.promptStreaming(text, { signal: ac.signal });
      let acc = '';
      for await (const chunk of stream) {
        acc += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, parts: [{ type: 'text', text: acc }] }
              : m,
          ),
        );
      }
      const next = readStoredDailyCount() + 1;
      writeStoredDailyCount(next);
      setSessionCount(next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Local agent error.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                parts: [
                  {
                    type: 'text',
                    text: `local agent failed (${msg}). switch to cloud at the top of the console to keep going.`,
                  },
                ],
              }
            : m,
        ),
      );
    } finally {
      setBrowserBusy(false);
    }
  }

  async function sendVoiceCode(trimmed: string) {
    const userId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `u-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const assistantId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `a-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    if (vcodeMaxed || readStoredVcodeCount() >= VCODE_DAILY_LIMIT) {
      setMessages((prev) => [
        ...prev,
        { id: userId, role: 'user', parts: [{ type: 'text', text: trimmed }] },
        {
          id: assistantId,
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text: `You've used today's ${VCODE_DAILY_LIMIT} voice-code proposals. Fresh set tomorrow — ordinary chat still works within the 20/day limit.`,
            },
          ],
        },
      ]);
      setVcodeCount(VCODE_DAILY_LIMIT);
      writeStoredVcodeCount(VCODE_DAILY_LIMIT);
      return;
    }

    setVcodeBusy(true);
    setMessages((prev) => [
      ...prev,
      { id: userId, role: 'user', parts: [{ type: 'text', text: trimmed }] },
      {
        id: assistantId,
        role: 'assistant',
        parts: [{ type: 'text', text: '… drafting a propose-only patch (not applied)' }],
      },
    ]);

    try {
      const res = await fetch('/api/voice-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VCode-Day': vcodeDayKey(),
        },
        body: JSON.stringify({
          prompt: trimmed,
          priorTopics: readTopicMemory().topics,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        proposal?: string;
        error?: string;
        remaining?: number;
        limit?: number;
      };

      if (typeof data.remaining === 'number') {
        const used = Math.max(0, (data.limit ?? VCODE_DAILY_LIMIT) - data.remaining);
        writeStoredVcodeCount(used);
        setVcodeCount(used);
      }

      const reply = data.ok && data.proposal
        ? `▸ voice → code · propose only (no Cursor tokens · not written to disk)\n\n${data.proposal}`
        : data.error ||
          `Voice-code paused (${res.status}). Try again shortly — chat still works.`;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, parts: [{ type: 'text', text: reply }] }
            : m,
        ),
      );

      if (res.ok && data.ok && typeof data.remaining !== 'number') {
        const next = readStoredVcodeCount() + 1;
        writeStoredVcodeCount(next);
        setVcodeCount(next);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'network error';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                parts: [
                  {
                    type: 'text',
                    text: `Voice-code request failed (${msg}). Nothing was written.`,
                  },
                ],
              }
            : m,
        ),
      );
    } finally {
      setVcodeBusy(false);
    }
  }

  function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sessionMaxed) return;

    // Voice / hung streams used to leave status=streaming forever, so typed
    // ↵ did nothing. Abort in-flight turn, then send the new question.
    if (busy) {
      try {
        stop();
      } catch {
        /* ignore */
      }
      try {
        browserAbortRef.current?.abort();
      } catch {
        /* ignore */
      }
      setBrowserBusy(false);
      setVcodeBusy(false);
      try {
        clearError?.();
      } catch {
        /* ignore */
      }
    }

    setInput('');

    // Record what the visitor asked about for cross-session memory. Done
    // for both runtimes so a visitor's browser-mode questions also seed
    // their future cloud-mode visits and vice versa.
    appendUserTopic(trimmed);

    // Voice-to-code path — separate 5/day quota; Machina propose-only (no Cursor).
    if (isVoiceCodeIntent(trimmed)) {
      void sendVoiceCode(trimmed);
      return;
    }

    // Fast path — canned-response short-circuit. Greetings, thanks, meta-
    // questions about the agent itself, top-level CV one-liners. Returns
    // ~10–30 ms (regex match + setState) instead of ~1.5–3 s LLM round-
    // trip. Substantive questions fall through to the real model.
    const canned = matchCanned(trimmed, readTopicMemory().topics);
    if (canned) {
      const userId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `u-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const assistantId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `a-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setMessages((prev) => [
        ...prev,
        { id: userId, role: 'user', parts: [{ type: 'text', text: trimmed }] },
        {
          id: assistantId,
          role: 'assistant',
          parts: [{ type: 'text', text: canned.reply }],
        },
      ]);
      const next = readStoredDailyCount() + 1;
      writeStoredDailyCount(next);
      setSessionCount(next);
      return;
    }

    if (activeRuntime === 'browser') {
      void sendBrowser(trimmed);
    } else {
      pendingDailyBumpRef.current = true;
      sendMessage({ text: trimmed });
    }
  }

  // Keep the externally-callable ref pointed at the latest ask closure so
  // CustomEvent prompt-detail dispatches always invoke the freshest version
  // (with current sessionCount, busy state, lead gate, etc.).
  askRef.current = ask;

  const remaining = Math.max(0, DAILY_LIMIT - sessionCount);
  const vcodeRemaining = Math.max(0, VCODE_DAILY_LIMIT - vcodeCount);

  // When turning voice off, abort any hung stream so typing works again.
  const wasVoiceRef = useRef(false);
  useEffect(() => {
    if (wasVoiceRef.current && !voiceMode) {
      try {
        stop();
      } catch {
        /* ignore */
      }
    }
    wasVoiceRef.current = voiceMode;
  }, [voiceMode, stop]);

  // Latest assistant text for voice TTS (skip welcome canned until user spoke).
  const lastAssistant = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role !== 'assistant') continue;
      const text = getMessageText(m).trim();
      if (!text || text === '…') continue;
      return { id: m.id, text };
    }
    return { id: '', text: '' };
  })();
  const voiceSpeakReady =
    voiceMode &&
    open &&
    Boolean(lastAssistant.id) &&
    messages.some((m) => m.role === 'user');

  // Contact: soft invite after a few turns — collapsed link, never mid-flow.
  const showLeadInvite = open && leadState !== 'sent' && leadSoftNudge;

  function persistLeadState(next: LeadState) {
    setLeadState(next);
    try {
      if (next === 'sent') {
        sessionStorage.setItem(LEAD_DISMISS_KEY, next);
      }
    } catch {
      /* ignore */
    }
  }

  async function submitLead() {
    const email = leadEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLeadError('Enter a valid email.');
      return;
    }
    setLeadError(null);
    setLeadState('submitting');

    // Flatten the live transcript into the shape the API expects.
    const transcript = messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      text: getMessageText(m),
    }));

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: leadName.trim() || undefined,
          transcript,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        const raw = body.error || 'Send failed. Try again.';
        // Never surface inbox/env configuration to visitors.
        if (/inbox not configured|not configured|resend|api key|503/i.test(raw)) {
          setLeadError('Note saving is offline right now.');
        } else {
          setLeadError(raw);
        }
        setLeadState('idle');
        return;
      }
      setLeadOpen(false);
      persistLeadState('sent');
    } catch {
      setLeadError('Network error. Try again.');
      setLeadState('idle');
    }
  }

  // useChat surfaces the raw response body as error.message when the server
  // returns a non-2xx. Our /api/chat returns `{"error":"..."}` for those, so
  // strip the JSON wrapper before showing it to the user.
  const serverErrorText = (() => {
    const raw = error?.message?.trim();
    if (!raw) return '';
    let text = raw;
    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const parsed = JSON.parse(raw) as { error?: unknown };
        if (typeof parsed.error === 'string' && parsed.error.length > 0) {
          text = parsed.error;
        }
      } catch {
        /* fall through */
      }
    }
    // Never surface the provider's billing/credit internals to visitors —
    // this agent isn't a free public service. Map any such error to our line.
    if (/credit balance|too low|insufficient|quota|billing|purchase credits|payment/i.test(text)) {
      return MODEL_PAUSE_MSG;
    }
    if (/hit a snag|snag/i.test(text)) {
      return 'Something went quiet on my side — mind trying that again?';
    }
    return text;
  })();

  return (
    <>
      {/* Unified top-left chrome: avatar + ← Home (when not on /).
          Pages must not render a second Home in this corner. */}
      <SiteLeftChrome onOpenConsole={() => setOpen(true)} consoleOpen={open} />

      {/* Backdrop */}
      <div
        onClick={closeConsole}
        aria-hidden
        className={`fixed inset-0 z-[70] bg-[#fbfaf7]/95 sm:bg-[#fbfaf7]/80 backdrop-blur-md sm:backdrop-blur-sm transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Console card — full-bleed on phone.
          Flex column: header / flexible transcript / compact controls / input.
          Desktop is wider + shorter (≤72vh) so the orb reads as a control node,
          not a hero. Layout/proportions only. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Aileena Console"
        className={`fixed z-[80] inset-0 sm:inset-x-auto sm:inset-y-auto sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[min(760px,calc(100vw-2.5rem))] sm:max-w-[calc(100vw-2.5rem)] h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[72vh] flex flex-col overflow-hidden bg-[#fffdf8] sm:bg-[#fffdf8]/95 border-0 sm:border sm:border-[#ded8ce] shadow-none sm:shadow-[0_24px_80px_-34px_rgba(31,26,20,0.42)] backdrop-blur-md transition-all duration-200 ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-[0.98] sm:scale-[0.96] pointer-events-none'} font-mono`}
        style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace' }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between gap-2 border-b border-[#e7e0d6] px-3 sm:px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[0.6rem] tracking-[0.3em] text-[#00ffea]/80 uppercase truncate">aileena · console</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Runtime toggle — cloud (server) ↔ local (Chrome Prompt API).
                Disabled when the browser doesn't expose window.LanguageModel. */}
            {(() => {
              const canToggle = browserAvail !== 'unsupported';
              const showingLocal = activeRuntime === 'browser';
              const title = !canToggle
                ? 'On-device AI not supported in this browser. Cloud only.'
                : browserAvail === 'downloadable'
                  ? 'On-device model not yet downloaded — first message will trigger the download.'
                  : browserAvail === 'downloading'
                    ? 'On-device model is downloading…'
                    : showingLocal
                      ? 'On-device mode — message stays on your device. Click to switch to cloud.'
                      : 'Cloud mode — full archive. Click to switch to on-device.';
              return (
                <button
                  type="button"
                  onClick={() => {
                    if (!canToggle) return;
                    setRuntime(runtime === 'browser' ? 'cloud' : 'browser');
                  }}
                  disabled={!canToggle}
                  title={title}
                  aria-label={title}
                  className="hidden sm:inline text-[0.55rem] tracking-[0.25em] uppercase px-1 transition-colors disabled:cursor-not-allowed"
                  style={{
                    color: !canToggle
                      ? 'rgba(27,23,19,0.22)'
                      : showingLocal
                        ? '#00a89d'
                        : 'rgba(27,23,19,0.48)',
                  }}
                >
                  {showingLocal ? '◆ local' : '○ cloud'}
                </button>
              );
            })()}
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00ffea] shadow-[0_0_6px_rgba(0,255,234,0.9)] animate-pulse" />
              <span className="text-[0.55rem] tracking-[0.25em] text-[#00ffea]/60 uppercase">live</span>
            </div>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  const turningOff = voiceMode;
                  if (turningOff) {
                    setVoiceMode(false);
                    setInput('');
                    setVoiceLive('');
                    setAutoListen(false);
                    return;
                  }
                  const phone = isPhoneLike();
                  const ok = await unlockMic();
                  // Mount orb in this click turn. Phones: do not autoListen
                  // (Safari drops SR outside gesture) — user taps orb to speak.
                  flushSync(() => {
                    setVoiceMode(true);
                    setAutoListen(!phone);
                  });
                  // Warm HTMLAudio / speechSynthesis in this same gesture.
                  unlockOrbAudioRef.current?.();
                  if (ok && !phone) await startOrbListenRef.current?.();
                })();
              }}
              aria-label={voiceMode ? 'Turn voice off' : 'Turn voice on'}
              title={
                voiceMode
                  ? 'Voice on — tap the orb to speak'
                  : 'Tap Voice, then tap the orb to speak (phone)'
              }
              className="inline-flex items-center gap-1 text-[0.55rem] tracking-[0.2em] uppercase px-1.5 py-0.5 rounded transition-colors"
              style={{
                color: voiceMode ? '#007d75' : 'rgba(27,23,19,0.55)',
                background: voiceMode ? 'rgba(0,168,157,0.1)' : 'transparent',
                border: voiceMode ? '1px solid rgba(0,168,157,0.35)' : '1px solid transparent',
              }}
            >
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle at 35% 30%, #fff, #7ee8dc 40%, #008f86 75%)',
                  boxShadow: voiceMode ? '0 0 6px rgba(0,168,157,0.55)' : 'none',
                }}
              />
              {voiceMode ? 'orb on' : 'voice'}
            </button>
            <button
              type="button"
              onClick={resetChat}
              aria-label="Reset conversation"
              title="Clear chat and start over"
              className="text-[0.65rem] tracking-[0.2em] text-[#1b1713]/35 hover:text-[#008f86] uppercase px-1"
            >
              reset
            </button>
            <button
              type="button"
              onClick={closeConsole}
              aria-label="Close console"
              className="text-[0.65rem] tracking-[0.2em] text-[#1b1713]/35 hover:text-[#1b1713]/85 uppercase px-1"
            >
              esc
            </button>
          </div>
        </div>

        {/* Transcript — flex-auto: content-sized when dialog is short; shrinks +
            scrolls when dialog hits sm:max-h-[72vh]. Bottom chrome stays visible.
            Soft veil only — same thin type, slightly clearer read on blur. */}
        <div
          ref={scrollRef}
          data-agent-transcript
          className="flex-auto min-h-[7.5rem] sm:min-h-[9rem] overflow-y-auto overscroll-contain px-4 sm:px-5 py-3 sm:py-4 space-y-3.5 bg-[#fffcf7]/55"
        >
          {messages.length === 0 ? (
            <>
              <p className="text-[0.62rem] tracking-[0.25em] text-[#1b1713]/55 uppercase mb-2">
                ▸ ready · say hi or ask anything
              </p>
              <p className="text-[0.78rem] leading-[1.7] text-[#1b1713]/62 mb-3">
                {voiceMode ? (
                  <>
                    Tap the <span className="text-[#008f86]">orb</span> to speak. You should see a
                    live caption, then hear the reply.
                  </>
                ) : (
                  <>
                    Tap <span className="text-[#008f86]">Voice</span>, then tap the{' '}
                    <span className="text-[#008f86]">orb</span> to speak (phone needs the orb tap).
                    <span className="hidden sm:inline">
                      {' '}Say <span className="text-[#008f86]">fix</span> /{' '}
                      <span className="text-[#008f86]">implement</span> /{' '}
                      <span className="text-[#008f86]">Voice → code</span> for a
                      propose-only patch (5/day).
                    </span>
                  </>
                )}
              </p>
              {!voiceMode && buildCatchUpHint(readTopicMemory().topics) && (
                <p className="text-[0.75rem] leading-[1.7] text-[#008f86]/85 mb-2">
                  {buildCatchUpHint(readTopicMemory().topics)}
                </p>
              )}
              {!voiceMode && (
              <ul className="space-y-2">
                {STARTER_PROMPTS.map((p) => (
                  <li key={p}>
                    <button
                      type="button"
                      onClick={() => ask(p)}
                      className="text-left text-[0.82rem] sm:text-sm leading-[1.7] text-[#1b1713]/72 hover:text-[#008f86] transition-colors w-full"
                    >
                      <span className="text-[#00a89d]/45 mr-2">&gt;</span>
                      {p}
                    </button>
                  </li>
                ))}
              </ul>
              )}
            </>
          ) : (
            messages.map((m) => {
              const text = getMessageText(m);
              // While the model is mid-tool-call (or about to start a step)
              // with no text yet, render a muted activity hint instead of
              // an empty bubble. As soon as the first answer token arrives,
              // `text` becomes non-empty and the real reply takes over.
              if (m.role === 'assistant' && !text.trim()) {
                const activity = getMessageActivity(m);
                if (activity) {
                  return <Line key={m.id} role="assistant" text={activity} muted />;
                }
              }
              return (
                <Line
                  key={m.id}
                  role={m.role === 'user' ? 'user' : 'assistant'}
                  text={text}
                />
              );
            })
          )}

          {busy && messages[messages.length - 1]?.role !== 'assistant' && (
            <Line role="assistant" text="…" muted />
          )}

          {showError && (
            <p className="text-[0.7rem] leading-5 tracking-[0.05em] text-red-400/85 whitespace-pre-wrap">
              <span className="font-mono text-[0.55rem] tracking-[0.3em] uppercase mr-1.5">▸ error</span>
              {serverErrorText || 'connection failed · try again'}
            </p>
          )}

          {sessionMaxed && (
            <p className="text-[0.7rem] leading-5 tracking-[0.05em] text-[#007d75]/75 whitespace-pre-wrap">
              <span className="font-mono text-[0.55rem] tracking-[0.3em] uppercase mr-1.5">▸ limit</span>
              You&apos;ve used today&apos;s {DAILY_LIMIT} messages. Fresh set tomorrow — see you then.
            </p>
          )}

        </div>

        {/* Bottom chrome: orb → chat input → optional leave-a-note (collapsed). */}
        <div className="shrink-0 flex flex-col">
        {/* Stream + barge-in orb: compact control node under transcript (≤~210px). */}
        <div className="shrink-0 max-h-[210px] overflow-y-auto overscroll-contain">
          <AgentVoiceOrb
            active={open && voiceMode}
            autoListen={autoListen}
            busy={busy}
            disabled={sessionMaxed}
            speakText={voiceSpeakReady ? lastAssistant.text : ''}
            speakId={voiceSpeakReady ? lastAssistant.id : ''}
            onRegisterStart={(start) => {
              startOrbListenRef.current = start;
            }}
            onRegisterUnlock={(unlock) => {
              unlockOrbAudioRef.current = unlock;
            }}
            onLiveCaption={(text) => {
              // Mirror into the chat field while speaking; live caption UI lives on the orb.
              setVoiceLive(text);
              if (text) setInput(text);
              else if (!busy) setInput('');
            }}
            onAsk={(text) => {
              setVoiceLive('');
              setAutoListen(false);
              ask(text);
            }}
            onListeningChange={() => {
              // Clear autoListen after the first start/stop so a failed mic
              // start cannot loop.
              setAutoListen(false);
            }}
          />
        </div>

        {/* Chat input — separate from leave-a-note drawer below. */}
        <div className="border-t border-[#e7e0d6] px-5 py-2.5 sm:py-3 shrink-0">
          <div className="relative flex items-center gap-2">
            <span className={`text-sm ${sessionMaxed ? 'text-[#1b1713]/20' : 'text-[#00a89d]'}`}>&gt;</span>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              placeholder={
                sessionMaxed
                  ? 'come back tomorrow ♡'
                  : voiceMode
                    ? 'Or type here'
                    : 'Type a message, or tap Voice'
              }
              disabled={sessionMaxed}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm leading-6 text-[#1b1713]/90 placeholder:text-[#1b1713]/38 outline-none max-h-32 caret-[#00a89d] disabled:cursor-not-allowed"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
            />
            {busy && (
              <span className="text-[0.55rem] tracking-[0.25em] text-[#00ffea]/60 uppercase animate-pulse">
                scratching it
              </span>
            )}
          </div>
          <p className="mt-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[0.48rem] sm:text-[0.5rem] tracking-[0.28em] text-[#1b1713]/40 uppercase">
            <span className="truncate">
              {voiceMode ? (
                <>
                  <span className="sm:hidden">
                    tap <span className="text-[#008f86]/70">orb</span> · speak
                  </span>
                  <span className="hidden sm:inline">
                    stream · barge-in · <span className="text-[#008f86]/70">voice→code</span>
                  </span>
                </>
              ) : (
                <>
                  <span className="sm:hidden">↵ send · voice</span>
                  <span className="hidden sm:inline">↵ send · tap Voice · voice→code (5/day)</span>
                </>
              )}
            </span>
            <span className="flex flex-wrap gap-x-3 gap-y-1 justify-end shrink-0">
              <span className={remaining === 0 ? 'text-red-400/70' : remaining <= 2 ? 'text-[#007d75]/55' : 'text-[#1b1713]/40'}>
                {remaining === 0
                  ? 'chat 0'
                  : `chat ${remaining}/${DAILY_LIMIT}`}
              </span>
              <span className={vcodeRemaining === 0 ? 'text-red-400/70' : 'text-[#007d75]/70'}>
                {vcodeRemaining === 0
                  ? 'vcode 0'
                  : `vcode ${vcodeRemaining}/${VCODE_DAILY_LIMIT}`}
              </span>
            </span>
          </p>
        </div>

        {/* Leave a note — collapsed secondary action under chat, not mid-flow. */}
        {showLeadInvite && (
          <div className="border-t border-[#e7e0d6] px-5 py-2 bg-[#faf7f0]/70 shrink-0">
            {!leadOpen ? (
              <button
                type="button"
                onClick={() => {
                  setLeadError(null);
                  setLeadOpen(true);
                }}
                className="font-mono text-[0.55rem] tracking-[0.28em] uppercase text-[#008f86]/80 hover:text-[#007d75] transition-colors"
              >
                leave a note ↗
              </button>
            ) : (
              <form
                className="space-y-2"
                autoComplete="off"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submitLead();
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-[0.55rem] tracking-[0.28em] uppercase text-[#008f86]/85">
                    leave a note
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setLeadOpen(false);
                      setLeadError(null);
                    }}
                    className="font-mono text-[0.5rem] tracking-[0.22em] uppercase text-[#1b1713]/40 hover:text-[#1b1713]/70"
                  >
                    close
                  </button>
                </div>
                <p className="text-[0.68rem] leading-5 text-[#1b1713]/50">
                  Optional — email + a short note if you want a reply later. Chat stays open either way.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    inputMode="email"
                    name="aileena-console-note-email"
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-1p-ignore="true"
                    data-lpignore="true"
                    data-bwignore="true"
                    data-form-type="other"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="your email"
                    disabled={leadState === 'submitting'}
                    className="flex-1 min-w-0 bg-white border border-[#ded8ce] px-3 py-2 text-sm text-[#1b1713]/90 placeholder:text-[#1b1713]/35 outline-none focus:border-[#00a89d]/70 caret-[#00a89d] disabled:opacity-50"
                  />
                  <input
                    type="text"
                    name="aileena-console-note-memo"
                    autoComplete="off"
                    data-1p-ignore="true"
                    data-lpignore="true"
                    data-form-type="other"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="name / WeChat / note (optional)"
                    disabled={leadState === 'submitting'}
                    className="flex-1 min-w-0 bg-white border border-[#ded8ce] px-3 py-2 text-sm text-[#1b1713]/90 placeholder:text-[#1b1713]/35 outline-none focus:border-[#00a89d]/70 caret-[#00a89d] disabled:opacity-50"
                    spellCheck={false}
                    autoCorrect="off"
                  />
                  <button
                    type="submit"
                    disabled={leadState === 'submitting' || !leadEmail.trim()}
                    className="font-mono text-[0.62rem] tracking-[0.3em] uppercase text-[#007d75] border border-[#00a89d]/45 bg-white px-3 py-2 hover:bg-[#e9fffc] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {leadState === 'submitting' ? 'sending…' : 'send ↗'}
                  </button>
                </div>
                {leadError && (
                  <p className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#1b1713]/55">
                    ▸ {leadError}
                  </p>
                )}
                <p className="font-mono text-[0.48rem] tracking-[0.24em] uppercase text-[#1b1713]/35">
                  private ·{' '}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-[#1b1713]/20 underline-offset-2 hover:text-[#1b1713]/70"
                  >
                    privacy
                  </a>
                </p>
              </form>
            )}
          </div>
        )}

        {leadState === 'sent' && (
          <div className="border-t border-[#e7e0d6] px-5 py-2 bg-[#f3fbf9] shrink-0">
            <p className="font-mono text-[0.55rem] tracking-[0.3em] uppercase text-[#008f86]/90">
              ▸ note sent — thanks
            </p>
          </div>
        )}
        </div>
      </div>
    </>
  );
}

function Line({
  role,
  text,
  muted,
}: {
  role: 'user' | 'assistant';
  text: string;
  muted?: boolean;
}) {
  if (role === 'user') {
    return (
      <p className="text-[0.82rem] sm:text-sm leading-[1.7] text-[#007d75] whitespace-pre-wrap break-words">
        <span className="text-[#00a89d]/55 mr-2">&gt;</span>
        {text}
      </p>
    );
  }
  return (
    <div className="flex gap-3">
      <span className="text-[#00a89d]/40 select-none leading-[1.7]">│</span>
      <p
        className={`flex-1 text-[0.82rem] sm:text-sm leading-[1.7] whitespace-pre-wrap break-words ${
          muted ? 'text-[#1b1713]/48' : 'text-[#1b1713]/92'
        }`}
      >
        {linkify(text)}
      </p>
    </div>
  );
}

function getMessageText(m: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!m.parts) return '';
  return m.parts
    .filter((p) => p.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text)
    .join('');
}

/**
 * Returns a short activity label if the assistant message has an active
 * tool call but no text response yet. AI SDK v6 surfaces typed-tool parts
 * as `tool-{toolName}` (e.g. `tool-searchArticles`) or as the generic
 * `tool-call` type; we treat any `tool-`-prefixed part as a sign that the
 * model is mid-retrieval. Used to render "checking her articles…" instead
 * of an empty bubble during the tool-use round trip.
 */
function getMessageActivity(m: { parts?: Array<{ type: string }> }): string | null {
  if (!m.parts) return null;
  for (const p of m.parts) {
    if (p.type === 'tool-call' || p.type.startsWith('tool-')) {
      return 'checking her articles…';
    }
    if (p.type === 'step-start' || p.type === 'reasoning') {
      return 'thinking…';
    }
  }
  return null;
}

function linkify(text: string) {
  // Match either a full http(s) URL or a bare domain.tld/path that the LLM
  // sometimes emits (e.g. "aileena.xyz/blog/centaur"). For the bare form we
  // build the href by prepending https://, so even if the model forgets the
  // protocol the user gets a clickable link instead of plain text.
  const re = /(https?:\/\/[^\s)]+|(?:[a-z0-9-]+\.)+[a-z]{2,}\/[^\s)]+)/gi;
  const parts: Array<string | { url: string }> = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push({ url: m[0] });
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.map((p, i) =>
    typeof p === 'string' ? (
      <span key={i}>{p}</span>
    ) : (
      <a
        key={i}
        href={p.url.startsWith('http') ? p.url : `https://${p.url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#007d75]/90 underline decoration-[#00a89d]/40 underline-offset-2 hover:text-[#006c65] hover:decoration-[#00a89d] break-all"
      >
        {p.url}
      </a>
    ),
  );
}
