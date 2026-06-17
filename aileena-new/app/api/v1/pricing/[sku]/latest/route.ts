import { withApi } from '../../../../../../lib/api/handler';
import { DATA_RATE } from '../../../../../../lib/api/ratelimit';
import { ok, notFound } from '../../../../../../lib/api/jsonResp';
import { getLatestPrice } from '../../../../../../lib/data/pricing';

export const runtime = 'edge';

const ALLOWED_UNITS = ['per_chip', 'per_card', 'per_server', 'per_hour_cloud', 'per_month_cloud'] as const;
type Unit = (typeof ALLOWED_UNITS)[number];

export const GET = withApi({ rate: DATA_RATE, scope: 'pricing-latest' }, async (req) => {
  const url = new URL(req.url);
  const segments = url.pathname.split('/').filter(Boolean);
  // .../pricing/<sku>/latest → sku is second-to-last
  const sku = decodeURIComponent(segments[segments.length - 2] ?? '');
  const unitParam = url.searchParams.get('unit') ?? undefined;
  const unit = unitParam && (ALLOWED_UNITS as readonly string[]).includes(unitParam) ? (unitParam as Unit) : undefined;
  const point = getLatestPrice(sku, unit);
  if (!point) return notFound(`No pricing recorded for "${sku}".`);
  return ok({ point });
});

export const OPTIONS = GET;
