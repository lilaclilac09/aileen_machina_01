import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize, relative, resolve } from 'node:path';
import { COMPUTER_LIMITS } from './allowlist';

const ALLOWED_PREFIXES = ['/scratch/', '/reports/', '/artifacts/', '/patches/'];

export function workspaceRoot(workspaceId: string): string {
  const id = workspaceId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'owner';
  return join(process.cwd(), '.data', 'computer-prototype', 'ws', id);
}

function assertWorkspacePath(workspaceId: string, absPath: string): string {
  const root = resolve(workspaceRoot(workspaceId));
  const resolved = resolve(absPath);
  const rel = relative(root, resolved);
  if (rel.startsWith('..') || rel.includes('..')) {
    throw new Error('path_escape');
  }
  return resolved;
}

function virtualToAbs(workspaceId: string, virtualPath: string): string {
  const v = normalize(virtualPath).replaceAll('\\', '/');
  if (!v.startsWith('/') || v.startsWith('//')) throw new Error('bad_path');
  const ok = ALLOWED_PREFIXES.some((p) => v === p.slice(0, -1) || v.startsWith(p));
  if (!ok) throw new Error('path_not_allowlisted');
  return assertWorkspacePath(workspaceId, join(workspaceRoot(workspaceId), v.slice(1)));
}

export async function workspaceWriteFile(
  workspaceId: string,
  virtualPath: string,
  contents: string,
): Promise<{ path: string; bytes: number }> {
  const abs = virtualToAbs(workspaceId, virtualPath);
  const text = contents.length > COMPUTER_LIMITS.workspaceFileBytes
    ? contents.slice(0, COMPUTER_LIMITS.workspaceFileBytes)
    : contents;
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, text, 'utf8');
  return { path: virtualPath, bytes: Buffer.byteLength(text) };
}

export async function workspaceReadFile(
  workspaceId: string,
  virtualPath: string,
): Promise<string> {
  const abs = virtualToAbs(workspaceId, virtualPath);
  if (!existsSync(abs)) throw new Error('missing');
  return readFileSync(abs, 'utf8');
}

/**
 * Allowlisted runtime probe. Never interpolates owner/visitor text into a shell.
 * User instructions are not argv.
 */
export async function workspaceRuntimeProbe(): Promise<{ stdout: string; exitCode: number }> {
  return { stdout: 'ok', exitCode: 0 };
}
