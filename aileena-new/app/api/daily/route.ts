import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { publicComment } from '@/lib/dailyBoard';
import { readDailyBoard } from '@/lib/dailyBoardStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public board: notes, visible comments, theme. Owner also sees hidden=false only in public GET. */
export async function GET(req: Request) {
  const owner = await requireOwnerFromRequest(req);
  const board = await readDailyBoard({ owner: Boolean(owner) });
  const comments: Record<string, ReturnType<typeof publicComment>[]> = {};
  for (const [noteId, list] of Object.entries(board.comments)) {
    comments[noteId] = list.filter((c) => !c.hidden).map(publicComment);
  }
  return NextResponse.json({
    theme: board.theme,
    notes: board.notes,
    comments,
    persistence: board.persistence,
    today: board.today,
    owner: Boolean(owner),
  });
}
