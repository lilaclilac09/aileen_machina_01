/**
 * Owner small computer. Copied from cloudflare/computer examples/worker-shell,
 * then locked down: bearer auth, name=owner, write/exec allowlists.
 * Do not expose a visitor app. Do not add curl/python in v1.
 */
import { DurableObject } from 'cloudflare:workers';
import {
  type DurableObjectStorageLike,
  getWorkspace,
  WorkspaceServiceProxy,
  withWorkspace,
} from '@cloudflare/computer';
import { WorkerShellBackend } from '@cloudflare/computer/backends/worker-shell';

export { WorkspaceServiceProxy };

export interface Env {
  OwnerComputer: DurableObjectNamespace;
  LOADER: WorkerLoader;
  COMPUTER_WORKER_SECRET: string;
}

const OWNER = 'owner';
const MOUNT_ROOT = '/workspace';
const WRITE_PREFIXES = ['/workspace/scratch/', '/workspace/reports/', '/workspace/artifacts/'];
const EXEC_ALLOW = new Set(['echo', 'cat', 'ls', 'wc', 'head', 'tail', 'grep', 'mkdir']);
const RM_ALLOW = new Set(['rm']);

export class OwnerComputer extends withWorkspace(class extends DurableObject {}, (self) => {
  const { ctx, env } = self as unknown as { ctx: DurableObjectState; env: Env };
  return {
    storage: ctx.storage as unknown as DurableObjectStorageLike,
    backends: [
      new WorkerShellBackend({
        loader: env.LOADER,
        workspace: { binding: 'OwnerComputer', id: ctx.id.toString() },
        ctx,
      }),
    ],
  };
}) {}

interface ExecRequest {
  command?: string;
  argv?: string[];
  cwd?: string;
  encoding?: 'utf8';
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '') {
      return new Response(
        [
          'aileena-computer',
          'backend=cloudflare-worker-shell',
          'GET  /health',
          'PUT  /c/owner/file/workspace/<path>  (bearer)',
          'GET  /c/owner/file/workspace/<path>  (bearer)',
          'POST /c/owner/exec                   (bearer)',
          '',
        ].join('\n'),
        { headers: { 'content-type': 'text/plain; charset=utf-8' } },
      );
    }

    if (url.pathname === '/health') {
      return Response.json({ ok: true, backend: 'cloudflare-worker-shell', name: OWNER });
    }

    const denied = requireSecret(request, env);
    if (denied) return denied;

    const fileMatch = url.pathname.match(/^\/c\/([^/]+)\/file\/(.+)$/);
    if (fileMatch) {
      if (fileMatch[1] !== OWNER) return errorJSON(new Error('unknown workspace'), 404);
      const resolved = resolveMountPath(fileMatch[2]);
      if (resolved === null) {
        return errorJSON(new Error(`path must sit under ${MOUNT_ROOT}`), 400);
      }
      return handleFile(request, env, resolved);
    }

    const execMatch = url.pathname.match(/^\/c\/([^/]+)\/exec\/?$/);
    if (execMatch) {
      if (execMatch[1] !== OWNER) return errorJSON(new Error('unknown workspace'), 404);
      return handleExec(request, env);
    }

    return new Response('not found', { status: 404 });
  },
};

function requireSecret(request: Request, env: Env): Response | null {
  const secret = (env.COMPUTER_WORKER_SECRET || '').trim();
  if (!secret) return errorJSON(new Error('worker secret not configured'), 503);
  const header = request.headers.get('authorization') || '';
  if (header !== `Bearer ${secret}`) return errorJSON(new Error('unauthorized'), 401);
  return null;
}

function resolveMountPath(rest: string): string | null {
  const candidate = `/${rest}`;
  if (candidate !== MOUNT_ROOT && !candidate.startsWith(`${MOUNT_ROOT}/`)) return null;
  if (candidate.split('/').includes('..')) return null;
  return candidate;
}

