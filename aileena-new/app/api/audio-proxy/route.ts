/**
 * GET /api/audio-proxy?url=<urlencoded-mp3-url>
 *
 * Forwards an audio request to hardwax.com (or another allowlisted source)
 * with a real browser User-Agent and Referer = https://hardwax.com/, so
 * that hot-link / referer-locked previews load from our site.
 *
 * Restrictions:
 *   - Only URLs whose hostname matches HARDWAX_HOSTS are accepted. Prevents
 *     this route from being used as an open proxy for arbitrary content.
 *   - Streams the upstream response back unchanged. Sets Accept-Ranges and
 *     Cache-Control headers so HTML5 <audio> seeking + edge caching work.
 *   - If upstream returns 403 (Cloudflare bot-block), we forward the status
 *     so the client can fall back gracefully.
 */

export const runtime = 'edge';

const HARDWAX_HOSTS = new Set([
  'hardwax.com',
  'www.hardwax.com',
  'static.hardwax.com',
  'cdn.hardwax.com',
  'audio.hardwax.com',
]);

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Range',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = url.searchParams.get('url');
  if (!target) {
    return new Response(JSON.stringify({ error: 'missing url param' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new Response(JSON.stringify({ error: 'invalid url' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  if (!HARDWAX_HOSTS.has(parsed.hostname)) {
    return new Response(
      JSON.stringify({ error: 'host not allowed', host: parsed.hostname }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      },
    );
  }

  // Forward the visitor's Range header so HTML5 audio scrubbing keeps working.
  const range = req.headers.get('range') ?? '';

  let upstream: Response;
  try {
    upstream = await fetch(parsed.toString(), {
      headers: {
        'User-Agent': BROWSER_UA,
        Referer: 'https://hardwax.com/',
        Accept: 'audio/mpeg, audio/*, */*;q=0.5',
        'Accept-Language': 'en-US,en;q=0.9',
        ...(range ? { Range: range } : {}),
      },
      // Edge runtime fetch — no body upload, no special tuning needed.
    });
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: 'upstream fetch failed',
        message: e instanceof Error ? e.message : String(e),
      }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
    );
  }

  // Pass through the audio bytes + the important headers.
  const headers = new Headers(CORS_HEADERS);
  for (const k of [
    'content-type',
    'content-length',
    'content-range',
    'accept-ranges',
    'last-modified',
    'etag',
  ]) {
    const v = upstream.headers.get(k);
    if (v) headers.set(k, v);
  }
  if (!headers.has('content-type')) headers.set('Content-Type', 'audio/mpeg');
  if (!headers.has('accept-ranges')) headers.set('Accept-Ranges', 'bytes');
  // Edge cache the snippet for a day — they're 30-60 s previews, near-immutable.
  headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
