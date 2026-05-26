'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';

const STARTER_PROMPTS = [
  "what's her solana stack?",
  'show me her writing on mev',
  'is she available for hire?',
];

/**
 * Aileena · Console
 *
 * Not a chat widget. A command-palette-style overlay that matches the site's
 * SAT-LINK / terminal language. Invoked via `/` from anywhere on the site or
 * via the typographic launcher line at the bottom-left of the viewport.
 */
export default function AgentChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const busy = status === 'submitted' || status === 'streaming';

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
    if (!trimmed || busy) return;
    setInput('');
    sendMessage({ text: trimmed });
  }

  return (
    <>
      {/* Launcher — a typographic line, not a pill */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Aileena console"
        className={`fixed bottom-3 left-1/2 -translate-x-1/2 sm:bottom-5 sm:left-5 sm:translate-x-0 z-[60] flex items-center gap-2 font-mono text-[0.6rem] sm:text-[0.62rem] tracking-[0.3em] sm:tracking-[0.35em] uppercase text-[#00ffea]/70 hover:text-[#00ffea] transition-colors py-1 px-2 ${open ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <span className="h-1 w-1 rounded-full bg-[#00ffea] shadow-[0_0_6px_rgba(0,255,234,0.9)] animate-pulse" />
        <span className="whitespace-nowrap">[ talk to the agent · /]</span>
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
            <p className="text-[0.62rem] tracking-[0.18em] text-red-400/80 uppercase">
              ▸ connection error · try again
            </p>
          )}
        </div>

        {/* Input row */}
        <div className="border-t border-[#00ffea]/15 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[#00ffea] text-sm">&gt;</span>
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
              placeholder=""
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm leading-6 text-white/90 placeholder:text-white/25 outline-none max-h-32 caret-[#00ffea]"
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
          <p className="mt-2 text-[0.52rem] tracking-[0.3em] text-white/25 uppercase">
            ↵ send · esc close · / open from anywhere
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
