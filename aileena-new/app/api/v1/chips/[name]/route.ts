import { withApi } from '../../../../../lib/api/handler';
import { DATA_RATE } from '../../../../../lib/api/ratelimit';
import { ok, notFound } from '../../../../../lib/api/jsonResp';
import { queryChip } from '../../../../../lib/data/sku';

export const runtime = 'edge';

export const GET = withApi({ rate: DATA_RATE, scope: 'chip' }, async (req) => {
  const url = new URL(req.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const name = decodeURIComponent(segments[segments.length - 1] ?? '');
  if (!name) return notFound('Missing SKU name segment.');
  const sku = queryChip(name);
  if (!sku) return notFound(`No SKU matched "${name}".`);
  return ok({ sku });
});

export const OPTIONS = GET;
