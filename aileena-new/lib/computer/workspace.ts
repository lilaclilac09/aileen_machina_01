import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
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

function walkWorkspace(dir: string, root: string, out: string[], depth: number): void {
  if (depth > 6 || !existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    const rel = relative(root, abs).replaceAll('\\', '/');
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      out.push(`${rel}/`);
      walkWorkspace(abs, root, out, depth + 1);
    } else {
      out.push(`${rel} ${st.size}`);
    }
  }
}

/** List a shim workspace. Never walks the site git tree. */
export function workspaceList(workspaceId: string): { lines: string[]; summary: string } {
  const root = workspaceRoot(workspaceId);
  mkdirSync(join(root, 'scratch'), { recursive: true });
  const lines: string[] = [];
  walkWorkspace(root, root, lines, 0);
  return {
    lines: lines.slice(0, 200),
    summary: lines.length ? `listed ${lines.length} paths in scratch pad` : 'empty scratch pad',
  };
}

/** Literal search inside a shim workspace. Never greps the site git tree. */
export function workspaceGrep(workspaceId: string, rawQuery: string): { lines: string[]; summary: string } {
  const query = rawQuery.replace(/^\/workspace\s+/i, '').trim().slice(0, 80);
  if (!query) return { lines: [], summary: 'empty query' };
  const root = workspaceRoot(workspaceId);
  if (!existsSync(root)) return { lines: [], summary: `no matches for ${query}` };
  const hits: string[] = [];
  const scan = (dir: string) => {
    if (!existsSync(dir) || hits.length >= 50) return;
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name);
      let st;
      try {
        st = statSync(abs);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        scan(abs);
        continue;
      }
      if (st.size > COMPUTER_LIMITS.workspaceFileBytes) continue;
      let text = '';
      try {
        text = readFileSync(abs, 'utf8');
      } catch {
        continue;
      }
      if (text.includes(query)) {
        hits.push(`${relative(root, abs).replaceAll('\\', '/')}: match`);
      }
    }
  };
  scan(root);
  return {
    lines: hits,
    summary: hits.length ? `${hits.length} matches for ${query}` : `no matches for ${query}`,
  };
}

/** Newest scratch note in a shim workspace. Skips .born. */
export async function workspaceLatestNote(
  workspaceId: string,
): Promise<{ path: string; body: string; bytes: number } | null> {
  const { lines } = workspaceList(workspaceId);
  const files: string[] = [];
  for (const line of lines) {
    const m = /^(scratch\/\S+)\s+\d+$/.exec(line.trim());
    if (!m) continue;
    if (m[1].includes('.born')) continue;
    files.push(`/${m[1]}`);
  }
  const notes = files.filter((p) => p.startsWith('/scratch/notes/')).sort();
  const pick = notes.at(-1) ?? files.filter((p) => p.startsWith('/scratch/')).sort().at(-1);
  if (!pick) return null;
  const body = await workspaceReadFile(workspaceId, pick);
  return { path: pick, body, bytes: Buffer.byteLength(body) };
}
