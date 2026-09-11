import { NextResponse } from 'next/server';
import { isComputerPrototypeEnabled, prototypeDisabledReason } from '@/lib/computer/flag';
import { reportedBackend } from '@/lib/computer/cfClient';
import { applyComputerActorCookie, computerActorFromRequest } from '@/lib/computer/actor';
import { callMcpApp, listMcpApps } from '@/lib/mcp/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req: Request) {
  if (!isComputerPrototypeEnabled()) {
    return NextResponse.json({ ok: false, error: prototypeDisabledReason() }, { status: 404 });
  }
  const actor = await computerActorFromRequest(req);
  if (actor.kind !== 'owner') {
    return applyComputerActorCookie(
      NextResponse.json({ ok: false, error: 'owner only' }, { status: 403 }),
      actor,
    );
  }
  const apps = await listMcpApps();
  return applyComputerActorCookie(
    NextResponse.json({ ok: true, backend: reportedBackend(), container: false, apps }),
    actor,
  );
}

export async function POST(req: Request) {
  if (!isComputerPrototypeEnabled()) {
    return NextResponse.json({ ok: false, error: prototypeDisabledReason() }, { status: 404 });
  }
  const actor = await computerActorFromRequest(req);
  if (actor.kind !== 'owner') {
    return applyComputerActorCookie(
      NextResponse.json({ ok: false, error: 'owner only' }, { status: 403 }),
      actor,
    );
  }
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }
  const app = String(body.app || '').trim();
  const tool = String(body.tool || '').trim();
  const args =
    body.args && typeof body.args === 'object' && !Array.isArray(body.args)
      ? (body.args as Record<string, unknown>)
      : {};
  const result = await callMcpApp(app, tool, args, actor.id);
  return applyComputerActorCookie(NextResponse.json({ ok: result.ok, backend: reportedBackend(), result }), actor);
}
