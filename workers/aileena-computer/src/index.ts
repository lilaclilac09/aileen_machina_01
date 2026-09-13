/**
 * Small computer. Official worker-shell (just-bash) + worker-javascript
 * + CloudflareContainerBackend (computerd Linux) on the same Durable
 * Object workspace. python / yq / sqlite groups stay off (workerd gaps).
 * Visitors keep core files commands only — no network bins, no JS, no Linux.
 */
import { DurableObject } from 'cloudflare:workers';
import {
  type DurableObjectStorageLike,
  getWorkspace,
  WorkspaceProxy,
  WorkspaceServiceProxy,
  withWorkspace,
} from '@cloudflare/computer';
import {
  CloudflareContainerBackend,
  withWorkspaceContainer,
} from '@cloudflare/computer/backends/container';
import { WorkerJavaScriptBackend } from '@cloudflare/computer/backends/worker-javascript';
import { WorkerShellBackend } from '@cloudflare/computer/backends/worker-shell';
import curlModules from '@cloudflare/computer/shell/curl';
import jqModules from '@cloudflare/computer/shell/jq';
import htmlToMarkdownModules from '@cloudflare/computer/shell/html-to-markdown';
import fileModules from '@cloudflare/computer/shell/file';
import xanModules from '@cloudflare/computer/shell/xan';

export { WorkspaceProxy, WorkspaceServiceProxy };

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
  'find',
  'tree',
  'diff',
  'base64',
  'stat',
  'basename',
  'dirname',
  'du',
  'touch',
  'md5sum',
  'sha1sum',
]);
const OWNER_BINS = new Set([
  ...CORE_BINS,
  'curl',
  'jq',
  'html-to-markdown',
  'file',
  'xan',
  'rm',
  'cp',
  'mv',
]);
const VISITOR_BINS = new Set([...CORE_BINS, 'rm']);
const WRITE_DEST_BINS = new Set(['rm', 'cp', 'mv', 'touch']);
const CONTAINER_BINS = new Set([
  ...CORE_BINS,
  'uname',
  'hostname',
  'id',
  'whoami',
  'node',
  'npm',
  'npx',
  'git',
  'curl',
  'file',
  'rm',
  'cp',
  'mv',
  'chmod',
  'which',
  'env',
  'printenv',
  'sha256sum',
]);

class ContainerBase extends withWorkspaceContainer(class extends DurableObject {}) {
  readonly backend = new CloudflareContainerBackend({
    id: 'container',
    container: () => this,
    workspace: { binding: 'OwnerComputer', id: this.ctx.id.toString() },
    egress: { mode: 'direct' },
    connectTimeoutMs: 45_000,
  });
}

function workspaceOptions(self: InstanceType<typeof ContainerBase>) {
  const { ctx, env } = self as unknown as { ctx: DurableObjectState; env: Env };
  return {
    storage: ctx.storage as unknown as DurableObjectStorageLike,
    useThink: true,
    backends: [
      new WorkerShellBackend({
        id: 'worker-shell',
        loader: env.LOADER,
        workspace: { binding: 'OwnerComputer', id: ctx.id.toString() },
        ctx,
        commands: [curlModules, jqModules, htmlToMarkdownModules, fileModules, xanModules],
        egress: { mode: 'direct' },
      }),
      new WorkerJavaScriptBackend({
        id: 'worker-javascript',
        loader: env.LOADER,
      }),
      new WorkerJavaScriptBackend({
        id: 'worker-javascript-none',
        loader: env.LOADER,
        globalOutbound: null,
      }),
      self.backend,
    ],
  };
}

export class OwnerComputer extends withWorkspace(ContainerBase, workspaceOptions) {
  override async fetch(request: Request): Promise<Response> {
    return this.backend.handleFetch(request);
  }
}

