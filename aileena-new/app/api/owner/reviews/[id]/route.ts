import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { readReview, removeInstanceReview } from '@/lib/reviews/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const owner = await requireOwnerFromRequest(req);
  if (!owner) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await ctx.params;
  const stored = await readReview(id);
  if (stored.status === 'empty') return NextResponse.json(stored, { status: 404 });
  return NextResponse.json(stored);
}

export async function DELETE(req: Request, ctx: Ctx) {
  const owner = await requireOwnerFromRequest(req);
  if (!owner) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await ctx.params;
  const removed = await removeInstanceReview(id);
  if (!removed) return NextResponse.json({ error: 'not_removed' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
