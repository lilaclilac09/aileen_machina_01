/**
 * Salted, daily-rotated visitor hash. The raw IP is read from the request
 * headers, mixed into an HMAC with today's date and a server secret, and
 * dropped — it is never logged, stored or returned. The same visitor gets a
 * different hash tomorrow, so hashes cannot be joined across days.
 */

function secret(): string {
  return process.env.AUTH_SECRET || process.env.CHAT_QUOTA_SECRET || process.env.OWNER_KEY || 'dev-only-engage-salt';
}

/** Client IP from proxy headers. Use only as input to dailyVisitorHash. */
export function clientIpTransient(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') || '';
  return (xff.split(',')[0] || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || '').trim();
}

export async function dailyVisitorHash(
  parts: { ip: string; extra?: string; purpose: string },
  at = Date.now(),
): Promise<string> {
  const day = new Date(at).toISOString().slice(0, 10);
  const enc = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey('raw', enc.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(`${parts.purpose}|${day}|${parts.ip}|${parts.extra ?? ''}`));
  return Array.from(new Uint8Array(sig).slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Coarse geo from Vercel / Cloudflare headers: country code only (never city). */
export function countryFromRequest(req: Request): string {
  const c = (req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || '').toUpperCase();
  return /^[A-Z]{2}$/.test(c) ? c : 'XX';
}
