import { withApi } from '../../../../lib/api/handler';
import { DATA_RATE } from '../../../../lib/api/ratelimit';
import { ok } from '../../../../lib/api/jsonResp';
import { listChips } from '../../../../lib/data/sku';

export const runtime = 'edge';

export const GET = withApi({ rate: DATA_RATE, scope: 'chips-list' }, async (req) => {
  const url = new URL(req.url);
  const vendor = url.searchParams.get('vendor') ?? undefined;
  const category = url.searchParams.get('category') ?? undefined;
  const family = url.searchParams.get('family') ?? undefined;
  const limit = Number(url.searchParams.get('limit') ?? '50');
  const items = listChips({
    vendor: vendor || undefined,
    category: category || undefined,
    family: family || undefined,
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 50,
  });
  return ok({ count: items.length, items });
});

export const OPTIONS = GET;
