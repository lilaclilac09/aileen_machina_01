import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { isComputerPrototypeEnabled, prototypeDisabledReason } from '@/lib/computer/flag';
import { getComputerTask } from '@/lib/computer/store';
import { getProofItem } from '@/lib/proofQueue/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  if (!isComputerPrototypeEnabled()) {
    return NextResponse.json({ ok: false, error: prototypeDisabledReason() }, { status: 404 });
  }
  const owner = await requireOwnerFromRequest(req);
  if (!owner) return NextResponse.json({ ok: false, error: 'Owner only.' }, { status: 403 });
  const { id } = await ctx.params;
  const task = getComputerTask(id);
  if (!task) return NextResponse.json({ ok: false, error: 'missing' }, { status: 404 });
  return NextResponse.json({
    ok: true,
    prototype: true,
    backend: 'local-shim',
    status: task.status,
    logsSummary: task.logsRedacted,
    artifacts: task.artifacts,
    errors: task.error,
    task,
    proofItem: getProofItem(task.proofItemId),
  });
}
