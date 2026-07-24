/**
 * IP-based rate limiting for the public /api/v1 surface.
 *
 * In-memory sliding window per edge-instance. Two-tier:
 *   - shortMax in shortWindowMs   (burst cap, "5 reqs per 10 s")
 *   - dailyMax in dailyWindowMs   (daily ceiling, "1000 / 24 h")
 *
 * Caveats:
 *   - Each Vercel edge instance has its own counter. A determined caller
 *     hitting many regions can amplify. For a small public API this is
 *     fine; if traffic grows, swap the Map for Upstash Redis (Vercel KV)
 *     — interface stays the same.
 *   - Counters reset on cold start. That's a feature for a free demo, a
 *     bug for billing. When auth lands, key counters move to Supabase.
 *
 * IP extraction tries (in order):
 *   1. CF-Connecting-IP (Cloudflare)
 *   2. X-Forwarded-For (first hop)
 *   3. X-Real-IP
 *   4. fallback constant — all anonymous callers share one bucket
 */

type Bucket = {
  shortStart: number;
  shortCount: number;
  dailyStart: number;
  dailyCount: number;
};

const BUCKETS = new Map<string, Bucket>();

// Periodically evict buckets idle longer than 24 h to bound memory.
const EVICT_AFTER_MS = 24 * 60 * 60 * 1000;
let lastEvictAt = 0;
function evict(now: number): void {
  if (now - lastEvictAt < 60_000) return; // run at most once per minute
  lastEvictAt = now;
  for (const [ip, b] of BUCKETS) {
    if (now - b.dailyStart > EVICT_AFTER_MS && now - b.shortStart > EVICT_AFTER_MS) {
      BUCKETS.delete(ip);
    }
  }
}

export function clientIp(req: Request): string {
  const h = req.headers;
  const cf = h.get('cf-connecting-ip');
  if (cf) return cf.trim();
  const xff = h.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xr = h.get('x-real-ip');
  if (xr) return xr.trim();
  return 'anonymous';
}

export type RateLimitConfig = {
  shortMax: number;
  shortWindowMs: number;
  dailyMax: number;
  dailyWindowMs: number;
};

export type RateLimitResult = {
  ok: boolean;
  reason?: 'burst' | 'daily';
  retryAfterSec: number;
  shortRemaining: number;
  dailyRemaining: number;
};

export function checkRateLimit(
  req: Request,
  cfg: RateLimitConfig,
  bucketScope: string = 'default',
): RateLimitResult {
  const ip = clientIp(req);
  const key = `${bucketScope}:${ip}`;
  const now = Date.now();
  evict(now);

  let b = BUCKETS.get(key);
  if (!b) {
    b = { shortStart: now, shortCount: 0, dailyStart: now, dailyCount: 0 };
    BUCKETS.set(key, b);
  }

  // Roll the short window.
  if (now - b.shortStart >= cfg.shortWindowMs) {
    b.shortStart = now;
    b.shortCount = 0;
  }
  // Roll the daily window.
  if (now - b.dailyStart >= cfg.dailyWindowMs) {
    b.dailyStart = now;
    b.dailyCount = 0;
  }

  if (b.shortCount >= cfg.shortMax) {
    return {
      ok: false,
      reason: 'burst',
      retryAfterSec: Math.ceil((cfg.shortWindowMs - (now - b.shortStart)) / 1000),
      shortRemaining: 0,
      dailyRemaining: Math.max(0, cfg.dailyMax - b.dailyCount),
    };
  }
  if (b.dailyCount >= cfg.dailyMax) {
    return {
      ok: false,
      reason: 'daily',
      retryAfterSec: Math.ceil((cfg.dailyWindowMs - (now - b.dailyStart)) / 1000),
      shortRemaining: Math.max(0, cfg.shortMax - b.shortCount),
      dailyRemaining: 0,
    };
  }

  b.shortCount++;
  b.dailyCount++;

  return {
    ok: true,
    retryAfterSec: 0,
    shortRemaining: cfg.shortMax - b.shortCount,
    dailyRemaining: cfg.dailyMax - b.dailyCount,
  };
}

// ── Standard tiers ────────────────────────────────────────────────────

// Cheap data lookups — IP-friendly.
export const DATA_RATE: RateLimitConfig = {
  shortMax: 30,
  shortWindowMs: 10_000,
  dailyMax: 1000,
  dailyWindowMs: 86_400_000,
};

// LLM /query endpoint — each call costs Aileen DeepSeek tokens.
export const LLM_RATE: RateLimitConfig = {
  shortMax: 5,
  shortWindowMs: 60_000,
  dailyMax: 30,
  dailyWindowMs: 86_400_000,
};

// Inkling clip tool — expensive multimodal API + ffmpeg/yt-dlp on server.
export const TOOLS_INKLING_RATE: RateLimitConfig = {
  shortMax: 1,
  shortWindowMs: 120_000,
  dailyMax: 8,
  dailyWindowMs: 86_400_000,
};
