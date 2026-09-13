import { NextResponse } from 'next/server';
import { openAndBurnDailySnap } from '@/lib/dailyBoardStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Visitor view-once. Returns the snap then burns it for everyone.
 * Owner preview uses GET /api/daily/snap — this route always burns.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const rec = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const noteId = typeof rec.noteId === 'string' ? rec.noteId : '';
  const result = await openAndBurnDailySnap(noteId);
  if (result.status === 'none') {
    return NextResponse.json({ status: 'none' }, { status: 404 });
  }
  if (result.status === 'burned') {
    return NextResponse.json({ status: 'burned' }, { status: 410 });
  }
  return NextResponse.json({
    status: 'ready',
    mime: result.blob.mime,
    data: result.blob.data,
  });
}
