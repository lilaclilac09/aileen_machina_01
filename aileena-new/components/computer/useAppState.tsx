'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_APP_STATE, type ComputerAppId, type ComputerAppState } from '../../lib/computer/apps';

export type SaveStatus = 'loading' | 'saved' | 'saving' | 'offline';

/**
 * Load and save one app's JSON file in the visitor's computer workspace.
 * Saves are debounced; the last edit always wins.
 */
export function useAppState<K extends ComputerAppId>(app: K, debounceMs = 600) {
  const [state, setState] = useState<ComputerAppState[K]>(DEFAULT_APP_STATE[app]);
  const [status, setStatus] = useState<SaveStatus>('loading');
  const timer = useRef<number | null>(null);
  const latest = useRef(state);
  const loaded = useRef(false);
  /** A local edit happened; a late initial GET must not overwrite it. */
  const dirty = useRef(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetch(`/api/agent/computer/apps/${app}`, { credentials: 'include', cache: 'no-store' });
        const data = (await res.json()) as { ok?: boolean; state?: ComputerAppState[K] };
        if (!alive) return;
        if (dirty.current) {
          setStatus('saved');
          return;
        }
        if (res.ok && data.state) {
          latest.current = data.state;
          setState(data.state);
          setStatus('saved');
        } else {
          setStatus('offline');
        }
      } catch {
        if (alive) setStatus('offline');
      } finally {
        loaded.current = true;
      }
    })();
    return () => {
      alive = false;
    };
  }, [app]);

  const flush = useCallback(async () => {
    timer.current = null;
    try {
      const res = await fetch(`/api/agent/computer/apps/${app}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ state: latest.current }),
      });
      // A newer edit scheduled another save; keep showing "saving…".
      setStatus(!res.ok ? 'offline' : timer.current === null ? 'saved' : 'saving');
    } catch {
      setStatus('offline');
    }
  }, [app]);

  useEffect(
    () => () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        void flush();
      }
    },
    [flush],
  );

  const update = useCallback(
    (next: ComputerAppState[K] | ((prev: ComputerAppState[K]) => ComputerAppState[K])) => {
      const value = typeof next === 'function' ? next(latest.current) : next;
      latest.current = value;
      dirty.current = true;
      setState(value);
      if (!loaded.current) return;
      setStatus('saving');
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void flush(), debounceMs);
    },
    [debounceMs, flush],
  );

  return { state, update, status };
}

export function SaveBadge({ status }: { status: SaveStatus }) {
  const label =
    status === 'loading' ? 'opening…' : status === 'saving' ? 'saving…' : status === 'saved' ? 'saved' : 'not saved';
  return (
    <span
      data-testid="computer-app-save"
      data-status={status}
      className={`font-mono text-[0.55rem] tracking-[0.12em] uppercase ${status === 'offline' ? 'text-[#b4532a]' : 'text-[#008f86]/75'}`}
    >
      {label}
    </span>
  );
}
