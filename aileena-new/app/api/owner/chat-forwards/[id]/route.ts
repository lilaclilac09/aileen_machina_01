import { getChatForward } from '@/lib/chatForwardStore';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Owner-only: one durable chat forward with full transcript.
 * Decrypts server-side after the owner session check.
 * GET /api/owner/chat-forwards/:id
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const owner = await requireOwnerFromRequest(req);
  if (!owner) {
    return NextResponse.json({ ok: false, error: 'Owner session required.' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const safeId = (id || '').trim().slice(0, 80);
  if (!safeId) {
    return NextResponse.json({ ok: false, error: 'Missing id.' }, { status: 400 });
  }

  const rec = await getChatForward(safeId);
  if (!rec) {
    return NextResponse.json({ ok: false, error: 'Not found.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item: rec });
}