function isWriteAllowed(path: string): boolean {
  return WRITE_PREFIXES.some((p) => path.startsWith(p) && path.length > p.length);
}

async function workspaceOf(env: Env) {
  const stub = env.OwnerComputer.get(env.OwnerComputer.idFromName(OWNER));
  return getWorkspace(stub as unknown as Parameters<typeof getWorkspace>[0]);
}

async function handleFile(request: Request, env: Env, path: string): Promise<Response> {
  using ws = await workspaceOf(env);

  if (request.method === 'PUT') {
    if (!isWriteAllowed(path)) return errorJSON(new Error('write path not allowlisted'), 400);
    const body = new Uint8Array(await request.arrayBuffer());
    if (body.byteLength > 64 * 1024) return errorJSON(new Error('file too large'), 413);
    try {
      const parent = path.split('/').slice(0, -1).join('/') || MOUNT_ROOT;
      await ws.fs.mkdir(parent, { recursive: true });
      await ws.fs.writeFile(path, body);
      return new Response(null, { status: 204 });
    } catch (error) {
      return errorJSON(error, 500);
    }
  }

  if (request.method === 'GET') {
    try {
      const stream = await ws.fs.readFile(path, {});
      return new Response(stream, {
        status: 200,
        headers: { 'content-type': 'application/octet-stream' },
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'ENOENT') return errorJSON(error, 404);
      return errorJSON(error, 500);
    }
  }

  return new Response('method not allowed', { status: 405, headers: { allow: 'GET, PUT' } });
}

async function handleExec(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('method not allowed', { status: 405, headers: { allow: 'POST' } });
  }
  let body: ExecRequest;
  try {
    body = (await request.json()) as ExecRequest;
  } catch {
    return errorJSON(new Error('invalid JSON body'), 400);
  }

  let argv: string[] = [];
  if (Array.isArray(body.argv) && body.argv.length > 0) {
    argv = body.argv.map((s) => String(s)).slice(0, 16);
  } else if (typeof body.command === 'string' && body.command.length > 0) {
    if (body.command.length > 1000) return errorJSON(new Error('command too long'), 400);
    argv = body.command.trim().split(/\s+/);
  } else {
    return errorJSON(new Error('must provide command or argv'), 400);
  }

  const bin = argv[0] || '';
  if (!EXEC_ALLOW.has(bin) && !RM_ALLOW.has(bin)) {
    return errorJSON(new Error(`command not allowlisted: ${bin}`), 400);
  }
  if (RM_ALLOW.has(bin)) {
    const target = argv.find((a) => a.startsWith('/workspace/') || (!a.startsWith('-') && a !== 'rm'));
    const abs = target?.startsWith('/') ? target : `${MOUNT_ROOT}/${target ?? ''}`;
    if (!target || !isWriteAllowed(abs)) {
      return errorJSON(new Error('rm only under scratch/reports/artifacts'), 400);
    }
  }

  const cwd = typeof body.cwd === 'string' && body.cwd.startsWith(MOUNT_ROOT) ? body.cwd : MOUNT_ROOT;
  const command = argv.map(shellQuote).join(' ');

  using ws = await workspaceOf(env);
  try {
    using handle = await ws.runtime.exec(command, { cwd, encoding: 'utf8' });
    const result = await handle.result();
    const stdout = clip(String(result.stdout ?? ''), 2000);
    const stderr = clip(String(result.stderr ?? ''), 2000);
    return Response.json({
      exitCode: result.exitCode,
      stdout,
      stderr,
    });
  } catch (error) {
    return errorJSON(error, 500);
  }
}

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function errorJSON(error: unknown, status: number): Response {
  const message = error instanceof Error ? error.message : String(error);
  const code = (error as { code?: string }).code;
  return Response.json({ error: message, code }, { status });
}

function shellQuote(arg: string): string {
  if (/^[A-Za-z0-9_\-+=:,./@%]+$/.test(arg)) return arg;
  return `'${arg.replace(/'/g, `'\\''`)}'`;
}
