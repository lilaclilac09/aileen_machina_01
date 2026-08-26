'use client';

import { useEffect } from 'react';

/**
 * Lightweight runtime observer. Redacted route + short message only.
 * Never sends chat transcripts, cookies, or secrets.
 */
export default function ProofObserver() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const send = (type: string, message: string) => {
      const route = window.location.pathname || '/';
      if (route === '/evolution' || route === '/proof') return;
      const text = String(message || '').replace(/\s+/g, ' ').trim().slice(0, 160);
      if (!text) return;
      if (/OWNER_KEY|AUTH_SECRET|sk-|Bearer /i.test(text)) return;

      try {
        const key = 'aileena_proof_obs';
        const raw = sessionStorage.getItem(key);
        const seen: string[] = raw ? (JSON.parse(raw) as string[]) : [];
        const fp = `${route}:${text}`.slice(0, 120);
        if (seen.includes(fp) || seen.length >= 8) return;
        seen.push(fp);
        sessionStorage.setItem(key, JSON.stringify(seen));
      } catch {
        /* ignore */
      }

      void fetch('/api/proof/observe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, route, message: text, source: 'error' }),
        keepalive: true,
      }).catch(() => {
        /* ignore */
      });
    };

    const onError = (event: ErrorEvent) => {
      send('error', event.message || 'client error');
    };
    const onReject = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg = reason instanceof Error ? reason.message : String(reason || 'unhandled rejection');
      send('error', msg);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onReject);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onReject);
    };
  }, []);

  return null;
}
