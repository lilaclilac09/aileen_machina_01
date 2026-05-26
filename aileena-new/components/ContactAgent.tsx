'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';

const GREETING =
  "Ask anything about Aileen's work — projects, writing, stack, what she's looking for. If I can't answer, use the form below to message her directly.";

/**
 * Embedded chat panel for the Contact section.
 *
 * Lives inside the snap-scroll contact section. Matches the same terminal
 * aesthetic as the email form below it. Not a floating chatbot widget.
 */
export default function ContactAgent() {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const busy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, status]);

  function handleSend() {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    sendMessage({ text });
  }

  return (
    <div className="font-mono">
      {/* Header bar — mirrors the TERMINAL header on the form below */}
      <div
        className="flex items-center justify-between border border-[#00ffea]/10 px-4 py-2"
        style={{ background: 'rgba(0,255,234,0.025)' }}
      >
        <span className="text-[0.52rem] sm:text-[0.58rem] tracking-[0.2em] sm:tracking-[0.5em] text-[#00ffea]/40 uppercase">
          Ask the agent
        </span>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[#00ffea]/55 shadow-[0_0_4px_rgba(0,255,234,0.5)] animate-pulse" />
        </div>
      </div>

      {/* Body */}
      <div className="border border-t-0 border-[#00ffea]/10 p-4 sm:p-5">
        {/* Transcript */}
        <div
          ref={scrollRef}
          className="dispatch-scroll min-h-[140px] max-h-[200px] sm:max-h-[240px] overflow-y-auto pr-1 space-y-3"
        >
          {messages.length === 0 ? (
            <p className="text-xs sm:text-[0.78rem] leading-6 tracking-[0.08em] text-white/45">
              {GREETING}
            </p>
          ) : (
            messages.map((m) => (
              <Bubble
                key={m.id}
                role={m.role === 'user' ? 'user' : 'assistant'}
                text={getMessageText(m)}
              />
            ))
          )}

          {busy && messages[messages.length - 1]?.role !== 'assistant' && (
            <Bubble role="assistant" text="…" muted />
          )}

          {error && (
            <p className="text-[0.6rem] tracking-[0.18em] text-red-400/80 uppercase">
              Connection error. Use the form below.
            </p>
          )}
        </div>

        {/* Input row */}
        <div className="mt-4 border-t border-white/6 pt-3">
          <p className="mb-2 text-[0.52rem] tracking-[0.5em] text-white/30">Q ·</p>
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a question…"
              rows={1}
              className="w-full bg-transparent text-sm tracking-[0.05em] text-white/80 outline-none placeholder:text-white/25 focus:text-white resize-none min-h-[1.5rem]"
            />
            <button
              onClick={handleSend}
              disabled={busy || !input.trim()}
              className="group flex items-center gap-2 active:opacity-70 hover:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            >
              <span className="text-[0.62rem] sm:text-[0.65rem] tracking-[0.28em] sm:tracking-[0.55em] text-[#00ffea]/70 group-hover:text-[#00ffea] uppercase">
                {busy ? '…' : 'Ask'}
              </span>
              {!busy && (
                <span className="text-sm text-[#00ffea]/55 group-hover:text-[#00ffea] transition-colors">
                  →
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
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
      <p className="text-[0.78rem] sm:text-[0.82rem] leading-6 tracking-[0.05em] text-white/55 whitespace-pre-wrap break-words">
        <span className="text-[#00ffea]/40 mr-2">&gt;</span>
        {text}
      </p>
    );
  }
  return (
    <p
      className={`text-xs sm:text-[0.82rem] leading-6 tracking-[0.05em] whitespace-pre-wrap break-words ${
        muted ? 'text-white/30' : 'text-white/85'
      }`}
    >
      {linkify(text)}
    </p>
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
