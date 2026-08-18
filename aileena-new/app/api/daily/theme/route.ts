import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { sanitizeTheme } from '@/lib/dailyBoard';
import { writeDailyTheme } from '@/lib/dailyBoardStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Owner-only theme swatches. Visitors get 403. */
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
  const theme = await writeDailyTheme(sanitizeTheme(body));
  return NextResponse.json({ theme });
}
