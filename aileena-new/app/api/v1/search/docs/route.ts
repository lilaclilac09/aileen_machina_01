import { withApi } from '../../../../../lib/api/handler';
import { DATA_RATE } from '../../../../../lib/api/ratelimit';
import { ok, err } from '../../../../../lib/api/jsonResp';
import { searchDocs } from '../../../../../lib/data/docs';

export const runtime = 'edge';

export const GET = withApi({ rate: DATA_RATE, scope: 'search-docs' }, async (req) => {
  const url = new URL(req.url);
  const q = url.searchParams.get('q');
  if (!q || q.length < 2) return err('bad_request', 'Query param `q` is required (min 2 chars).', 400);
  const k = Math.min(Math.max(Number(url.searchParams.get('k') ?? '5'), 1), 10);
  const hits = searchDocs(q, k);
  return ok({ q, count: hits.length, hits });
});

export const OPTIONS = GET;
