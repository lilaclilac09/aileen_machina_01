import { withApi } from '../../../../../lib/api/handler';
import { DATA_RATE } from '../../../../../lib/api/ratelimit';
import { ok, err } from '../../../../../lib/api/jsonResp';
import { compareChips } from '../../../../../lib/data/sku';

export const runtime = 'edge';

export const GET = withApi({ rate: DATA_RATE, scope: 'chips-compare' }, async (req) => {
  const url = new URL(req.url);
  const a = url.searchParams.get('a');
  const b = url.searchParams.get('b');
  if (!a || !b) return err('bad_request', 'Both `a` and `b` query params are required.', 400);
  const result = compareChips(a, b);
  return ok(result);
});

export const OPTIONS = GET;
