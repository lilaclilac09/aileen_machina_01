/**
 * Owner-only read-only file inspection. No .env, keys, or node_modules.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { findRepoRoot } from './inspect';
import { clip, redactSecrets } from './redact';
import { COMPUTER_LIMITS } from './allowlist';

const BLOCKED_NAME = /(^\.env|\.pem$|credentials|secrets?|id_rsa|id_ed25519|OWNER_KEY|OWNER_RIDDLE|\.p12$|\.key$)/i;
const BLOCKED_DIR = new Set(['node_modules', '.git', '.data', '.next', 'coverage']);

export type FileInspectResult = {
  action: string;
  ok: boolean;
  summary: string;
  lines: string[];
};

function root(): string {
  return resolve(findRepoRoot());
}

function blockedRel(rel: string): boolean {
  const parts = rel.split(/[/\\]/);
  if (parts.some((p) => BLOCKED_DIR.has(p) || BLOCKED_NAME.test(p))) return true;
  return BLOCKED_NAME.test(rel);
}

function safeRel(input: string): string | null {
  const raw = input.trim().replaceAll('\\', '/').replace(/^\.\//, '');
  if (!raw || raw.startsWith('-') || raw.includes('\0')) return null;
  if (raw.includes('..')) return null;
  const abs = resolve(join(root(), raw));
  const rel = relative(root(), abs);
  if (rel.startsWith('..') || rel === '') return rel === '' ? '.' : null;
  if (blockedRel(rel)) return null;
  return rel;
}

export function filesTree(relPath = 'aileena-new', depth = 2): FileInspectResult {
  const rel = safeRel(relPath) ?? 'aileena-new';
  if (blockedRel(rel) && rel !== '.') {
    return { action: 'tree', ok: false, summary: 'path blocked', lines: [] };
  }
  const abs = join(root(), rel === '.' ? '' : rel);
  if (!existsSync(abs) || !statSync(abs).isDirectory()) {
    return { action: 'tree', ok: false, summary: 'not a directory', lines: [] };
  }
  const lines: string[] = [];
  walk(abs, rel, 0, depth, lines);
  return {
    action: 'tree',
    ok: true,
    summary: `${lines.length} entries under ${rel}`,
    lines: lines.slice(0, 80),
  };
}

function walk(abs: string, rel: string, depth: number, max: number, out: string[]): void {
  if (out.length >= 80 || depth > max) return;
  let entries: string[] = [];
  try {
    entries = readdirSync(abs);
  } catch {
    return;
  }
  for (const name of entries.sort()) {
    if (BLOCKED_DIR.has(name) || BLOCKED_NAME.test(name)) continue;
    const childRel = rel === '.' ? name : `${rel}/${name}`;
    if (blockedRel(childRel)) continue;
    const childAbs = join(abs, name);
    let dir = false;
    try {
      dir = statSync(childAbs).isDirectory();
    } catch {
      continue;
    }
    out.push(dir ? `${childRel}/` : childRel);
    if (dir && depth < max) walk(childAbs, childRel, depth + 1, max, out);
    if (out.length >= 80) return;
  }
}

export function filesOpen(relPath: string): FileInspectResult {
  const rel = safeRel(relPath);
  if (!rel || rel === '.') return { action: 'open', ok: false, summary: 'path blocked', lines: [] };
  const abs = join(root(), rel);
  if (!existsSync(abs) || !statSync(abs).isFile()) {
    return { action: 'open', ok: false, summary: 'missing file', lines: [] };
  }
  const st = statSync(abs);
  if (st.size > COMPUTER_LIMITS.workspaceFileBytes) {
    return { action: 'open', ok: false, summary: 'file too large', lines: [`${rel} ${st.size} bytes`] };
  }
  const text = redactSecrets(readFileSync(abs, 'utf8'));
  const lines = text.split('\n').slice(0, 120);
  return {
    action: 'open',
    ok: true,
    summary: `${rel} · ${st.size} bytes · read-only`,
    lines,
  };
}

export async function filesSearch(query: string, glob = 'aileena-new'): Promise<FileInspectResult> {
  const q = query.trim().slice(0, 80);
  if (!q || q.startsWith('-')) {
    return { action: 'search', ok: false, summary: 'bad query', lines: [] };
  }
  const rel = safeRel(glob) ?? 'aileena-new';
  return new Promise((resolve) => {
    const child = spawn(
      'rg',
      [
        '-n',
        '-F',
        '--max-count',
        '20',
        '--max-filesize',
        '64K',
        '-g',
        '!node_modules',
        '-g',
        '!.env*',
        '-g',
        '!.git',
        '-g',
        '!*.pem',
        '--',
        q,
        rel.split(sep).join('/'),
      ],
      {
        cwd: root(),
        env: { PATH: process.env.PATH ?? '/usr/bin:/bin', HOME: process.env.HOME ?? '', NODE_ENV: process.env.NODE_ENV ?? 'development' } as NodeJS.ProcessEnv,
        timeout: 10_000,
      },
    );
    let out = '';
    child.stdout?.on('data', (d) => {
      out += String(d);
      if (out.length > 40_000) out = out.slice(0, 40_000);
    });
    child.on('error', () => {
      resolve({
        action: 'search',
        ok: false,
        summary: `rg unavailable; not scanning ${rel} for ${clip(q, 40)}`,
        lines: [],
      });
    });
    child.on('close', (code) => {
      const lines = redactSecrets(out)
        .split('\n')
        .filter((l) => l.trim() && !BLOCKED_NAME.test(l))
        .slice(0, 30);
      resolve({
        action: 'search',
        ok: code === 0 || code === 1,
        summary: `${lines.length} hits for ${clip(q, 40)}`,
        lines,
      });
    });
  });
}
