'use client';

import { useCallback, useEffect, useState } from 'react';

type ListItem = {
  id: string;
  sessionId: string;
  status: string;
  subject: string;
  createdAt: string;
  sentAt?: string;
  error?: string;
  referer?: string;
  messageCount: number;
  preview: string;
};

type Detail = {
  id: string;
  sessionId: string;
  status: string;
  subject: string;
  createdAt: string;
  sentAt?: string;
  error?: string;
  referer?: string;
  ua?: string;
  transcript: Array<{ role: 'user' | 'assistant'; text: string }>;
};

function fmtWhen(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(t));
  } catch {
    return iso;
  }
}

export default function OwnerChatInboxClient({ locked }: { locked: boolean }) {
  const [days, setDays] = useState(14);
  const [items, setItems] = useState<ListItem[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [redis, setRedis] = useState<boolean | null>(null);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadList = useCallback(async () => {
    if (locked) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/owner/chat-forwards?days=${days}&limit=200`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        items?: ListItem[];
        note?: string;
        redis?: boolean;
        pending?: number;
      };
      if (res.status === 401) {
        setError('Owner session required. Open /api/auth/owner?key=OWNER_KEY&next=/inbox once.');
        setItems([]);
        return;
      }
      if (!res.ok || !body.ok) {
        setError(body.error || 'Could not load inbox.');
        setItems([]);
        return;
      }
      setItems(body.items ?? []);
      setNote(body.note ?? null);
      setRedis(Boolean(body.redis));
      setPending(typeof body.pending === 'number' ? body.pending : 0);
    } catch {
      setError('Network error.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [days, locked]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function openDetail(id: string) {
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/owner/chat-forwards/${encodeURIComponent(id)}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        item?: Detail;
        error?: string;
      };
      if (!res.ok || !body.ok || !body.item) {
        setError(body.error || 'Could not load transcript.');
        return;
      }
      setDetail(body.item);
    } catch {
      setError('Network error loading transcript.');
    } finally {
      setDetailLoading(false);
    }
  }

  if (locked) {
    return (
      <div className="space-y-4 max-w-xl">
        <p className="text-[0.9rem] leading-relaxed text-[#1b1713]/75">
          This page is owner-only. Unlock once with your{' '}
          <code className="text-[#008f86]">OWNER_KEY</code> link, then come back.
        </p>
        <p className="font-mono text-[0.65rem] tracking-[0.12em] text-[#1b1713]/45 break-all">
          /api/auth/owner?key=YOUR_OWNER_KEY&amp;next=/inbox
        </p>
        <p className="text-[0.8rem] leading-relaxed text-[#1b1713]/55">
          Meanwhile, search your mail / Resend for subjects starting with{' '}
          <span className="text-[#008f86]">[AILEENA Chat</span>. Leave-a-note emails are separate
          lead subjects.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <section className="space-y-3 min-w-0">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <label className="font-mono text-[0.55rem] tracking-[0.22em] uppercase text-[#1b1713]/45">
              last
            </label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-transparent border border-[#ded8ce] px-2 py-1 text-[0.75rem] text-[#1b1713]/85 outline-none"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
            <button
              type="button"
              onClick={() => void loadList()}
              className="font-mono text-[0.55rem] tracking-[0.22em] uppercase text-[#008f86] hover:text-[#007d75] px-2 py-1"
            >
              refresh
            </button>
          </div>
          <p className="font-mono text-[0.5rem] tracking-[0.18em] uppercase text-[#1b1713]/40">
            {loading
              ? 'loading…'
              : redis === false
                ? 'redis off'
                : `${items.length} · pending ${pending}`}
          </p>
        </div>

        {note && (
          <p className="text-[0.72rem] leading-relaxed text-[#1b1713]/50 border-l-2 border-[#e7e0d6] pl-3">
            {note}
          </p>
        )}
        {error && (
          <p className="text-[0.75rem] text-red-500/80 whitespace-pre-wrap">{error}</p>
        )}

        <ul className="divide-y divide-[#ebe4da] border-t border-[#ebe4da]">
          {items.length === 0 && !loading ? (
            <li className="py-6 text-[0.8rem] text-[#1b1713]/45">
              No Redis transcripts in this window.
              <br />
              Check Resend → Emails · subject <span className="text-[#008f86]">[AILEENA Chat</span>.
              Durable log only covers chats since 2026-08-04.
            </li>
          ) : (
            items.map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => void openDetail(it.id)}
                  className={`w-full text-left py-3 px-1 transition-colors ${
                    selectedId === it.id ? 'bg-[#f5f0e8]' : 'hover:bg-[#faf7f0]'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-[0.55rem] tracking-[0.16em] uppercase text-[#1b1713]/40">
                      {fmtWhen(it.createdAt)}
                    </span>
                    <span
                      className={`font-mono text-[0.5rem] tracking-[0.16em] uppercase ${
                        it.status === 'sent'
                          ? 'text-[#008f86]/80'
                          : it.status === 'failed'
                            ? 'text-red-400/80'
                            : 'text-[#1b1713]/40'
                      }`}
                    >
                      {it.status} · {it.messageCount} msgs
                    </span>
                  </div>
                  <p className="mt-1 text-[0.82rem] leading-snug text-[#1b1713]/82 line-clamp-2">
                    {it.preview || it.subject || '(empty)'}
                  </p>
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="min-w-0 border-t lg:border-t-0 lg:border-l border-[#ebe4da] lg:pl-6 pt-4 lg:pt-0">
        {!selectedId && (
          <p className="text-[0.8rem] text-[#1b1713]/45">Select a session to read the transcript.</p>
        )}
        {detailLoading && (
          <p className="font-mono text-[0.55rem] tracking-[0.22em] uppercase text-[#1b1713]/40">
            loading transcript…
          </p>
        )}
        {detail && (
          <div className="space-y-4">
            <header className="space-y-1">
              <p className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#008f86]/85">
                {fmtWhen(detail.createdAt)} · {detail.status}
              </p>
              <h2 className="text-[0.95rem] text-[#1b1713]/85 leading-snug">{detail.subject}</h2>
              {detail.referer && (
                <p className="font-mono text-[0.55rem] text-[#1b1713]/35 break-all">{detail.referer}</p>
              )}
              {detail.error && (
                <p className="text-[0.7rem] text-red-400/80">{detail.error}</p>
              )}
            </header>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {detail.transcript.map((m, i) => (
                <div key={`${detail.id}-${i}`} className="space-y-1">
                  <p className="font-mono text-[0.5rem] tracking-[0.22em] uppercase text-[#1b1713]/35">
                    {m.role === 'user' ? 'visitor' : 'aileena'}
                  </p>
                  <p
                    className={`text-[0.84rem] leading-[1.65] whitespace-pre-wrap ${
                      m.role === 'user' ? 'text-[#1b1713]/88' : 'text-[#1b1713]/68'
                    }`}
                  >
                    {m.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
