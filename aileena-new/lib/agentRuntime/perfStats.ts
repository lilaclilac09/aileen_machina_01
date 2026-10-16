/** Pure aggregations for the performance dashboard (no I/O; unit-tested offline). */
import type { PerfTurn } from './perf';

export function percentile(values: number[], q: number): number | null {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const i = Math.min(v.length - 1, Math.max(0, Math.ceil(q * v.length) - 1));
  return v[i];
}

const mean = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);

/** Output tokens per second after the first token (decode speed). */
export function decodeTokPerSec(t: PerfTurn): number | null {
  if (t.ttftMs === null || t.outTok <= 0) return null;
  const ms = t.latencyMs - t.ttftMs;
  return ms > 0 ? t.outTok / (ms / 1000) : null;
}

export type PerfSummary = {
  n: number;
  ttftP50: number | null;
  ttftP95: number | null;
  latP50: number | null;
  latP95: number | null;
  prepP50: number | null;
  tokInAvg: number | null;
  tokOutAvg: number | null;
  decodeTokS: number | null;
  /** cached input tokens / all input tokens, over turns that report a split. */
  cacheHitRate: number | null;
  costPerTurn: number | null;
  costTotal: number;
  rates: { error: number; empty: number; retry: number; degrade: number; drop: number; cancelled: number };
};

export function summarize(turns: PerfTurn[]): PerfSummary {
  const n = turns.length;
  const answered = turns.filter((t) => t.outcome === 'ok');
  const ttft = answered.map((t) => t.ttftMs).filter((x): x is number => x !== null);
  const lat = answered.map((t) => t.latencyMs);
  let hit = 0;
  let all = 0;
  for (const t of turns) {
    if (t.cacheHit === null) continue;
    hit += t.cacheHit;
    all += t.cacheHit + (t.cacheMiss ?? Math.max(0, t.inTok - t.cacheHit));
  }
  const costs = turns.map((t) => t.costUsd).filter((x): x is number => x !== null);
  const rate = (pred: (t: PerfTurn) => boolean) => (n ? turns.filter(pred).length / n : 0);
  const decode = answered.map(decodeTokPerSec).filter((x): x is number => x !== null);
  return {
    n,
    ttftP50: percentile(ttft, 0.5),
    ttftP95: percentile(ttft, 0.95),
    latP50: percentile(lat, 0.5),
    latP95: percentile(lat, 0.95),
    prepP50: percentile(answered.map((t) => t.prepMs), 0.5),
    tokInAvg: mean(answered.map((t) => t.inTok)),
    tokOutAvg: mean(answered.map((t) => t.outTok)),
    decodeTokS: percentile(decode, 0.5),
    cacheHitRate: all > 0 ? hit / all : null,
    costPerTurn: mean(costs),
    costTotal: costs.reduce((a, b) => a + b, 0),
    rates: {
      error: rate((t) => t.outcome === 'error'),
      empty: rate((t) => t.outcome === 'empty'),
      retry: rate((t) => t.retries > 0),
      degrade: rate((t) => t.outcome === 'degrade' || t.outcome === 'error' || t.outcome === 'drop'),
      drop: rate((t) => t.outcome === 'drop'),
      cancelled: rate((t) => t.outcome === 'cancelled'),
    },
  };
}

export function countBy(turns: PerfTurn[], key: (t: PerfTurn) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of turns) out[key(t)] = (out[key(t)] ?? 0) + 1;
  return out;
}

/** Compare key: provider, plus the GPU optimisation variant when known. */
export function compareKey(t: PerfTurn): string {
  const base = t.provider.startsWith('gpu') ? `${t.provider}${t.variant ? ` · ${t.variant}` : ''}` : t.provider;
  return t.model && !t.provider.startsWith('gpu') ? `${base} · ${t.model}` : base;
}

export function groupSummaries(turns: PerfTurn[], key: (t: PerfTurn) => string): Array<{ key: string; s: PerfSummary }> {
  const groups = new Map<string, PerfTurn[]>();
  for (const t of turns) {
    const k = key(t);
    groups.set(k, [...(groups.get(k) ?? []), t]);
  }
  return [...groups.entries()].map(([k, list]) => ({ key: k, s: summarize(list) })).sort((a, b) => b.s.n - a.s.n);
}

export type SeriesPoint = { t: number; n: number; ttftP50: number | null; ttftP95: number | null; latP50: number | null; latP95: number | null };

/** Fixed-width time buckets ending at `now` (default: 24 one-hour buckets). */
export function timeSeries(turns: PerfTurn[], opts: { now?: number; bucketMs?: number; buckets?: number } = {}): SeriesPoint[] {
  const now = opts.now ?? Date.now();
  const size = opts.bucketMs ?? 3_600_000;
  const count = opts.buckets ?? 24;
  const end = Math.ceil(now / size) * size;
  const start = end - size * count;
  const bins: PerfTurn[][] = Array.from({ length: count }, () => []);
  for (const t of turns) {
    if (t.at < start || t.at >= end || t.outcome !== 'ok') continue;
    bins[Math.floor((t.at - start) / size)].push(t);
  }
  return bins.map((b, i) => {
    const ttft = b.map((t) => t.ttftMs).filter((x): x is number => x !== null);
    const lat = b.map((t) => t.latencyMs);
    return {
      t: start + i * size,
      n: b.length,
      ttftP50: percentile(ttft, 0.5),
      ttftP95: percentile(ttft, 0.95),
      latP50: percentile(lat, 0.5),
      latP95: percentile(lat, 0.95),
    };
  });
}
