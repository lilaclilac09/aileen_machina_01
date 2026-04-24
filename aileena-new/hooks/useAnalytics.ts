'use client';
import { useCallback, useEffect, useRef } from 'react';

const WORKER_URL = process.env.NEXT_PUBLIC_ANALYTICS_URL ?? '/api/track';

export function useAnalytics() {
  const skipRef = useRef(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('me') === '1') {
      localStorage.setItem('__owner', '1');
      const url = new URL(window.location.href);
      url.searchParams.delete('me');
      window.history.replaceState({}, '', url.toString());
    }
    skipRef.current = localStorage.getItem('__owner') === '1';
  }, []);

  const track = useCallback((type: string, data?: Record<string, unknown>) => {
    if (skipRef.current) return;
    fetch(`${WORKER_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  return { track };
}
