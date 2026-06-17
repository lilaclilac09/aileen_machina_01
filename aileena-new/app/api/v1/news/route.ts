import { withApi } from '../../../../lib/api/handler';
import { DATA_RATE } from '../../../../lib/api/ratelimit';
import { ok } from '../../../../lib/api/jsonResp';
import { latestNews } from '../../../../lib/data/news';

export const runtime = 'edge';

export const GET = withApi({ rate: DATA_RATE, scope: 'news' }, async (req) => {
  const url = new URL(req.url);
  const vendor = url.searchParams.get('vendor') ?? undefined;
  const sinceDate = url.searchParams.get('since') ?? url.searchParams.get('sinceDate') ?? undefined;
  const limit = Number(url.searchParams.get('limit') ?? '10');
  const items = latestNews({
    vendor: vendor || undefined,
    sinceDate: sinceDate || undefined,
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 50) : 10,
  });
  return ok({ count: items.length, items });
});

export const OPTIONS = GET;
