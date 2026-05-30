'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';

const STARTER_PROMPTS = [
  "what's her solana stack?",
  'show me her writing on mev',
  'is she available for hire?',
];

const SESSION_LIMIT = 5;
const SESSION_KEY = 'aileena_chat_count';

// Shown instead of the provider's raw "credit balance is too low" billing error.
// This agent is a personal demo, not a free public API.
const NO_FREE_USE_MSG = "this agent isn't free to run — public access is off for now. reach out through the contact form instead.";
const LEAD_THRESHOLD = 2; // start prompting for an email after the visitor has sent N messages
const LEAD_DISMISS_KEY = 'aileena_lead_state'; // 'dismissed' | 'sent' | (unset)

/**
 * Aileena · Console
 *
 * Not a chat widget. A command-palette-style overlay that matches the site's
 * SAT-LINK / terminal language. Invoked via `/` from anywhere on the site or
 * via the machina-portrait launcher at the bottom-left of the viewport.
 *
 * Rate limiting:
 *   - Client/session: SESSION_LIMIT messages per browser session (sessionStorage,
 *     resets when the tab closes).
 *   - Server/daily: 50 messages per visitor per day, enforced by a signed
 *     cookie in /api/chat. When the server returns 429 it shows up in the
 *     error display below.
 */
