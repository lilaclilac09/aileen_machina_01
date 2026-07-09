'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SYSTEM_PROMPT_LITE } from '../lib/agentContextLite';
import {
  getBrowserAgentAvailability,
  createBrowserSession,
  type Availability as BrowserAvailability,
  type BrowserSession,
} from '../lib/browserAgent';
import { appendUserTopic, readTopicMemory } from '../lib/articleTopicMemory';
import { matchCanned } from '../lib/agentCannedResponses';

const STARTER_PROMPTS = [
  "what's her solana stack?",
  'show me her writing on mev',
  'is she available for hire?',
];

const DAILY_LIMIT = 20;
const SESSION_KEY = 'aileena_chat_count_daily'; // New key for daily limit
const RUNTIME_KEY = 'aileena_runtime';
type Runtime = 'cloud' | 'browser';

// Shown instead of the provider's raw "credit balance is too low" billing error.
// This agent is a personal demo, not a free public API.
const NO_FREE_USE_MSG = "this agent isn't free to run — public access is off for now. reach out through the contact form instead.";
const LEAD_THRESHOLD = 5; // hard gate: chat is blocked until lead is submitted, after the visitor has sent N messages
const LEAD_DISMISS_KEY = 'aileena_lead_state'; // 'sent' | (unset) — historical 'dismissed' values are tolerated but no longer set

