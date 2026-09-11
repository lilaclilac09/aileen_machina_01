/**
 * Small computer. Official worker-shell (just-bash) with opted-in
 * curl / jq groups. Owner gets the full opted-in shell.
 * python/sqlite groups are not advertised: just-bash python needs
 * node:worker_threads; sqlite needs a compiled worker the preview
 * package does not ship. Visitors keep core files commands only.
 */
import { DurableObject } from 'cloudflare:workers';
import {
  type DurableObjectStorageLike,
  getWorkspace,
  WorkspaceServiceProxy,
  withWorkspace,
} from '@cloudflare/computer';
import { WorkerShellBackend } from '@cloudflare/computer/backends/worker-shell';
import curlModules from '@cloudflare/computer/shell/curl';
import jqModules from '@cloudflare/computer/shell/jq';

export { WorkspaceServiceProxy };

export interface Env {
  OwnerComputer: DurableObjectNamespace;
  LOADER: WorkerLoader;
  COMPUTER_WORKER_SECRET: string;
}

const OWNER = 'owner';
const VISITOR_RE = /^v-[a-z0-9]{8,32}$/;
const MOUNT_ROOT = '/workspace';
const WRITE_PREFIXES = ['/workspace/scratch/', '/workspace/reports/', '/workspace/artifacts/'];
const CORE_BINS = new Set([
  'echo',
  'cat',
  'ls',
  'wc',
  'head',
  'tail',
  'grep',
  'mkdir',
  'sed',
  'awk',
  'sort',
  'uniq',
  'cut',
  'tr',
  'date',
  'pwd',
  'printf',
  'tee',
]);
const OWNER_BINS = new Set([
  ...CORE_BINS,
  'curl',
  'jq',
  'rm',
]);
const VISITOR_BINS = new Set([...CORE_BINS, 'rm']);

export class OwnerComputer extends withWorkspace(class extends DurableObject {}, (self) => {
  const { ctx, env } = self as unknown as { ctx: DurableObjectState; env: Env };
  return {
    storage: ctx.storage as unknown as DurableObjectStorageLike,
    backends: [
      new WorkerShellBackend({
        loader: env.LOADER,
        workspace: { binding: 'OwnerComputer', id: ctx.id.toString() },
        ctx,
        commands: [curlModules, jqModules],
        egress: { mode: 'direct' },
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
          'groups=curl,jq',
          'GET  /health',
          'PUT  /c/<name>/file/workspace/<path>  (bearer)',
          'GET  /c/<name>/file/workspace/<path>  (bearer)',
          'POST /c/<name>/exec                   (bearer)',
          'name=owner | v-[a-z0-9]{8,32}',
          '',
        ].join('\n'),
        { headers: { 'content-type': 'text/plain; charset=utf-8' } },
      );
    }

    if (url.pathname === '/health') {
      return Response.json({
        ok: true,
        backend: 'cloudflare-worker-shell',
        groups: ['curl', 'jq'],
        egress: 'direct',
      });
    }

    const denied = requireSecret(request, env);
    if (denied) return denied;

    const fileMatch = url.pathname.match(/^\/c\/([^/]+)\/file\/(.+)$/);
    if (fileMatch) {
      const name = fileMatch[1];
      if (!isAllowedWorkspaceName(name)) return errorJSON(new Error('unknown workspace'), 404);
      const resolved = resolveMountPath(fileMatch[2]);
      if (resolved === null) {
        return errorJSON(new Error(`path must sit under ${MOUNT_ROOT}`), 400);
      }
      return handleFile(request, env, name, resolved);
    }

    const execMatch = url.pathname.match(/^\/c\/([^/]+)\/exec\/?$/);
    if (execMatch) {
      const name = execMatch[1];
      if (!isAllowedWorkspaceName(name)) return errorJSON(new Error('unknown workspace'), 404);
      return handleExec(request, env, name);
    }

    return new Response('not found', { status: 404 });
  },
};

function isAllowedWorkspaceName(name: string): boolean {
  return name === OWNER || VISITOR_RE.test(name);
}

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

async function workspaceOf(env: Env, name: string) {
  const stub = env.OwnerComputer.get(env.OwnerComputer.idFromName(name));
  return getWorkspace(stub as unknown as Parameters<typeof getWorkspace>[0]);
}

async function handleFile(request: Request, env: Env, name: string, path: string): Promise<Response> {
  using ws = await workspaceOf(env, name);

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

async function handleExec(request: Request, env: Env, name: string): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('method not allowed', { status: 405, headers: { allow: 'POST' } });
  }
  let body: ExecRequest;
  try {
    body = (await request.json()) as ExecRequest;
  } catch {
    return errorJSON(new Error('invalid JSON body'), 400);
  }

  let command = '';
  if (typeof body.command === 'string' && body.command.trim()) {
    if (body.command.length > 2000) return errorJSON(new Error('command too long'), 400);
    command = body.command.trim();
  } else if (Array.isArray(body.argv) && body.argv.length > 0) {
    command = body.argv.map((s) => String(s)).slice(0, 16).map(shellQuote).join(' ');
  } else {
    return errorJSON(new Error('must provide command or argv'), 400);
  }

  const bin = command.split(/\s+/)[0] || '';
  const allow = name === OWNER ? OWNER_BINS : VISITOR_BINS;
  if (!allow.has(bin)) {
    return errorJSON(new Error(`command not allowlisted: ${bin}`), 400);
  }
  if (bin === 'rm') {
    const parts = command.split(/\s+/).slice(1);
    const target = parts.find((a) => a.startsWith('/workspace/') || (!a.startsWith('-') && a !== 'rm'));
    const abs = target?.startsWith('/') ? target : `${MOUNT_ROOT}/${target ?? ''}`;
    if (!target || !isWriteAllowed(abs)) {
      return errorJSON(new Error('rm only under scratch/reports/artifacts'), 400);
    }
  }

  const cwd = typeof body.cwd === 'string' && body.cwd.startsWith(MOUNT_ROOT) ? body.cwd : MOUNT_ROOT;

  using ws = await workspaceOf(env, name);
  try {
    using handle = await ws.runtime.exec(command, { cwd, encoding: 'utf8' });
    const result = await handle.result();
    const stdout = clip(String(result.stdout ?? ''), 4000);
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
