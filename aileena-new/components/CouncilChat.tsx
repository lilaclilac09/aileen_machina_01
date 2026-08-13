'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';
import {
  COUNCIL_LENSES,
  COUNCIL_OPENING,
  type CouncilLens,
} from '../lib/councilCopy';

export default function CouncilChat() {
  const [input, setInput] = useState('');
  const [lens, setLens] = useState<CouncilLens | undefined>(undefined);
  const lensRef = useRef<CouncilLens | undefined>(undefined);
  lensRef.current = lens;
  const welcomedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, setMessages, sendMessage, status, error, stop } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({
        agentMode: 'council' as const,
        councilLens: lensRef.current,
      }),
    }),
  });

  const busy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (welcomedRef.current || messages.length > 0) return;
    welcomedRef.current = true;
    setMessages([
      {
        id: 'council-open',
        role: 'assistant',
        parts: [{ type: 'text', text: COUNCIL_OPENING }],
      },
    ]);
  }, [messages.length, setMessages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  function ask(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed || busy) return;
    setInput('');
    sendMessage({ text: trimmed });
  }

  return (
    <div className="flex min-h-[70dvh] flex-col border border-[#ded8ce] bg-[#fffcf7]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e7e0d6] px-4 py-3">
        <p className="font-mono text-[0.48rem] tracking-[0.18em] uppercase text-[#1b1713]/40">
          private · no visitor contact
        </p>
        <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setLens(undefined)}
          className={`font-mono text-[0.52rem] tracking-[0.18em] uppercase px-2 py-1 border ${
            lens === undefined
              ? 'border-[#00a89d] text-[#007d75] bg-[#e9fffc]'
              : 'border-transparent text-[#1b1713]/40 hover:text-[#008f86]'
          }`}
        >
          auto
        </button>
        {COUNCIL_LENSES.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setLens(name)}
            className={`font-mono text-[0.52rem] tracking-[0.18em] uppercase px-2 py-1 border ${
              lens === name
                ? 'border-[#00a89d] text-[#007d75] bg-[#e9fffc]'
                : 'border-transparent text-[#1b1713]/40 hover:text-[#008f86]'
            }`}
          >
            {name}
          </button>
        ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-auto overflow-y-auto px-4 py-4 space-y-3.5">
        {messages.map((m) => {
          const text = (m.parts ?? [])
            .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && typeof p.text === 'string')
            .map((p) => p.text)
            .join('');
          if (m.role === 'user') {
            return (
              <p
                key={m.id}
                className="text-[0.88rem] leading-[1.7] text-[#007d75] whitespace-pre-wrap break-words"
              >
                <span className="text-[#00a89d]/55 mr-2">&gt;</span>
                {text}
              </p>
            );
          }
          return (
            <div key={m.id} className="flex gap-3">
              <span className="text-[#00a89d]/40 select-none leading-[1.7]">│</span>
              <p className="flex-1 text-[0.88rem] leading-[1.7] text-[#1b1713]/92 whitespace-pre-wrap break-words">
                {text}
              </p>
            </div>
          );
        })}
        {busy && messages[messages.length - 1]?.role !== 'assistant' && (
          <p className="text-[0.8rem] text-[#1b1713]/45">…</p>
        )}
        {error && (
          <p className="font-mono text-[0.55rem] tracking-[0.14em] uppercase text-[#1b1713]/55">
            ▸ {error.message}
          </p>
        )}
      </div>

      <form
        className="border-t border-[#e7e0d6] px-4 py-3 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
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
          rows={2}
          placeholder="goal, leverage, the email, the bug — or just swear first"
          className="flex-1 resize-none bg-transparent text-sm leading-6 text-[#1b1713]/90 placeholder:text-[#1b1713]/35 outline-none caret-[#00a89d]"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="font-mono text-[0.62rem] tracking-[0.3em] uppercase text-[#007d75] border border-[#00a89d]/45 px-3 py-2 hover:bg-[#e9fffc] disabled:opacity-40"
        >
          {busy ? '…' : 'go'}
        </button>
        {busy && (
          <button
            type="button"
            onClick={() => stop()}
            className="font-mono text-[0.52rem] tracking-[0.2em] uppercase text-[#1b1713]/40"
          >
            stop
          </button>
        )}
      </form>
    </div>
  );
}
