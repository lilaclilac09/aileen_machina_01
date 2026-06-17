import { withApi } from '../../../../../lib/api/handler';
import { DATA_RATE } from '../../../../../lib/api/ratelimit';
import { ok, err } from '../../../../../lib/api/jsonResp';
import { searchArticles } from '../../../../../lib/agentSearch';

export const runtime = 'edge';

export const GET = withApi({ rate: DATA_RATE, scope: 'search-articles' }, async (req) => {
  const url = new URL(req.url);
  const q = url.searchParams.get('q');
  if (!q || q.length < 2) return err('bad_request', 'Query param `q` is required (min 2 chars).', 400);
  const k = Math.min(Math.max(Number(url.searchParams.get('k') ?? '3'), 1), 10);
  const hits = searchArticles(q, k);
  return ok({
    q,
    count: hits.length,
    hits: hits.map((h) => ({
      slug: h.slug,
      title: h.title,
      section: h.section,
      snippet: h.snippet,
      score: h.score,
      url: `https://aileena.xyz/blog/${h.slug}`,
    })),
  });
});

export const OPTIONS = GET;