interface ExecRequest {
  command?: string;
  source?: string;
  backend?: string;
  argv?: string[];
  cwd?: string;
  encoding?: 'utf8';
  input?: unknown;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '') {
      return new Response(
        [
          'aileena-computer',
          'backend=cloudflare-worker-shell+worker-javascript+container',
          'groups=curl,jq,html-to-markdown,file,xan',
          'container=bound',
          'GET  /health',
          'PUT  /c/<name>/file/workspace/<path>  (bearer)',
          'GET  /c/<name>/file/workspace/<path>  (bearer)',
          'POST /c/<name>/exec                   (bearer; backend=worker-shell|worker-javascript|container)',
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
        backends: ['worker-shell', 'worker-javascript', 'worker-javascript-none', 'container'],
        groups: ['curl', 'jq', 'html-to-markdown', 'file', 'xan'],
        egress: 'direct',
        javascript: true,
        container: true,
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
  await using ws = await workspaceOf(env, name);

  if (request.method === 'PUT') {
    if (!isWriteAllowed(path)) return errorJSON(new Error('write path not allowlisted'), 400);
    const body = new Uint8Array(await request.arrayBuffer());
    if (body.byteLength > 64 * 1024) return errorJSON(new Error('file too large'), 413);
    try {
      const parent = path.split('/').slice(0, -1).join('/') || MOUNT_ROOT;
      await ws.fs.mkdir(parent, { recursive: true });
      try {
        await ws.fs.rm(path);
      } catch {
        /* first write */
      }
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

  const backendRaw = String(body.backend || '').trim();
  const jsSource = typeof body.source === 'string' ? body.source.trim() : '';
  const jsBackend =
    backendRaw === 'worker-javascript-none'
      ? 'worker-javascript-none'
      : backendRaw === 'worker-javascript' || backendRaw === 'js' || Boolean(jsSource && !body.command)
        ? 'worker-javascript'
        : '';

  const cwd = typeof body.cwd === 'string' && body.cwd.startsWith(MOUNT_ROOT) ? body.cwd : MOUNT_ROOT;

  if (jsBackend) {
    if (name !== OWNER) return errorJSON(new Error('javascript exec is owner only'), 403);
    const source = jsSource || (typeof body.command === 'string' ? body.command.trim() : '');
    if (!source) return errorJSON(new Error('must provide source'), 400);
    if (source.length > 8000) return errorJSON(new Error('source too long'), 400);
    await using ws = await workspaceOf(env, name);
    try {
      await using handle = await ws.runtime.exec(source, {
        backend: jsBackend,
        cwd,
        encoding: 'utf8',
        input: body.input,
      });
      const result = await handle.result();
      return Response.json({
        exitCode: result.exitCode,
        stdout: clip(String(result.stdout ?? ''), 4000),
        stderr: clip(String(result.stderr ?? ''), 2000),
        value: result.value ?? null,
        backend: jsBackend,
      });
    } catch (error) {
      return errorJSON(error, 500);
    }
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
  const container = backendRaw === 'container';
  if (container) {
    if (name !== OWNER) return errorJSON(new Error('container exec is owner only'), 403);
    if (!CONTAINER_BINS.has(bin)) {
      return errorJSON(new Error(`command not allowlisted: ${bin}`), 400);
    }
  } else {
    const allow = name === OWNER ? OWNER_BINS : VISITOR_BINS;
    if (!allow.has(bin)) {
      return errorJSON(new Error(`command not allowlisted: ${bin}`), 400);
    }
  }
  if (WRITE_DEST_BINS.has(bin)) {
    const parts = command.split(/\s+/).slice(1).filter((a) => a && !a.startsWith('-'));
    const target = parts.at(-1);
    const abs = target?.startsWith('/') ? target : `${MOUNT_ROOT}/${target ?? ''}`;
    if (!target || !isWriteAllowed(abs)) {
      return errorJSON(new Error(`${bin} only under scratch/reports/artifacts`), 400);
    }
  }

  const execBackend = container ? 'container' : 'worker-shell';
  await using ws = await workspaceOf(env, name);
  try {
    await using handle = await ws.runtime.exec(command, { backend: execBackend, cwd, encoding: 'utf8' });
    const result = await handle.result();
    const stdout = clip(String(result.stdout ?? ''), 4000);
    const stderr = clip(String(result.stderr ?? ''), 2000);
    return Response.json({
      exitCode: result.exitCode,
      stdout,
      stderr,
      backend: execBackend,
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
