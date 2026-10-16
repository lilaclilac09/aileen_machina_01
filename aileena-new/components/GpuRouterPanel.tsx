'use client';

import { useCallback, useEffect, useState } from 'react';
import { readOwnerModelTier, writeOwnerModelTier, type ModelTierPref } from '@/lib/modelTierPref';

type Status = {
  mode: string;
  configured: boolean;
  provider: string | null;
  model: string | null;
  state: string;
  stateAt: number | null;
  rules: Record<string, unknown> | null;
  breakers: Record<string, string>;
  kv: string;
  deepseekSpendUsdToday: number;
  today: { day: string; providers: Record<string, { turns: number; failed: number }>; rules: Record<string, number> };
};

/** Owner-only model router panel: GPU lifecycle, controls, today's turns per provider. */
export default function GpuRouterPanel() {
  const [s, setS] = useState<Status | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [tier, setTier] = useState<ModelTierPref | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/agent/gpu', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setS(j as Status);
      setErr('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    setTier(readOwnerModelTier());
    void load();
    const t = setInterval(() => void load(), 10_000);
    return () => clearInterval(t);
  }, [load]);

  const act = async (action: string) => {
    setBusy(true);
    try {
      const r = await fetch('/api/agent/gpu', { method: 'POST', body: JSON.stringify({ action }), headers: { 'Content-Type': 'application/json' } });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setS(j as Status);
      setErr('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const pickTier = (v: ModelTierPref | null) => {
    writeOwnerModelTier(v);
    setTier(v);
    if (v === 'gpu') void act('wake');
  };

  return (
    <section className="border border-[#ded8ce] bg-white p-4 space-y-3" data-testid="gpu-router">
      <h3 className="font-mono text-[0.6rem] tracking-[0.22em] uppercase text-[#008f86]">Model router · GPU tier</h3>
      {err ? <p className="text-[0.8rem] text-red-700">{err}</p> : null}
      {!s ? (
        <p className="text-[0.8rem] text-[#1b1713]/45">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-[0.8rem]">
            <div><p className="text-[#1b1713]/45">Mode</p><p className="font-mono" data-testid="gpu-mode">{s.mode}</p></div>
            <div><p className="text-[#1b1713]/45">GPU state</p><p className="font-mono" data-testid="gpu-state">{s.state}</p></div>
            <div><p className="text-[#1b1713]/45">Model</p><p className="font-mono break-all">{s.model ?? '—'}</p></div>
            <div><p className="text-[#1b1713]/45">State store</p><p className="font-mono">{s.kv}</p></div>
            <div><p className="text-[#1b1713]/45">DeepSeek today (est.)</p><p className="font-mono">${s.deepseekSpendUsdToday.toFixed(4)}</p></div>
          </div>
          <table className="w-full text-[0.78rem]">
            <thead><tr className="text-left text-[#1b1713]/50"><th className="py-1">Provider</th><th>Breaker</th><th>Turns today</th><th>Failed</th></tr></thead>
            <tbody>
              {Object.entries(s.breakers).map(([p, b]) => (
                <tr key={p} className="border-t border-[#f0ebe3]">
                  <td className="py-1 font-mono">{p}</td>
                  <td>{b}</td>
                  <td className="tabular-nums">{s.today.providers[p]?.turns ?? 0}</td>
                  <td className="tabular-nums">{s.today.providers[p]?.failed ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {Object.keys(s.today.rules).length ? (
            <p className="font-mono text-[0.7rem] text-[#1b1713]/60">
              rules today: {Object.entries(s.today.rules).map(([k, v]) => `${k} ${v}`).join(' · ')}
            </p>
          ) : null}
          {s.configured ? (
            <div className="flex flex-wrap gap-2 text-[0.75rem]">
              {['wake', 'probe', 'drain', 'undrain'].map((a) => (
                <button key={a} disabled={busy} onClick={() => void act(a)} className="border border-[#ded8ce] px-3 py-1 hover:border-[#008f86] disabled:opacity-50">
                  {a}
                </button>
              ))}
              <span className="mx-2 text-[#1b1713]/40">|</span>
              <span className="text-[#1b1713]/60 self-center">My console uses:</span>
              {([['gpu', 'GPU when warm'], ['deepseek', 'DeepSeek'], [null, 'auto']] as const).map(([v, label]) => (
                <button
                  key={label}
                  onClick={() => pickTier(v)}
                  className={`border px-3 py-1 ${tier === v ? 'border-[#008f86] text-[#008f86]' : 'border-[#ded8ce]'}`}
                  data-testid={`tier-${v ?? 'auto'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[0.8rem] text-[#1b1713]/55">
              GPU tier is off. Set AGENT_GPU_MODE=owner plus AGENT_GPU_BASE_URL and AGENT_GPU_API_KEY in Vercel to enable it
              (see infra/gpu/README.md).
            </p>
          )}
        </>
      )}
    </section>
  );
}
