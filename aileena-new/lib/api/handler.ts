/**
 * Higher-order wrapper for /api/v1 routes.
 *
 *   export const GET = withApi({ rate: DATA_RATE, scope: 'chips' }, async (req) => {
 *     // ... your logic, return ok(data) or err(...) ...
 *   });
 *
 * Handles:
 *   - OPTIONS preflight (returns 204 + CORS headers)
 *   - Rate-limit check before invoking the handler
 *   - Catches thrown errors and returns a 500 json envelope
 *   - Adds X-RateLimit-* headers to every response
 */

import { preflight, err } from './jsonResp';
import { checkRateLimit, type RateLimitConfig } from './ratelimit';

type Handler = (req: Request) => Promise<Response> | Response;

export function withApi(
  opts: { rate: RateLimitConfig; scope: string },
  handler: Handler,
): Handler {
  return async (req: Request) => {
    if (req.method === 'OPTIONS') return preflight();

    const rl = checkRateLimit(req, opts.rate, opts.scope);
    if (!rl.ok) {
      return err(
        rl.reason === 'burst' ? 'rate_limit_burst' : 'rate_limit_daily',
        rl.reason === 'burst'
          ? `Too many requests. Try again in ${rl.retryAfterSec}s.`
          : `Daily rate limit reached. Resets in ${Math.round(rl.retryAfterSec / 3600)}h.`,
        429,
        {
          'Retry-After': String(rl.retryAfterSec),
          'X-RateLimit-Daily-Remaining': String(rl.dailyRemaining),
          'X-RateLimit-Burst-Remaining': String(rl.shortRemaining),
        },
      );
    }

    try {
      const res = await handler(req);
      res.headers.set('X-RateLimit-Daily-Remaining', String(rl.dailyRemaining));
      res.headers.set('X-RateLimit-Burst-Remaining', String(rl.shortRemaining));
      return res;
    } catch (e) {
      console.error('[api/v1] handler threw:', e);
      const msg = e instanceof Error ? e.message : String(e);
      return err('internal_error', msg.slice(0, 200), 500);
    }
  };
}
