import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { upsertDailyNote } from '@/lib/dailyBoardStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Owner-only: create or edit today's (or dated) main note. Visitors get 403. */
export async function POST(req: Request) {
  const owner = await requireOwnerFromRequest(req);
  if (!owner) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const rec = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const text = typeof rec.body === 'string' ? rec.body : '';
  const title = typeof rec.title === 'string' ? rec.title : '';
  const date = typeof rec.date === 'string' ? rec.date : undefined;
  const note = await upsertDailyNote({ date, title, body: text });
  return NextResponse.json({ note });
}
