'use client';

import { useEffect, useState } from 'react';
import BrowserUseIcon from './BrowserUseIcon';
import { quotaDayKey } from '@/lib/voiceCodeIntent';

type Status = {
  api: 'v4';
  key?: 'present' | 'missing';
  live?: boolean;
  dryRun: true;
  billed: false;
  wouldRunTask: string | null;
};

export default function BrowserUseWindow({
  open,
  task,
  isOwner,
  onTaskChange,
  onClose,
}: {
  open: boolean;
  task: string;
  isOwner: boolean;
  onTaskChange: (task: string) => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [quotaNote, setQuotaNote] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void fetch('/api/agent/browser-use')
      .then((res) => (res.ok ? res.json() : null))
      .then((body: Status | null) => {
        if (!cancelled && body) setStatus(body);
      })
      .catch(() => {
        /* dry window still usable */
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function prepare() {
    const next = task.trim();
    if (!next || busy) return;
    setBusy(true);
    setQuotaNote(null);
    try {
      const res = await fetch('/api/agent/browser-use', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Quota-Day': quotaDayKey(),
        },
        body: JSON.stringify({ task: next }),
      });
      if (res.status === 429) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setQuotaNote(
          typeof body?.error === 'string' && body.error.trim()
            ? body.error
            : "You've used today's 20 messages. A fresh set lands tomorrow — see you then.",
        );
        return;
      }
      if (res.ok) {
        const body = (await res.json()) as Status;
        setStatus(body);
      }
    } catch {
      /* stay dry */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Browser Use"
      data-testid="browser-use-window"
      data-open={open ? '1' : '0'}
      className={`fixed z-[88] font-mono transition-all duration-200 ${
        open
          ? 'opacity-100 pointer-events-auto scale-100'
          : 'opacity-0 pointer-events-none scale-[0.98]'
      } left-3 right-3 top-[max(4.25rem,env(safe-area-inset-top,0px))] sm:left-auto sm:right-4 sm:top-1/2 sm:-translate-y-1/2 sm:w-[min(320px,calc(50vw-1.5rem))]`}
      style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace' }}
    >
      <div className="overflow-hidden rounded-[10px] border border-[#ded8ce] bg-[#fffdf8]/96 shadow-[0_18px_50px_-28px_rgba(31,26,20,0.4)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 border-b border-[#e7e0d6] px-3 py-2">
          <div className="flex items-center gap-1.5 min-w-0 text-[#007d75]">
            <BrowserUseIcon />
            <span className="text-[0.58rem] tracking-[0.12em] uppercase truncate">browse · dry</span>
          </div>
          <button
            type="button"
            data-testid="browser-use-window-close"
            onClick={onClose}
            aria-label="Close Browser Use"
            className="inline-flex min-h-9 min-w-9 items-center justify-center text-[0.55rem] tracking-[0.18em] uppercase text-[#1b1713]/40 hover:text-[#1b1713]/80 sm:min-h-0 sm:min-w-0"
          >
            esc
          </button>
        </div>
        <div className="px-3 py-2.5 space-y-2">
          <p data-testid="browser-use-window-status" className="text-[0.7rem] leading-5 tracking-normal text-[#1b1713]/70">
            Cloud API v4. Anyone can prepare. No paid browser started.
            {isOwner && status
              ? ` Key ${status.key ?? 'missing'}. Live ${status.live ? 'on' : 'off'}.`
              : ' Type a page. Cloudflare computer stays aside.'}
          </p>
          <label className="block">
            <span className="sr-only">Browse task</span>
            <textarea
              data-testid="browser-use-task"
              value={task}
              onChange={(e) => onTaskChange(e.target.value)}
              rows={3}
              placeholder="browse: open example.com"
              className="w-full resize-none rounded-[6px] border border-[#e7e0d6] bg-[#fffcf7] px-2 py-1.5 text-[0.75rem] leading-5 text-[#1b1713]/85 placeholder:text-[#1b1713]/32 outline-none focus:border-[#008f86]/50"
            />
          </label>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              data-testid="browser-use-prepare"
              onClick={() => void prepare()}
              disabled={busy || !task.trim()}
              className="min-h-9 px-2.5 rounded-[6px] text-[0.52rem] tracking-[0.14em] uppercase text-[#007d75] border border-[#d8cfc0] border-b-2 border-b-[#c2b7a3] bg-white disabled:opacity-40 sm:min-h-0"
            >
              {busy ? '…' : 'prepare'}
            </button>
            <span className="text-[0.48rem] tracking-[0.2em] uppercase text-[#1b1713]/35">
              not billed
            </span>
          </div>
          {status?.wouldRunTask ? (
            <p data-testid="browser-use-would-run" className="text-[0.65rem] leading-5 text-[#007d75]/90">
              would run: {status.wouldRunTask}
            </p>
          ) : null}
          {quotaNote ? (
            <p data-testid="browser-use-quota" className="text-[0.65rem] leading-5 text-[#1b1713]/55">
              {quotaNote}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
