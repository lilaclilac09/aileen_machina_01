'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';

const GREETING =
  "I'm Aileen's site agent. Ask me about her projects, writing, stack, or what she's looking for next. I'll point you to the right link.";

export default function AgentChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const busy = status === 'submitted' || status === 'streaming';

  // Auto-scroll to bottom whenever messages change or status updates.
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, status]);

  // Focus the input when the panel opens.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Allow other components to open the chat with `window.dispatchEvent(new Event('open-agent-chat'))`.
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-agent-chat', handler);
    return () => window.removeEventListener('open-agent-chat', handler);
  }, []);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function handleSend() {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    sendMessage({ text });
  }

  const showGreeting = messages.length === 0;

  return (
    <>
      {/* Launcher button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open chat with Aileen's site agent"
        className={`fixed bottom-5 right-5 z-[60] sm:bottom-6 sm:right-6 flex items-center gap-2 rounded-full border border-[#00ffea]/40 bg-black/80 px-4 py-3 font-mono text-[0.62rem] tracking-[0.3em] uppercase text-[#00ffea] backdrop-blur-md shadow-[0_0_24px_-6px_rgba(0,255,234,0.5)] transition-all hover:bg-[#00ffea]/10 hover:border-[#00ffea]/70 active:scale-95 ${open ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#00ffea] shadow-[0_0_8px_rgba(0,255,234,0.9)] animate-pulse" />
        <span>Talk to agent</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Panel */}
      <div
        className={`fixed z-[80] inset-x-3 bottom-3 sm:inset-auto sm:right-6 sm:bottom-6 sm:w-[420px] sm:max-w-[calc(100vw-3rem)] max-h-[80vh] sm:max-h-[640px] flex flex-col rounded-xl border border-[#00ffea]/30 bg-[#0a0a0a]/95 backdrop-blur-md shadow-[0_0_40px_-8px_rgba(0,255,234,0.4)] transition-all ${open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none'}`}
        role="dialog"
        aria-label="Aileena site agent"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00ffea] shadow-[0_0_8px_rgba(0,255,234,0.9)] animate-pulse shrink-0" />
            <p className="font-mono text-[0.6rem] tracking-[0.35em] sm:tracking-[0.4em] text-[#00ffea]/80 uppercase truncate">
              Aileena · Site Agent
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="font-mono text-sm text-white/60 hover:text-white px-2 py-1 leading-none"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {showGreeting && (
            <Bubble role="assistant" text={GREETING} />
          )}

          {messages.map((m) => (
            <Bubble
              key={m.id}
              role={m.role === 'user' ? 'user' : 'assistant'}
              text={getMessageText(m)}
            />
          ))}

          {busy && messages[messages.length - 1]?.role !== 'assistant' && (
            <Bubble role="assistant" text="…" muted />
          )}

          {error && (
            <p className="font-mono text-[0.62rem] tracking-[0.18em] text-red-400/80 uppercase">
              Connection error. Try again or use the contact form.
            </p>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-white/8 px-3 py-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about projects, writing, stack…"
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm leading-6 text-white/90 placeholder:text-white/30 outline-none max-h-32 py-2 px-2"
            />
            <button
              onClick={handleSend}
              disabled={busy || !input.trim()}
              className="font-mono text-[0.62rem] tracking-[0.3em] uppercase text-[#00ffea] border border-[#00ffea]/40 rounded-md px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#00ffea]/10 transition-colors shrink-0"
            >
              {busy ? '…' : 'Send'}
            </button>
          </div>
          <p className="mt-2 font-mono text-[0.5rem] tracking-[0.3em] text-white/25 uppercase">
            Streaming · Press Enter to send · Shift+Enter for newline
          </p>
        </div>
      </div>
    </>
  );
}

function Bubble({
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
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-lg bg-white/5 px-3 py-2 text-sm leading-6 text-white/90 whitespace-pre-wrap break-words">
          {text}
        </p>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <p className={`max-w-[90%] text-sm leading-6 whitespace-pre-wrap break-words ${muted ? 'text-white/40' : 'text-white/85'}`}>
        {linkify(text)}
      </p>
    </div>
  );
}

/**
 * Pull plain text out of a v6 UIMessage (which is `parts: [...]`).
 */
function getMessageText(m: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!m.parts) return '';
  return m.parts
    .filter((p) => p.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text)
    .join('');
}

/**
 * Turn bare URLs into clickable links. Plain regex; no markdown parsing.
 */
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
