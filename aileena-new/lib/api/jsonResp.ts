/**
 * Standard JSON response envelope for the public /api/v1 surface.
 *
 *   ok:   { ok: true, data: {...} }
 *   err:  { ok: false, error: { code, message } }
 *
 * Plus a thin CORS-open helper since these endpoints are meant to be
 * called from any origin (browser scripts, curl, server-side, etc.).
 */

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function withCors(headers: Record<string, string> = {}): Headers {
  return new Headers({ ...CORS_HEADERS, ...headers, 'Content-Type': 'application/json' });
}

export function ok<T>(data: T, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ ok: true, data }), {
    status: 200,
    headers: withCors(extraHeaders),
  });
}

export function err(
  code: string,
  message: string,
  status = 400,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify({ ok: false, error: { code, message } }), {
    status,
    headers: withCors(extraHeaders),
  });
}

export function notFound(message = 'Not found'): Response {
  return err('not_found', message, 404);
}

export function methodNotAllowed(allow: string[]): Response {
  return new Response(JSON.stringify({ ok: false, error: { code: 'method_not_allowed', message: `Method not allowed. Allow: ${allow.join(', ')}` } }), {
    status: 405,
    headers: withCors({ Allow: allow.join(', ') }),
  });
}

export function preflight(): Response {
  return new Response(null, { status: 204, headers: withCors() });
}
