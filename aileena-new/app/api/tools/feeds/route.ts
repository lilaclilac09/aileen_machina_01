import { err, ok } from '../../../../lib/api/jsonResp';
import { checkRateLimit, DATA_RATE } from '../../../../lib/api/ratelimit';
import { LISTENING_FEEDS, loadListeningFeedItems } from '../../../../lib/tools/feeds';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: Request) {
  const rl = checkRateLimit(req, DATA_RATE, 'tools-feeds');
  if (!rl.ok) {
    return err(
      rl.reason === 'burst' ? 'rate_limit_burst' : 'rate_limit_daily',
      'Too many feed requests',
      429,
      { 'Retry-After': String(rl.retryAfterSec) },
    );
  }

  const items = await loadListeningFeedItems(12);
  if (items.length === 0) {
    return err('upstream_empty', 'Could not load listening-shelf RSS feeds', 502);
  }

  return ok({
    sources: LISTENING_FEEDS.map((f) => ({
      id: f.id,
      name: f.name,
      meta: f.meta,
      siteUrl: f.siteUrl,
    })),
    count: items.length,
    items,
  });
}
