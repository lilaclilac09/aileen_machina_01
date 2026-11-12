'use client';

import { useState } from 'react';
import { ExternalLink, History, X } from 'lucide-react';
import { SaveBadge, useAppState } from './useAppState';

type Snapshot = { url: string; timestamp: string };

const THIS_YEAR = new Date().getFullYear();

function normalizeUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) return null;
    return u.toString();
  } catch {
    return null;
  }
}

function snapshotDate(ts: string): string {
  return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`;
}

/** Internet Archive Wayback availability API (CORS-open). */
async function closestSnapshot(url: string, year: number): Promise<Snapshot | null> {
  const api = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}&timestamp=${year}0701`;
  const res = await fetch(api);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    archived_snapshots?: { closest?: { available?: boolean; url?: string; timestamp?: string } };
  };
  const hit = data.archived_snapshots?.closest;
  if (!hit?.available || !hit.url || !hit.timestamp) return null;
  return { url: hit.url.replace(/^http:/, 'https:'), timestamp: hit.timestamp };
}

function viewerUrl(snap: Snapshot, url: string): string {
  return `https://web.archive.org/web/${snap.timestamp}/${url}`;
}

export default function TimeMachineApp() {
  const { state, update, status } = useAppState('timemachine');
  const [address, setAddress] = useState('example.com');
  const [year, setYear] = useState(2005);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<{ url: string; snap: Snapshot } | null>(null);

  const travel = async (rawUrl = address, toYear = year) => {
    const url = normalizeUrl(rawUrl);
    if (!url) {
      setError('Type a website, like example.com');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const snap = await closestSnapshot(url, toYear);
      if (!snap) {
        setError(`No archived copy of ${new URL(url).hostname} near ${toYear}.`);
        setView(null);
        return;
      }
      setView({ url, snap });
      update((prev) => ({
        visits: [
          {
            id: `t-${Date.now().toString(36)}`,
            url,
            year: toYear,
            timestamp: snap.timestamp,
            note: '',
            savedAt: new Date().toISOString(),
          },
          ...prev.visits.filter((v) => !(v.url === url && v.year === toYear)),
        ].slice(0, 30),
      }));
    } catch {
      setError('The Internet Archive did not answer. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="computer-app-timemachine" className="space-y-2">
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          void travel();
        }}
      >
        <input
          data-testid="timemachine-url"
          aria-label="Website"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          inputMode="url"
          autoCapitalize="none"
          spellCheck={false}
          className="min-h-11 w-full rounded-[8px] border border-[#d8cfc0] bg-white px-3 font-mono text-[0.8rem] text-[#1b1713]"
        />
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={1996}
            max={THIS_YEAR}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            aria-label="Year"
            data-testid="timemachine-year"
            className="min-w-0 flex-1 accent-[#00a89d]"
          />
          <span className="w-10 text-right font-mono text-[0.78rem] text-[#007d75]" data-testid="timemachine-year-label">
            {year}
          </span>
          <button
            type="submit"
            disabled={busy}
            data-testid="timemachine-go"
            className="inline-flex min-h-11 items-center gap-1 rounded-[8px] border border-[#00a89d] bg-[#e7f6f3] px-3 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[#00665f] disabled:opacity-50"
          >
            <History size={14} aria-hidden /> {busy ? 'going…' : 'go'}
          </button>
        </div>
      </form>

      {error ? (
        <p data-testid="timemachine-error" className="text-[0.7rem] text-[#b4532a]">
          {error}
        </p>
      ) : null}

      {view ? (
        <div className="space-y-1" data-testid="timemachine-view">
          <div className="flex items-center justify-between gap-2 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-[#007d75]">
            <span className="truncate" data-testid="timemachine-snapshot">
              {new URL(view.url).hostname} · {snapshotDate(view.snap.timestamp)}
            </span>
            <a
              href={viewerUrl(view.snap, view.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1"
            >
              open <ExternalLink size={12} aria-hidden />
            </a>
          </div>
          <iframe
            title={`${view.url} in ${view.snap.timestamp.slice(0, 4)}`}
            src={viewerUrl(view.snap, view.url)}
            sandbox="allow-scripts allow-same-origin allow-popups"
            referrerPolicy="no-referrer"
            className="h-64 w-full rounded-[8px] border border-[#d8cfc0] bg-white"
          />
        </div>
      ) : null}

      {state.visits.length ? (
        <div className="space-y-1">
          <p className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-[#1b1713]/45">your trips</p>
          <ul className="space-y-1" data-testid="timemachine-history">
            {state.visits.slice(0, 8).map((visit) => (
              <li key={visit.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setAddress(visit.url);
                    setYear(visit.year);
                    void travel(visit.url, visit.year);
                  }}
                  className="min-h-8 min-w-0 flex-1 truncate rounded-[6px] border border-[#d8cfc0] bg-white px-2 text-left font-mono text-[0.66rem] text-[#1b1713]/75"
                >
                  {visit.year} · {new URL(visit.url).hostname}
                </button>
                <button
                  type="button"
                  aria-label={`Forget ${visit.year} ${visit.url}`}
                  onClick={() => update((prev) => ({ visits: prev.visits.filter((v) => v.id !== visit.id) }))}
                  className="min-h-8 px-1.5 text-[#1b1713]/35 hover:text-[#b4532a]"
                >
                  <X size={12} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex items-center justify-between text-[0.6rem] text-[#1b1713]/45">
        <span>Pages from the Internet Archive Wayback Machine.</span>
        <SaveBadge status={status} />
      </div>
    </div>
  );
}
