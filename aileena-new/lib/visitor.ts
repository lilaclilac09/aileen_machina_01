import { NextRequest } from 'next/server';

/**
 * Pulls "who is this" context off an incoming request so the owner can see
 * exactly who unlocked the writing — IP, city/country (Vercel geo headers),
 * device/browser, and where they came from.
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
  const loc =
    [city ? decodeURIComponent(city) : '', region || '', country || '']
      .filter(Boolean)
      .join(', ') || 'unknown';
  return {
    ip,
    loc,
    ua: h.get('user-agent') || 'unknown',
    referer: h.get('referer') || '',
  };
}

/** A ready-to-paste block for the owner-notification emails. */
export function visitorLines(req: NextRequest, opts: { reading?: string } = {}): string {
  const v = visitorInfo(req);
  return [
    opts.reading ? `Reading: ${opts.reading}` : null,
    `IP: ${v.ip}`,
    `Location: ${v.loc}`,
    `Device: ${v.ua}`,
    v.referer ? `From: ${v.referer}` : null,
    `At: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join('\n');
}
