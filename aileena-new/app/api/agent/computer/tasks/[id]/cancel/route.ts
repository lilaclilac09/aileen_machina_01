import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { isComputerPrototypeEnabled, prototypeDisabledReason } from '@/lib/computer/flag';
import { getComputerTask, nowIso, upsertComputerTask } from '@/lib/computer/store';
import { attachTaskToProof } from '@/lib/proofQueue/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  if (!isComputerPrototypeEnabled()) {
    return NextResponse.json({ ok: false, error: prototypeDisabledReason() }, { status: 404 });
  }
  const owner = await requireOwnerFromRequest(req);
  if (!owner) return NextResponse.json({ ok: false, error: 'Owner only.' }, { status: 403 });
  const { id } = await ctx.params;
  const task = getComputerTask(id);
  if (!task) return NextResponse.json({ ok: false, error: 'missing' }, { status: 404 });
  if (task.status === 'completed') {
    return NextResponse.json({ ok: false, error: 'already completed' }, { status: 409 });
  }
  const next = upsertComputerTask({
    ...task,
    cancelled: true,
    status: 'failed',
    error: 'cancelled',
    resultSummary: 'cancelled by owner',
    completedAt: nowIso(),
    updatedAt: nowIso(),
    logsRedacted: [...task.logsRedacted, 'cancelled by owner'],
  });
  attachTaskToProof(next.proofItemId, next.id, 'observed');
  return NextResponse.json({ ok: true, message: '⚡ Nope. Cancelled.', task: next, prototype: true });
}
