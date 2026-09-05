/**
 * HTTP client for workers/aileena-computer.
 * Do not import @cloudflare/computer here. That package only runs on Workers.
 */
import { isComputerPrototypeEnabled } from './flag';
import { clip, redactSecrets } from './redact';

export type ComputerBackend = 'local-shim' | 'cloudflare-worker-shell';

const TIMEOUT_MS = 15_000;

export function isCloudflareComputerReady(): boolean {
  if (!isComputerPrototypeEnabled()) return false;
  const url = (process.env.COMPUTER_WORKER_URL || '').trim();
  const secret = (process.env.COMPUTER_WORKER_SECRET || '').trim();
  return Boolean(url && secret);
}

export function reportedBackend(): ComputerBackend {
  return isCloudflareComputerReady() ? 'cloudflare-worker-shell' : 'local-shim';
}

function workerUrl(): string {
  return (process.env.COMPUTER_WORKER_URL || '').trim().replace(/\/$/, '');
}

function secret(): string {
  return (process.env.COMPUTER_WORKER_SECRET || '').trim();
}

export function toWorkspacePath(input: string): string | null {
  let p = input.trim().replaceAll('\\', '/');
  if (!p) return null;
  if (p === '/scratch' || p === 'scratch') p = '/workspace/scratch';
  else if (p.startsWith('/scratch/')) p = `/workspace${p}`;
  else if (p.startsWith('scratch/')) p = `/workspace/${p}`;
  else if (p === 'workspace') p = '/workspace';
  else if (p.startsWith('workspace/')) p = `/${p}`;
  if (p !== '/workspace' && !p.startsWith('/workspace/')) return null;
  if (p.split('/').includes('..')) return null;
  return p;
}

export function isWorkspaceIntent(input: string): boolean {
  return toWorkspacePath(input) !== null;
}

async function cfFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${workerUrl()}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${secret()}`,
        ...(init.headers || {}),
      },
    });
  } finally {
    clearTimeout(t);
  }
}

export async function cfHealth(): Promise<{ ok: boolean; backend?: string; error?: string }> {
  try {
    const res = await fetch(`${workerUrl()}/health`, { signal: AbortSignal.timeout(5000) });
    const body = (await res.json()) as { ok?: boolean; backend?: string; error?: string };
    return { ok: Boolean(res.ok && body.ok), backend: body.backend, error: body.error };
  } catch (err) {
    return { ok: false, error: redactSecrets(err instanceof Error ? err.message : 'health failed') };
  }
}

export async function cfPutFile(absPath: string, contents: string): Promise<{ path: string; bytes: number }> {
  const path = toWorkspacePath(absPath);
  if (!path || path === '/workspace') throw new Error('path_not_allowlisted');
  const rest = path.replace(/^\//, '');
  const res = await cfFetch(`/c/owner/file/${rest}`, {
    method: 'PUT',
    headers: { 'content-type': 'text/plain; charset=utf-8' },
    body: contents,
  });
  if (!res.ok) {
    throw new Error(await readError(res, 'put failed'));
  }
  return { path, bytes: Buffer.byteLength(contents) };
}

export async function cfGetFile(absPath: string): Promise<string> {
  const path = toWorkspacePath(absPath);
  if (!path) throw new Error('path_not_allowlisted');
  const rest = path.replace(/^\//, '');
  const res = await cfFetch(`/c/owner/file/${rest}`);
  if (res.status === 404) throw new Error('missing');
  if (!res.ok) throw new Error(await readError(res, 'get failed'));
  return clip(await res.text(), 64 * 1024);
}

export async function cfExec(
  command: string,
  cwd = '/workspace',
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const res = await cfFetch('/c/owner/exec', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ command, cwd, encoding: 'utf8' }),
  });
  const body = (await res.json()) as {
    exitCode?: number;
    stdout?: string;
    stderr?: string;
    error?: string;
  };
  if (!res.ok) throw new Error(redactSecrets(body.error || `exec ${res.status}`));
  return {
    exitCode: Number(body.exitCode ?? 1),
    stdout: redactSecrets(clip(String(body.stdout ?? ''), 2000)),
    stderr: redactSecrets(clip(String(body.stderr ?? ''), 2000)),
  };
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return redactSecrets(body.error || `${fallback} ${res.status}`);
  } catch {
    return `${fallback} ${res.status}`;
  }
}
