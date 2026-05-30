import { NextRequest } from 'next/server';

/**
 * Pulls "who is this" context off an incoming request so the owner can see
 * exactly who unlocked the writing — IP, city/country + coords (Vercel geo
 * headers), timezone, languages, device/browser, and where they came from.
 */
export function visitorInfo(req: NextRequest) {
  const h = req.headers;
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'unknown';
  const city = h.get('x-vercel-ip-city');
  const region = h.get('x-vercel-ip-country-region');
  const country = h.get('x-vercel-ip-country');
  const lat = h.get('x-vercel-ip-latitude');
  const lng = h.get('x-vercel-ip-longitude');
  const loc =
    [city ? decodeURIComponent(city) : '', region || '', country || '']
      .filter(Boolean)
      .join(', ') || 'unknown';
  return {
    ip,
    loc,
    coords: lat && lng ? `${lat},${lng}` : '',
    tz: h.get('x-vercel-ip-timezone') || '',
    lang: h.get('accept-language') || '',
    ua: h.get('user-agent') || 'unknown',
    referer: h.get('referer') || '',
  };
}

/** Trust-but-trim the browser-reported fields before they hit the owner's inbox. */
export function sanitizeClient(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  let n = 0;
  for (const [k, val] of Object.entries(raw as Record<string, unknown>)) {
    if (n++ >= 20) break;
    if (val == null || typeof val === 'object') continue;
    out[String(k).slice(0, 40)] = String(val).slice(0, 200);
  }
  return out;
}

/** A ready-to-paste block for the owner-notification emails. */
export function visitorLines(
  req: NextRequest,
  opts: { reading?: string; client?: unknown } = {},
): string {
  const v = visitorInfo(req);
  const client = sanitizeClient(opts.client);
  const clientLines = Object.entries(client).map(([k, val]) => `  ${k}: ${val}`);
  return [
    opts.reading ? `Reading: ${opts.reading}` : null,
    `IP: ${v.ip}`,
    `Location: ${v.loc}`,
    v.coords ? `Coords: ${v.coords}` : null,
    v.tz ? `Edge timezone: ${v.tz}` : null,
    `Accept-Language: ${v.lang}`,
    `Device: ${v.ua}`,
    v.referer ? `From: ${v.referer}` : null,
    clientLines.length ? `Browser:\n${clientLines.join('\n')}` : null,
    `At: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join('\n');
}
