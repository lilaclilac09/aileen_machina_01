import { NextResponse } from 'next/server';
import { requireOwnerFromRequest } from '@/lib/owner-gate';
import { isComputerPrototypeEnabled, prototypeDisabledReason } from '@/lib/computer/flag';
import { listLearned, rememberCommand } from '@/lib/computer/learned';
import { parseOwnerComputerCommand } from '@/lib/computer/parseOwnerCommand';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!isComputerPrototypeEnabled()) {
    return NextResponse.json({ error: prototypeDisabledReason() }, { status: 404 });
  }
  const owner = await requireOwnerFromRequest(req);
  if (!owner) return NextResponse.json({ error: 'Owner only.' }, { status: 403 });
  return NextResponse.json({ ok: true, learned: listLearned() });
}

export async function POST(req: Request) {
  if (!isComputerPrototypeEnabled()) {
    return NextResponse.json({ error: prototypeDisabledReason() }, { status: 404 });
  }
  const owner = await requireOwnerFromRequest(req);
  if (!owner) return NextResponse.json({ error: 'Owner only.' }, { status: 403 });
  let body: { alias?: string; expands?: string } = {};
  try {
    body = (await req.json()) as { alias?: string; expands?: string };
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const alias = (body.alias || '').trim();
  const expands = (body.expands || '').trim();
  if (!alias || !expands) return NextResponse.json({ error: 'need alias and expands' }, { status: 400 });
  const parsed = parseOwnerComputerCommand(expands);
  if (!parsed || parsed.kind !== 'queue_task') {
    return NextResponse.json({ error: 'expands must be a computer command' }, { status: 400 });
  }
  const row = rememberCommand({
    alias,
    expands,
    taskType: parsed.taskType,
    instructions: parsed.instructions,
    route: parsed.route,
  });
  return NextResponse.json({ ok: true, learned: row });
}