type LeadState = 'idle' | 'submitting' | 'sent' | 'dismissed';

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

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const busy = status === 'submitted' || status === 'streaming';
  const sessionMaxed = sessionCount >= SESSION_LIMIT;

  // Restore session counter + lead state from sessionStorage on first client render.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) setSessionCount(Math.min(Number(stored) || 0, 99));
      const lead = sessionStorage.getItem(LEAD_DISMISS_KEY);
      if (lead === 'dismissed' || lead === 'sent') setLeadState(lead);
    } catch {
      /* sessionStorage unavailable — ignore */
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

  // Listen for external open events (e.g. AI Agents callout button).
  useEffect(() => {
    const handler = () => setOpen(true);
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

  function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy || sessionMaxed) return;
    setInput('');
    sendMessage({ text: trimmed });

    const next = sessionCount + 1;
    setSessionCount(next);
    try {
      sessionStorage.setItem(SESSION_KEY, String(next));
    } catch {
      /* sessionStorage unavailable — counter still works in-memory for this tab */
    }
  }

  const remaining = Math.max(0, SESSION_LIMIT - sessionCount);

  // Lead-capture panel: show after LEAD_THRESHOLD messages, unless the visitor
  // already dismissed or already submitted it (tracked in sessionStorage).
  const showLeadPanel =
    leadState !== 'sent' &&
    leadState !== 'dismissed' &&
    sessionCount >= LEAD_THRESHOLD;

  function persistLeadState(next: LeadState) {
    setLeadState(next);
    try {
      if (next === 'sent' || next === 'dismissed') {
        sessionStorage.setItem(LEAD_DISMISS_KEY, next);
      }
    } catch {
      /* ignore */
    }
  }

  function dismissLead() {
    persistLeadState('dismissed');
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
      {/* Launcher — system-level indicator in the top-left, present on
          every page. Reads as part of the page chrome (like the EN/DE
          toggle on the right), not a chatbot widget. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Aileena console"
        className={`group fixed top-3 left-3 sm:top-4 sm:left-5 lg:left-6 z-[60] flex items-center gap-2 sm:gap-2.5 transition-opacity duration-200 ${open ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        {/* Portrait — compact, sits like an avatar in a system header */}
        <span className="relative inline-block">
          <span
            aria-hidden
            className="block h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-no-repeat ring-1 ring-[#00ffea]/30 transition-all duration-200 group-hover:ring-[#00ffea]/70 group-hover:scale-[1.05]"
            style={{
              backgroundImage: "url('/bg_pic/03.jpeg')",
              backgroundPosition: '18% 5%',
              backgroundSize: '175%',
            }}
          />
          <span aria-hidden className="agent-scan pointer-events-none absolute inset-0 rounded-full overflow-hidden" />
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#00ffea] shadow-[0_0_6px_rgba(0,255,234,0.9)] animate-pulse ring-2 ring-black"
          />
        </span>

        {/* Label — same typographic weight as EN/DE/menu on the right */}
        <span className="font-mono text-[0.6rem] sm:text-[0.62rem] tracking-[0.3em] uppercase text-[#00ffea]/70 group-hover:text-[#00ffea] transition-colors select-none">
          machina
        </span>
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-[70] bg-black/70 backdrop-blur-md transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Console card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Aileena Console"
        className={`fixed z-[80] inset-x-3 top-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 -translate-y-1/2 sm:w-[640px] sm:max-w-[calc(100vw-3rem)] max-h-[80vh] flex flex-col bg-[#08080a]/95 border border-[#00ffea]/30 shadow-[0_0_60px_-15px_rgba(0,255,234,0.45)] backdrop-blur-md transition-all duration-200 ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-[0.96] pointer-events-none'} font-mono`}
        style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace' }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-[#00ffea]/15 px-4 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[0.6rem] tracking-[0.3em] text-[#00ffea]/80 uppercase truncate">aileena · console</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00ffea] shadow-[0_0_6px_rgba(0,255,234,0.9)] animate-pulse" />
              <span className="text-[0.55rem] tracking-[0.25em] text-[#00ffea]/60 uppercase">live</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close console"
              className="text-[0.65rem] tracking-[0.2em] text-white/40 hover:text-white/90 uppercase px-1"
            >
              esc
            </button>
          </div>
        </div>

        {/* Transcript */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-3 min-h-[180px]">
          {messages.length === 0 ? (
            <>
              <p className="text-[0.62rem] tracking-[0.25em] text-white/35 uppercase mb-2">
                ▸ ready · ask anything about aileen's work
              </p>
              <ul className="space-y-1.5">
                {STARTER_PROMPTS.map((p) => (
                  <li key={p}>
                    <button
                      type="button"
                      onClick={() => ask(p)}
                      className="text-left text-[0.82rem] sm:text-sm leading-6 text-white/50 hover:text-[#00ffea] transition-colors w-full"
                    >
                      <span className="text-[#00ffea]/40 mr-2">&gt;</span>
                      {p}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            messages.map((m) => (
              <Line
                key={m.id}
                role={m.role === 'user' ? 'user' : 'assistant'}
                text={getMessageText(m)}
              />
            ))
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
            <p className="text-[0.7rem] leading-5 tracking-[0.05em] text-[#00ffea]/70 whitespace-pre-wrap">
              <span className="font-mono text-[0.55rem] tracking-[0.3em] uppercase mr-1.5">▸ limit</span>
              Session limit reached ({SESSION_LIMIT} messages). Refresh the tab to start a new session, or leave an email below so Aileen can follow up.
            </p>
          )}

          {leadState === 'sent' && (
            <p className="text-[0.7rem] leading-5 tracking-[0.05em] text-[#00ffea]/85 whitespace-pre-wrap">
              <span className="font-mono text-[0.55rem] tracking-[0.3em] uppercase mr-1.5">▸ sent</span>
              She&apos;ll see your message and the transcript. Thanks.
            </p>
          )}
        </div>

        {/* Lead capture panel — appears after LEAD_THRESHOLD user messages */}
        {showLeadPanel && (
          <div className="border-t border-[#00ffea]/15 px-5 py-3 bg-[#00ffea]/[0.025]">
            <div className="flex items-center justify-between mb-2.5">
              <p className="font-mono text-[0.55rem] tracking-[0.35em] uppercase text-[#00ffea]/85">
                ▸ leave an email
              </p>
              <button
                type="button"
                onClick={dismissLead}
                aria-label="Dismiss lead capture"
                className="font-mono text-[0.55rem] tracking-[0.25em] uppercase text-white/40 hover:text-white/80 px-1"
              >
                not now
              </button>
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
                className="flex-1 min-w-0 bg-transparent border border-[#00ffea]/25 px-3 py-2 text-sm text-white/90 placeholder:text-white/30 outline-none focus:border-[#00ffea]/60 caret-[#00ffea] disabled:opacity-50"
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
                className="flex-1 min-w-0 bg-transparent border border-[#00ffea]/25 px-3 py-2 text-sm text-white/90 placeholder:text-white/30 outline-none focus:border-[#00ffea]/60 caret-[#00ffea] disabled:opacity-50"
                spellCheck={false}
                autoCorrect="off"
              />
              <button
                type="button"
                onClick={submitLead}
                disabled={leadState === 'submitting' || !leadEmail.trim()}
                className="font-mono text-[0.62rem] tracking-[0.3em] uppercase text-[#00ffea] border border-[#00ffea]/45 px-3 py-2 hover:bg-[#00ffea]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {leadState === 'submitting' ? 'sending…' : 'send ↗'}
              </button>
            </div>
            {leadError && (
              <p className="mt-2 font-mono text-[0.55rem] tracking-[0.25em] uppercase text-red-400/85">
                ▸ {leadError}
              </p>
            )}
            <p className="mt-2 font-mono text-[0.5rem] tracking-[0.28em] uppercase text-white/30">
              the chat transcript is included so she has context
            </p>
          </div>
        )}

        {/* Input row */}
        <div className="border-t border-[#00ffea]/15 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${sessionMaxed ? 'text-white/20' : 'text-[#00ffea]'}`}>&gt;</span>
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
              placeholder={sessionMaxed ? 'session limit reached' : ''}
              disabled={sessionMaxed}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm leading-6 text-white/90 placeholder:text-white/25 outline-none max-h-32 caret-[#00ffea] disabled:cursor-not-allowed"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
            />
            {busy && (
              <span className="text-[0.55rem] tracking-[0.25em] text-[#00ffea]/60 uppercase animate-pulse">
                streaming
              </span>
            )}
          </div>
          <p className="mt-2 flex items-center justify-between gap-3 text-[0.52rem] tracking-[0.3em] text-white/25 uppercase">
            <span>↵ send · esc close · / open from anywhere</span>
            <span className={remaining === 0 ? 'text-red-400/60' : remaining <= 2 ? 'text-[#00ffea]/50' : 'text-white/25'}>
              {remaining}/{SESSION_LIMIT} left this session
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
      <p className="text-[0.82rem] sm:text-sm leading-6 text-[#00ffea]/85 whitespace-pre-wrap break-words">
        <span className="text-[#00ffea]/55 mr-2">&gt;</span>
        {text}
      </p>
    );
  }
  return (
    <div className="flex gap-3">
      <span className="text-[#00ffea]/30 select-none leading-6">│</span>
      <p
        className={`flex-1 text-[0.82rem] sm:text-sm leading-6 whitespace-pre-wrap break-words ${
          muted ? 'text-white/35' : 'text-white/85'
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

function linkify(text: string) {
  const re = /(https?:\/\/[^\s)]+)/g;
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
        href={p.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#00ffea]/90 underline decoration-[#00ffea]/40 underline-offset-2 hover:text-[#00ffea] hover:decoration-[#00ffea] break-all"
      >
        {p.url}
      </a>
    ),
  );
}
