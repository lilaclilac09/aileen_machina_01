import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { checkRateLimit, type RateLimitConfig } from '@/lib/api/ratelimit';
import { commentLooksSpammy, DAILY_COMMENT_MAX, publicComment } from '@/lib/dailyBoard';
import { addDailyComment, dailyBoardWritesOk, hideDailyComment } from '@/lib/dailyBoardStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUBBLE_RATE: RateLimitConfig = {
  shortMax: 3,
  shortWindowMs: 60_000,
  dailyMax: 20,
  dailyWindowMs: 86_400_000,
};

/** Public anonymous bubble. Rate-limited. */
export async function POST(req: Request) {
  const owner = await requireOwnerFromRequest(req);
  if (!owner) {
    const rl = checkRateLimit(req, BUBBLE_RATE, 'daily-bubble');
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'rate_limit' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
      );
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  if (!dailyBoardWritesOk()) {
    return NextResponse.json({ error: 'not_stored', persistence: 'memory' }, { status: 503 });
  }

  const rec = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const noteId = typeof rec.noteId === 'string' ? rec.noteId : '';
  const text = typeof rec.body === 'string' ? rec.body : '';
  const nickname = typeof rec.nickname === 'string' ? rec.nickname : '';

  if (!text.trim() || text.length > DAILY_COMMENT_MAX) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  if (commentLooksSpammy(text)) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const result = await addDailyComment({ noteId, nickname, body: text });
  if ('error' in result) {
    const status = result.error === 'missing_note' ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ comment: publicComment(result) });
}

/** Owner-only: hide a bubble. */
export async function DELETE(req: Request) {
  const owner = await requireOwnerFromRequest(req);
  if (!owner) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get('id') || '';
  const ok = await hideDailyComment(id);
  if (!ok) return NextResponse.json({ error: 'missing' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