/**
 * Aileena · Console
 *
 * Not a chat widget. A command-palette-style overlay that matches the site's
 * SAT-LINK / terminal language. Invoked via `/` from anywhere on the site or
 * via the machina-portrait launcher at the bottom-left of the viewport.
 *
 * Rate limiting:
 *   - Client/session: DAILY_LIMIT messages per calendar day (localStorage with date check).
 *   - Server/daily: 20 messages per visitor per day, enforced by a signed
 *     cookie in /api/chat. When the server returns 429 it shows up in the
 *     error display below.
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      // Cross-session "topic memory" — what this visitor cared about on
      // previous visits, read fresh from localStorage on every request so
      // the server can soft-condition the system prompt on it. See
      // lib/articleTopicMemory.ts.
      body: () => ({ priorTopics: readTopicMemory().topics }),
    }),
  });

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

  const busy = status === 'submitted' || status === 'streaming' || browserBusy;
  const sessionMaxed = sessionCount >= DAILY_LIMIT && leadState !== 'sent';
  // Hard gate: once the visitor has sent LEAD_THRESHOLD messages, chat is
  // blocked until they submit the lead form. Re-enables when leadState='sent'.
  const mustProvideEmail = sessionCount >= LEAD_THRESHOLD && leadState !== 'sent';

  // Restore session counter (daily limit) + lead state from storage on first client render.
  useEffect(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) {
          setSessionCount(Math.min(Number(parsed.count) || 0, 99));
        } else {
          setSessionCount(0);
          localStorage.setItem(SESSION_KEY, JSON.stringify({ count: 0, date: today }));
        }
      } else {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ count: 0, date: today }));
      }

      const lead = sessionStorage.getItem(LEAD_DISMISS_KEY);
      if (lead === 'sent') setLeadState('sent');
      else if (typeof document !== 'undefined' && document.cookie.includes('__aileena_lead')) setLeadState('sent');
    } catch {
      /* storage unavailable — ignore */
    }
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, status]);

  // `/` opens, Esc closes, ignore when user is typing in a form field.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
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
  }, [open]);

  // Listen for external open events (hero pill, prompt chips, AI Agents
  // callout, etc.). CustomEvent.detail.prompt — if present — triggers an
  // auto-send so a chip click feels like a direct conversation kickoff.
  // ask is captured via a ref refreshed on every render so the listener
  // doesn't re-attach (and so the ref always holds the latest closure).
  const askRef = useRef<((text: string) => void) | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      setOpen(true);
      const ce = e as CustomEvent<{ prompt?: string }>;
      const prompt = ce.detail?.prompt;
      if (prompt && askRef.current) {
        // Defer one tick so the console mounts before the message lands.
        setTimeout(() => askRef.current?.(prompt), 80);
      }
    };
    window.addEventListener('open-agent-chat', handler);
    return () => window.removeEventListener('open-agent-chat', handler);
  }, []);

  // Focus input when opened.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
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

  function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy || sessionMaxed || mustProvideEmail) return;
    setInput('');

    // Record what the visitor asked about for cross-session memory. Done
    // for both runtimes so a visitor's browser-mode questions also seed
    // their future cloud-mode visits and vice versa.
    appendUserTopic(trimmed);

    // Fast path — canned-response short-circuit. Greetings, thanks, meta-
    // questions about the agent itself, top-level CV one-liners. Returns
    // ~10–30 ms (regex match + setState) instead of ~1.5–3 s LLM round-
    // trip. Substantive questions fall through to the real model.
    const canned = matchCanned(trimmed);
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
      const next = sessionCount + 1;
      setSessionCount(next);
      try {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(SESSION_KEY, JSON.stringify({ count: next, date: today }));
      } catch {
        /* storage unavailable — counter still works in-memory for this tab */
      }
      return;
    }

    if (activeRuntime === 'browser') {
      sendBrowser(trimmed);
    } else {
      sendMessage({ text: trimmed });
    }

    const next = sessionCount + 1;
    setSessionCount(next);
    try {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(SESSION_KEY, JSON.stringify({ count: next, date: today }));
    } catch {
      /* storage unavailable — counter still works in-memory for this tab */
    }
  }

  // Keep the externally-callable ref pointed at the latest ask closure so
  // CustomEvent prompt-detail dispatches always invoke the freshest version
  // (with current sessionCount, busy state, lead gate, etc.).
  askRef.current = ask;

  const remaining = Math.max(0, DAILY_LIMIT - sessionCount);

  // Panel renders exactly when the gate is active — same condition as the
  // chat-input lock above, kept as a separate alias for readability in JSX.
  const showLeadPanel = mustProvideEmail;

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
        setLeadError(body.error || 'Send failed. Try again.');
        setLeadState('idle');
        return;
      }
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
      return NO_FREE_USE_MSG;
    }
    return text;
  })();

  return (
    <>
      {/* Launcher — avatar only in the top-left. No "machina" text beside
          it: that label used to collide with every page's ← Home / Archive.
          Title lives inside the console header instead. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Aileena console · machina"
        title="machina"
        className={`group site-machina-launcher fixed top-3 left-3 sm:top-4 sm:left-4 z-[60] transition-opacity duration-200 ${open ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <span className="relative inline-block">
          <span
            aria-hidden
            className="block h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-no-repeat ring-1 ring-[#00a89d]/40 transition-all duration-200 group-hover:ring-[#00a89d]/80 group-hover:scale-[1.05]"
            style={{
              backgroundImage: "url('/bg_pic/03.jpeg')",
              backgroundPosition: '18% 5%',
              backgroundSize: '175%',
            }}
          />
          <span aria-hidden className="agent-scan pointer-events-none absolute inset-0 rounded-full overflow-hidden" />
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#00a89d] shadow-[0_0_6px_rgba(0,168,157,0.85)] animate-pulse ring-2 ring-[#fffdf8]"
          />
        </span>
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-[70] bg-[#fbfaf7]/80 backdrop-blur-sm transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Console card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Aileena Console"
        className={`fixed z-[80] inset-x-3 top-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 -translate-y-1/2 sm:w-[640px] sm:max-w-[calc(100vw-3rem)] max-h-[80vh] flex flex-col bg-[#fffdf8]/95 border border-[#ded8ce] shadow-[0_24px_80px_-34px_rgba(31,26,20,0.42)] backdrop-blur-md transition-all duration-200 ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-[0.96] pointer-events-none'} font-mono`}
        style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace' }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-[#e7e0d6] px-4 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[0.6rem] tracking-[0.3em] text-[#00ffea]/80 uppercase truncate">aileena · console</span>
          </div>
          <div className="flex items-center gap-3">
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
                  className="text-[0.55rem] tracking-[0.25em] uppercase px-1 transition-colors disabled:cursor-not-allowed"
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
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00ffea] shadow-[0_0_6px_rgba(0,255,234,0.9)] animate-pulse" />
              <span className="text-[0.55rem] tracking-[0.25em] text-[#00ffea]/60 uppercase">live</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close console"
              className="text-[0.65rem] tracking-[0.2em] text-[#1b1713]/35 hover:text-[#1b1713]/85 uppercase px-1"
            >
              esc
            </button>
          </div>
        </div>

        {/* Transcript */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-3 min-h-[180px]">
          {messages.length === 0 ? (
            <>
              <p className="text-[0.62rem] tracking-[0.25em] text-[#1b1713]/50 uppercase mb-2">
                ▸ ready · ask anything about aileen&apos;s work
              </p>
              <ul className="space-y-1.5">
                {STARTER_PROMPTS.map((p) => (
                  <li key={p}>
                    <button
                      type="button"
                      onClick={() => ask(p)}
                      className="text-left text-[0.82rem] sm:text-sm leading-6 text-[#1b1713]/70 hover:text-[#008f86] transition-colors w-full"
                    >
                      <span className="text-[#00a89d]/45 mr-2">&gt;</span>
                      {p}
                    </button>
                  </li>
                ))}
              </ul>
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

          {error && (
            <p className="text-[0.7rem] leading-5 tracking-[0.05em] text-red-400/85 whitespace-pre-wrap">
              <span className="font-mono text-[0.55rem] tracking-[0.3em] uppercase mr-1.5">▸ error</span>
              {serverErrorText || 'connection failed · try again'}
            </p>
          )}

          {sessionMaxed && (
            <p className="text-[0.7rem] leading-5 tracking-[0.05em] text-[#007d75]/75 whitespace-pre-wrap">
              <span className="font-mono text-[0.55rem] tracking-[0.3em] uppercase mr-1.5">▸ limit</span>
              Daily message limit reached ({DAILY_LIMIT} messages). Limit resets tomorrow.
            </p>
          )}

        </div>

        {/* Lead capture panel — appears after LEAD_THRESHOLD user messages */}
        {showLeadPanel && (
          <div className="border-t border-[#e7e0d6] px-5 py-3 bg-[#faf7f0]">
            <div className="mb-2.5">
              <p className="font-mono text-[0.55rem] tracking-[0.35em] uppercase text-[#008f86]/85">
                ▸ leave your email to keep chatting
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="email"
                disabled={leadState === 'submitting'}
                className="flex-1 min-w-0 bg-white border border-[#ded8ce] px-3 py-2 text-sm text-[#1b1713]/90 placeholder:text-[#1b1713]/35 outline-none focus:border-[#00a89d]/70 caret-[#00a89d] disabled:opacity-50"
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
              />
              <input
                type="text"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="name / context (optional)"
                disabled={leadState === 'submitting'}
                className="flex-1 min-w-0 bg-white border border-[#ded8ce] px-3 py-2 text-sm text-[#1b1713]/90 placeholder:text-[#1b1713]/35 outline-none focus:border-[#00a89d]/70 caret-[#00a89d] disabled:opacity-50"
                spellCheck={false}
                autoCorrect="off"
              />
              <button
                type="button"
                onClick={submitLead}
                disabled={leadState === 'submitting' || !leadEmail.trim()}
                className="font-mono text-[0.62rem] tracking-[0.3em] uppercase text-[#007d75] border border-[#00a89d]/45 bg-white px-3 py-2 hover:bg-[#e9fffc] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {leadState === 'submitting' ? 'sending…' : 'send ↗'}
              </button>
            </div>
            {leadError && (
              <p className="mt-2 font-mono text-[0.55rem] tracking-[0.25em] uppercase text-red-400/85">
                ▸ {leadError}
              </p>
            )}
            <p className="mt-2 font-mono text-[0.5rem] tracking-[0.28em] uppercase text-[#1b1713]/35">
              the chat transcript is attached to your message ·{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[#1b1713]/20 underline-offset-2 hover:text-[#1b1713]/70 hover:decoration-[#1b1713]/40"
              >
                privacy
              </a>
            </p>
          </div>
        )}

        {/* Input row */}
        <div className="border-t border-[#e7e0d6] px-5 py-3">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${sessionMaxed || mustProvideEmail ? 'text-[#1b1713]/20' : 'text-[#00a89d]'}`}>&gt;</span>
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
                  ? 'daily limit reached'
                  : mustProvideEmail
                  ? 'leave your email below to keep chatting'
                  : ''
              }
              disabled={sessionMaxed || mustProvideEmail}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm leading-6 text-[#1b1713]/90 placeholder:text-[#1b1713]/30 outline-none max-h-32 caret-[#00a89d] disabled:cursor-not-allowed"
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
          <p className="mt-2 flex items-center justify-between gap-3 text-[0.52rem] tracking-[0.3em] text-[#1b1713]/40 uppercase">
            <span>↵ send · esc close · / open from anywhere</span>
            <span className={remaining === 0 ? 'text-red-400/70' : remaining <= 2 ? 'text-[#007d75]/55' : 'text-[#1b1713]/40'}>
              {remaining}/{DAILY_LIMIT} left today
            </span>
          </p>
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
      <p className="text-[0.82rem] sm:text-sm leading-6 text-[#007d75]/95 whitespace-pre-wrap break-words">
        <span className="text-[#00a89d]/55 mr-2">&gt;</span>
        {text}
      </p>
    );
  }
  return (
    <div className="flex gap-3">
      <span className="text-[#00a89d]/35 select-none leading-6">│</span>
      <p
        className={`flex-1 text-[0.82rem] sm:text-sm leading-6 whitespace-pre-wrap break-words ${
          muted ? 'text-[#1b1713]/40' : 'text-[#1b1713]/88'
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
