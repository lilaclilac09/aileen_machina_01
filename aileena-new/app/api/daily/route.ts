import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { readPublicDailyBoard } from '@/lib/dailyBoardStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public board: notes, visible comments, theme. */
export async function GET(req: Request) {
  const owner = await requireOwnerFromRequest(req);
  const board = await readPublicDailyBoard(Boolean(owner));
  return NextResponse.json(board);
}
