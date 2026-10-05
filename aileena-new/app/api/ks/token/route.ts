import { NextResponse } from 'next/server';
import { ksSessionOf } from '@/lib/keyshield/request';
import { createKsSession, KS_CLI_MAX_AGE } from '@/lib/keyshield/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await ksSessionOf(req);
  if (!session) return NextResponse.json({ error: 'session' }, { status: 401 });
  const token = await createKsSession(session.vaultId, {
    via: session.via,
    sub: session.sub,
    sid: session.sid,
    cli: true,
    ttlSec: KS_CLI_MAX_AGE,
  });
  return NextResponse.json({
    ok: true,
    token,
    ttlSec: KS_CLI_MAX_AGE,
    hint: 'Use as Bearer in API/CLI calls. Valid 24h.',
  });
}
