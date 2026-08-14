/**
 * POST /api/voice-code/apply — public write door is locked.
 * Never writes. Never 200. Visitors copy/take a .patch from /api/voice-code.
 * Owner apply: POST /api/owner/voice-code/apply (OWNER_KEY session).
 */

export const runtime = 'edge';

const BODY = {
  ok: false,
  apply: false,
  write_target: null,
  permission: 'propose',
  harness: 'propose-only',
  error: 'Public apply is closed. Copy or take the .patch — nothing was written.',
} as const;

export async function POST() {
  return Response.json(BODY, { status: 403 });
}

export async function GET() {
  return Response.json(BODY, { status: 403 });
}
