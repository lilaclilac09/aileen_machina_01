import { NextResponse } from 'next/server';
import { getKsPasskey } from '@/lib/keyshield/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) return NextResponse.json({ error: 'id' }, { status: 400 });
  const stored = await getKsPasskey(body.id);
  if (!stored) return NextResponse.json({ error: 'unknown' }, { status: 404 });
  return NextResponse.json({
    ok: true,
    id: stored.id,
    iv: stored.sealIv,
    cipher: stored.sealCipher,
  });
}
