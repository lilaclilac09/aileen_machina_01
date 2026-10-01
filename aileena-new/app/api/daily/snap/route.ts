import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { dailyBoardWritesOk, readDailySnapBlob, writeDailySnap } from '@/lib/dailyBoardStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Owner-only preview. Does not burn. Visitors get 403. */
export async function GET(req: Request) {
  const owner = await requireOwnerFromRequest(req);
  if (!owner) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const noteId = new URL(req.url).searchParams.get('noteId') || '';
  const blob = await readDailySnapBlob(noteId);
  if (!blob) {
    return NextResponse.json({ status: 'none' }, { status: 404 });
  }
  return NextResponse.json({ status: 'ready', mime: blob.mime, data: blob.data });
}

/** Owner-only: attach one snapshot to a note. */
export async function POST(req: Request) {
  const owner = await requireOwnerFromRequest(req);
  if (!owner) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (!dailyBoardWritesOk()) {
    return NextResponse.json({ error: 'not_stored', persistence: 'memory' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const rec = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const result = await writeDailySnap({
    noteId: typeof rec.noteId === 'string' ? rec.noteId : '',
    mime: rec.mime,
    data: rec.data,
  });
  if ('error' in result) {
    const status = result.error === 'missing_note' ? 404 : result.error === 'too_large' ? 413 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ note: result });
}
