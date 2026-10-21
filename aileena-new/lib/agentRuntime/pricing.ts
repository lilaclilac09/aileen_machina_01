/**
 * List prices used to estimate the cost of each chat turn. Estimates only:
 * the provider's invoice is the source of truth.
 *
 * DeepSeek, USD per 1M tokens. Source: https://api-docs.deepseek.com/quick_start/pricing
 * (checked 2026-10-16). Off-peak is half of peak. Peak hours: 01:00-04:00 and
 * 06:00-10:00 UTC, Monday-Friday (Chinese public holidays are off-peak; not
 * modelled here, so holidays are slightly over-estimated).
 */
export type TokenPrice = { inHit: number; inMiss: number; out: number };

export const DEEPSEEK_PRICES_PEAK: Record<string, TokenPrice> = {
  'deepseek-flash': { inHit: 0.006, inMiss: 0.3, out: 1.2 },
  'deepseek-v4-pro': { inHit: 0.044, inMiss: 1.32, out: 3.96 },
};
/** Legacy ids DeepSeek still accepts are billed at the Flash price (same source, note 1). Assumed for deepseek-chat too. */
const DEEPSEEK_ALIASES: Record<string, string> = {
  'deepseek-chat': 'deepseek-flash',
  'deepseek-v4-flash': 'deepseek-flash',
  'deepseek-v4-flash-vision-exp': 'deepseek-flash',
};

export function isDeepSeekPeak(at: number): boolean {
  const d = new Date(at);
  const day = d.getUTCDay();
  if (day === 0 || day === 6) return false;
  const m = d.getUTCHours() * 60 + d.getUTCMinutes();
  return (m >= 60 && m < 240) || (m >= 360 && m < 600);
}

export function deepSeekPrice(model: string | undefined, at: number): TokenPrice | null {
  const id = model ? (DEEPSEEK_ALIASES[model] ?? model) : 'deepseek-flash';
  const peak = DEEPSEEK_PRICES_PEAK[id];
  if (!peak) return null;
  if (isDeepSeekPeak(at)) return peak;
  return { inHit: peak.inHit / 2, inMiss: peak.inMiss / 2, out: peak.out / 2 };
}

/**
 * Optional price override for the primary tier (provider id 'deepseek'), USD
 * per 1M tokens: PRIMARY_PRICE_IN (all input, cache hit or miss) and
 * PRIMARY_PRICE_OUT. Set them when DEEPSEEK_BASE_URL points at another host;
 * without them estimates stay at DeepSeek list prices, which need not match
 * that host's bill. Empty, non-numeric or negative values are ignored; an
 * unset field keeps its DeepSeek default.
 */
export function primaryPriceOverride(): { in?: number; out?: number } | null {
  const read = (k: string): number | undefined => {
    const raw = (process.env[k] ?? '').trim();
    if (!raw) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const inP = read('PRIMARY_PRICE_IN');
  const outP = read('PRIMARY_PRICE_OUT');
  if (inP === undefined && outP === undefined) return null;
  return { in: inP, out: outP };
}

/** PRIMARY_PRICE_IN/OUT (when set) layered over a DeepSeek default price. */
export function applyPrimaryPriceOverride(base: TokenPrice): TokenPrice {
  const o = primaryPriceOverride();
  if (!o) return base;
  return { inHit: o.in ?? base.inHit, inMiss: o.in ?? base.inMiss, out: o.out ?? base.out };
}

/** USD for one turn's tokens. Without a hit/miss split all input is priced as a miss. */
export function tokenCostUsd(p: TokenPrice, u: { inTok: number; hit: number | null; miss: number | null; outTok: number }): number {
  const hit = u.hit ?? 0;
  const miss = u.miss ?? Math.max(0, u.inTok - hit);
  return (hit * p.inHit + miss * p.inMiss + u.outTok * p.out) / 1_000_000;
}

/**
 * Modal GPU list prices, USD per second while a replica is up.
 * Source: https://modal.com/pricing (checked 2026-10-16).
 */
export const MODAL_GPU_USD_PER_SEC: Record<string, number> = {
  L40S: 0.000542,
  A10: 0.000306,
  L4: 0.000222,
  H100: 0.001097,
};

/**
 * GPU turn cost as a time share: seconds the turn held the GPU x the GPU's
 * per-second price. Over-counts when turns overlap (they share the replica)
 * and ignores idle/cold-start time, which the Modal bill does include.
 * AGENT_GPU_USD_PER_HOUR overrides; AGENT_GPU_TYPE picks a row (default L40S).
 */
export function gpuUsdPerSec(): number {
  const perHour = Number(process.env.AGENT_GPU_USD_PER_HOUR);
  if (Number.isFinite(perHour) && perHour > 0) return perHour / 3600;
  const type = (process.env.AGENT_GPU_TYPE || 'L40S').toUpperCase();
  return MODAL_GPU_USD_PER_SEC[type] ?? MODAL_GPU_USD_PER_SEC.L40S;
}

export function estimateTurnCostUsd(t: {
  provider: string;
  model?: string;
  at: number;
  inTok: number;
  outTok: number;
  hit: number | null;
  miss: number | null;
  modelMs: number;
}): number | null {
  if (t.provider === 'deepseek') {
    const ds = deepSeekPrice(t.model, t.at);
    const p = primaryPriceOverride() ? applyPrimaryPriceOverride(ds ?? DEEPSEEK_PRICES_PEAK['deepseek-flash']) : ds;
    return p ? tokenCostUsd(p, { inTok: t.inTok, hit: t.hit, miss: t.miss, outTok: t.outTok }) : null;
  }
  if (t.provider.startsWith('gpu')) return (Math.max(0, t.modelMs) / 1000) * gpuUsdPerSec();
  return null;
}
