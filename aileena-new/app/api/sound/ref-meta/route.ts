/**
 * GET /api/sound/ref-meta?url=
 *
 * Server-side Open Graph title + image for carousel reference items.
 * Does not fetch or proxy audio. Page URLs stay reference-only.
 */

import { err, ok, preflight } from '../../../../lib/api/jsonResp';

export const runtime = 'edge';

const MAX_HTML = 400_000;
const BLOCKED_HOST = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/i;
const CACHE_MS = 10 * 60 * 1000;
const META_CACHE = new Map<string, { at: number; payload: Record<string, unknown> }>();

export function OPTIONS() {
  return preflight();
}

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get('url')?.trim() ?? '';
  const parsed = sanitizePageUrl(raw);
  if (!parsed) return err('bad_url', 'Need an http(s) page URL.', 400);

  const cached = META_CACHE.get(parsed.href);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return ok(cached.payload, { 'Cache-Control': 'public, max-age=600' });
  }

  let html = '';
  try {
    const res = await fetch(parsed.href, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (compatible; AileenaRef/1.0)',
      },
      redirect: 'follow',
    });
    if (!res.ok) return err('fetch_failed', `Could not read page (${res.status}).`, 502);
    const ct = res.headers.get('content-type') || '';
    if (/audio|octet-stream/i.test(ct) && !/html|xml|text\//i.test(ct)) {
      const payload = {
        title: (parsed.pathname.split('/').pop() || parsed.hostname).slice(0, 120),
        coverSrc: undefined,
        href: parsed.href,
        referenceOnly: true,
        mixable: false,
      };
      META_CACHE.set(parsed.href, { at: Date.now(), payload });
      return ok(payload, { 'Cache-Control': 'public, max-age=600' });
    }
    const buf = await res.arrayBuffer();
    html = new TextDecoder('utf-8', { fatal: false }).decode(buf.slice(0, MAX_HTML));
  } catch (e) {
    return err('fetch_failed', e instanceof Error ? e.message : 'Could not read page.', 502);
  }

  const title =
    meta(html, 'og:title') ||
    meta(html, 'twitter:title') ||
    tagTitle(html) ||
    parsed.hostname;
  const image = absolutize(parsed, meta(html, 'og:image') || meta(html, 'twitter:image'));
  const artist = meta(html, 'music:musician') || meta(html, 'og:audio:artist') || undefined;

  const payload = {
    title: title.slice(0, 120),
    artist: artist ? artist.slice(0, 80) : undefined,
    coverSrc: image ? image.slice(0, 500) : undefined,
    href: parsed.href,
    referenceOnly: true,
    mixable: false,
  };
  META_CACHE.set(parsed.href, { at: Date.now(), payload });
  return ok(payload, { 'Cache-Control': 'public, max-age=600' });
}

function sanitizePageUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (BLOCKED_HOST.test(u.hostname)) return null;
    return u;
  } catch {
    return null;
  }
}

function meta(html: string, prop: string): string {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
    'i',
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
    'i',
  );
  return decode(re.exec(html)?.[1] || re2.exec(html)?.[1] || '');
}

function tagTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return decode(m?.[1] || '');
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function absolutize(base: URL, src: string): string | undefined {
  if (!src) return undefined;
  try {
    const u = new URL(src, base);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return undefined;
    return u.href;
  } catch {
    return undefined;
  }
}
