/**
 * GET /api/hardwax-product?id=<numeric-id>[&path=<artist/title>]
 *
 * Server-side scrape of a Hard Wax product page. Hard Wax's Cloudflare
 * actively bot-blocks raw fetches from non-residential IPs and from
 * obvious automation User-Agents, so we mimic a real browser session.
 *
 * Returns whatever we can pull:
 *   { ok, data: { id, productUrl, cover, ogTitle, mp3Urls: string[] } }
 *
 * If Cloudflare rejects (403 + JS challenge page), we surface that as
 * { ok: false, error: { code: 'cloudflare_block' } } so the client can
 * fall back to a non-playable card.
 *
 * Cached at the edge for 6 h — Hard Wax product pages are near-static.
 */

export const runtime = 'edge';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=21600, s-maxage=21600',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

function ok(data: unknown) {
  return new Response(JSON.stringify({ ok: true, data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function err(code: string, message: string, status = 502) {
  return new Response(JSON.stringify({ ok: false, error: { code, message } }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const path = url.searchParams.get('path'); // optional "artist/title" tail
  if (!id || !/^\d+$/.test(id)) {
    return err('bad_request', '`id` must be a numeric Hard Wax product ID.', 400);
  }

  const productUrl = `https://hardwax.com/${id}/${path ? path : ''}`.replace(/\/+$/, '/');

  let res: Response;
  try {
    res = await fetch(productUrl, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-User': '?1',
        'Sec-Fetch-Dest': 'document',
        'Upgrade-Insecure-Requests': '1',
      },
    });
  } catch (e) {
    return err(
      'upstream_fetch_failed',
      e instanceof Error ? e.message : String(e),
      502,
    );
  }

  if (res.status === 403 || res.status === 503) {
    return err(
      'cloudflare_block',
      `Hard Wax returned ${res.status} — Cloudflare bot challenge. Visit ${productUrl} in a browser to grab the MP3 URL manually.`,
      res.status,
    );
  }
  if (!res.ok) {
    return err('upstream_error', `Hard Wax returned ${res.status}`, res.status);
  }

  const html = await res.text();

  // MP3 URLs: match any URL that ends in .mp3 (with optional query string).
  // Hard Wax's preview snippets live under hardwax.com/audio/... historically.
  const mp3Set = new Set<string>();
  for (const m of html.matchAll(/https?:\/\/[^"'\s)]+\.mp3(?:\?[^"'\s)]*)?/gi)) {
    mp3Set.add(m[0]);
  }
  for (const m of html.matchAll(/["'](\/[^"']+\.mp3(?:\?[^"']*)?)["']/gi)) {
    mp3Set.add(new URL(m[1], productUrl).toString());
  }
  for (const m of html.matchAll(/data-(?:src|mp3|snippet)=["']([^"']+\.mp3[^"']*)["']/gi)) {
    try {
      mp3Set.add(new URL(m[1], productUrl).toString());
    } catch {
      /* skip non-URL values */
    }
  }

  const mp3Urls = Array.from(mp3Set);

  // og:image (cover) — pretty universal pattern on product pages.
  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const titleTag = html.match(/<title>([^<]+)<\/title>/i);

  return ok({
    id,
    productUrl,
    cover: ogImage?.[1] ?? null,
    ogTitle: ogTitle?.[1] ?? titleTag?.[1] ?? null,
    mp3Urls,
    mp3Count: mp3Urls.length,
  });
}
