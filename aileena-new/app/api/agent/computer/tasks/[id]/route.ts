import { NextResponse } from 'next/server';
import { isComputerPrototypeEnabled, prototypeDisabledReason } from '@/lib/computer/flag';
import { reportedBackend } from '@/lib/computer/cfClient';
import { getComputerTask, hydrateComputerStore, isOwnerComputerTask, taskActorId } from '@/lib/computer/store';
import { getProofItem } from '@/lib/proofQueue/store';
import { applyComputerActorCookie, computerActorFromRequest } from '@/lib/computer/actor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  if (!isComputerPrototypeEnabled()) {
    return NextResponse.json({ ok: false, error: prototypeDisabledReason() }, { status: 404 });
  }
  const actor = await computerActorFromRequest(req);
  await hydrateComputerStore(actor.id);
  const { id } = await ctx.params;
  const task = getComputerTask(id);
  if (!task || taskActorId(task) !== actor.id) {
    return applyComputerActorCookie(NextResponse.json({ ok: false, error: 'missing' }, { status: 404 }), actor);
  }
  const owner = isOwnerComputerTask(task);
  return applyComputerActorCookie(
    NextResponse.json({
      ok: true,
      prototype: true,
      backend: reportedBackend(),
      status: task.status,
      logsSummary: task.logsRedacted,
      artifacts: task.artifacts,
      errors: task.error,
      task,
      proofItem: owner ? getProofItem(task.proofItemId) : null,
    }),
    actor,
  );
}
