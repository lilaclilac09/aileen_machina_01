import { withApi } from '../../../../../lib/api/handler';
import { DATA_RATE } from '../../../../../lib/api/ratelimit';
import { ok } from '../../../../../lib/api/jsonResp';
import { getPriceHistory } from '../../../../../lib/data/pricing';

export const runtime = 'edge';

const ALLOWED_UNITS = ['per_chip', 'per_card', 'per_server', 'per_hour_cloud', 'per_month_cloud'] as const;
type Unit = (typeof ALLOWED_UNITS)[number];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const GET = withApi({ rate: DATA_RATE, scope: 'pricing-history' }, async (req) => {
  const url = new URL(req.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const sku = decodeURIComponent(segments[segments.length - 1] ?? '');
  const from = url.searchParams.get('from') ?? undefined;
  const to = url.searchParams.get('to') ?? undefined;
  const unitParam = url.searchParams.get('unit') ?? undefined;
  const unit = unitParam && (ALLOWED_UNITS as readonly string[]).includes(unitParam) ? (unitParam as Unit) : undefined;
  const fromOk = !from || DATE.test(from);
  const toOk = !to || DATE.test(to);
  const range = fromOk && toOk ? { from, to, unit } : { unit };
  const points = getPriceHistory(sku, range);
  return ok({ sku, count: points.length, points });
});

export const OPTIONS = GET;
