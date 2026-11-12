import { NextResponse } from 'next/server';
import { checkRateLimit, COMPUTER_APP_STATE_RATE } from '@/lib/api/ratelimit';
import {
  APP_STATE_MAX_BYTES,
  appStatePath,
  DEFAULT_APP_STATE,
  isComputerAppId,
  parseAppState,
  type ComputerAppId,
} from '@/lib/computer/apps';
import { applyComputerActorCookie, computerActorFromRequest, type ComputerActor } from '@/lib/computer/actor';
import { cfGetFile, cfPutFile, isCloudflareComputerReady, reportedBackend } from '@/lib/computer/cfClient';
import { isComputerPrototypeEnabled, prototypeDisabledReason } from '@/lib/computer/flag';
import { redactSecrets } from '@/lib/computer/redact';
import { workspaceReadFile, workspaceWriteFile } from '@/lib/computer/workspace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ app: string }> };

function reply(actor: ComputerActor, body: unknown, status = 200) {
  return applyComputerActorCookie(NextResponse.json(body, { status }), actor);
}

/** Cloudflare workspace path in production; the local shim mirrors it under .data in dev. */
async function readState(actor: ComputerActor, app: ComputerAppId): Promise<string | null> {
  const path = appStatePath(app);
  try {
    if (isCloudflareComputerReady()) return await cfGetFile(path, actor.id);
    return await workspaceReadFile(actor.id, path.replace(/^\/workspace/, ''));
  } catch (err) {
    if (err instanceof Error && err.message === 'missing') return null;
    throw err;
  }
}

async function writeState(actor: ComputerActor, app: ComputerAppId, text: string): Promise<void> {
  const path = appStatePath(app);
  if (isCloudflareComputerReady()) await cfPutFile(path, text, actor.id);
  else await workspaceWriteFile(actor.id, path.replace(/^\/workspace/, ''), text);
}

async function appFrom(req: Request, ctx: Ctx) {
  const actor = await computerActorFromRequest(req);
  const { app } = await ctx.params;
  return { actor, app: isComputerAppId(app) ? app : null };
}

export async function GET(req: Request, ctx: Ctx) {
  if (!isComputerPrototypeEnabled()) return NextResponse.json({ ok: false, error: prototypeDisabledReason() }, { status: 404 });
  const { actor, app } = await appFrom(req, ctx);
  if (!app) return reply(actor, { ok: false, error: 'unknown app' }, 404);
  try {
    const raw = await readState(actor, app);
    let state = DEFAULT_APP_STATE[app];
    if (raw) {
      try {
        state = parseAppState(app, JSON.parse(raw)) ?? state;
      } catch {
        /* corrupt file: start clean, next save overwrites it */
      }
    }
    return reply(actor, { ok: true, app, state, backend: reportedBackend(), path: appStatePath(app) });
  } catch (err) {
    return reply(actor, { ok: false, error: redactSecrets(err instanceof Error ? err.message : 'read failed') }, 502);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  if (!isComputerPrototypeEnabled()) return NextResponse.json({ ok: false, error: prototypeDisabledReason() }, { status: 404 });
  const { actor, app } = await appFrom(req, ctx);
  if (!app) return reply(actor, { ok: false, error: 'unknown app' }, 404);

  const rl = checkRateLimit(req, COMPUTER_APP_STATE_RATE, `computer-app:${actor.id}`);
  if (!rl.ok) return reply(actor, { ok: false, error: 'slow down' }, 429);

  const text = await req.text();
  if (text.length > APP_STATE_MAX_BYTES) return reply(actor, { ok: false, error: 'too large' }, 413);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return reply(actor, { ok: false, error: 'invalid JSON' }, 400);
  }
  const state = parseAppState(app, (body as { state?: unknown } | null)?.state);
  if (!state) return reply(actor, { ok: false, error: 'invalid state' }, 400);

  try {
    await writeState(actor, app, `${JSON.stringify(state)}\n`);
    return reply(actor, { ok: true, app, state, backend: reportedBackend(), path: appStatePath(app) });
  } catch (err) {
    return reply(actor, { ok: false, error: redactSecrets(err instanceof Error ? err.message : 'write failed') }, 502);
  }
}
