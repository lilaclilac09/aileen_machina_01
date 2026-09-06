import { NextResponse } from 'next/server';
import { isComputerPrototypeEnabled, prototypeDisabledReason } from '@/lib/computer/flag';
import { getComputerTask, hydrateComputerStore, isOwnerComputerTask, nowIso, taskActorId, upsertComputerTask } from '@/lib/computer/store';
import { attachTaskToProof } from '@/lib/proofQueue/store';
import { applyComputerActorCookie, computerActorFromRequest } from '@/lib/computer/actor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  if (!isComputerPrototypeEnabled()) {
    return NextResponse.json({ ok: false, error: prototypeDisabledReason() }, { status: 404 });
  }
  const actor = await computerActorFromRequest(req);
  const { id } = await ctx.params;
  await hydrateComputerStore(actor.id);
  const task = getComputerTask(id);
  if (!task || taskActorId(task) !== actor.id) {
    return applyComputerActorCookie(NextResponse.json({ ok: false, error: 'missing' }, { status: 404 }), actor);
  }
  if (task.status === 'completed') {
    return applyComputerActorCookie(
      NextResponse.json({ ok: false, error: 'already completed' }, { status: 409 }),
      actor,
    );
  }
  const next = await upsertComputerTask({
    ...task,
    cancelled: true,
    status: 'failed',
    error: 'cancelled',
    resultSummary: actor.kind === 'owner' ? 'cancelled by owner' : 'cancelled',
    completedAt: nowIso(),
    updatedAt: nowIso(),
    logsRedacted: [...task.logsRedacted, actor.kind === 'owner' ? 'cancelled by owner' : 'cancelled'],
  });
  if (isOwnerComputerTask(next)) {
    attachTaskToProof(next.proofItemId, next.id, 'observed');
  }
  return applyComputerActorCookie(
    NextResponse.json({ ok: true, message: '⚡ Nope. Cancelled.', task: next, prototype: true }),
    actor,
  );
}
