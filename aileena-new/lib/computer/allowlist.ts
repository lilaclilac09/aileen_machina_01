import type { ComputerTaskType } from './types';
import { COMPUTER_TASK_TYPES } from './types';

/** Inspect targets for /daily — repo-relative from the git root. */
export const DAILY_INSPECT_FILES = [
  'aileena-new/app/daily/page.tsx',
  'aileena-new/app/api/daily/route.ts',
  'aileena-new/app/api/daily/notes/route.ts',
  'aileena-new/app/api/daily/comments/route.ts',
  'aileena-new/app/api/daily/theme/route.ts',
  'aileena-new/components/DailyBoard.tsx',
  'aileena-new/components/OwnerUnlockForm.tsx',
  'aileena-new/lib/dailyBoard.ts',
  'aileena-new/lib/dailyBoardStore.ts',
  'aileena-new/lib/owner-gate.ts',
  'aileena-new/app/api/auth/owner/route.ts',
] as const;

export const ROUTE_INSPECT_FILES: Record<string, readonly string[]> = {
  '/daily': DAILY_INSPECT_FILES,
};

export const ALLOWED_CHECK_COMMANDS = {
  'echo-ok': { label: 'echo ok (workspace runtime probe)', argv: ['node', '-e', "process.stdout.write('ok')"] },
  'verify-daily-static': {
    label: 'pnpm verify:daily-board (static; no live HTTP)',
    argv: ['pnpm', 'verify:daily-board'],
  },
} as const;

export type AllowedCheckId = keyof typeof ALLOWED_CHECK_COMMANDS;

export function isComputerTaskType(value: unknown): value is ComputerTaskType {
  return typeof value === 'string' && (COMPUTER_TASK_TYPES as readonly string[]).includes(value);
}

export const OWNER_SHELL_BINS = [
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
  'curl',
  'jq',
  'html-to-markdown',
  'file',
  'xan',
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
  'cp',
  'mv',
  'rm',
] as const;

export function isOwnerShellCommand(raw: string): boolean {
  const bin = raw.trim().split(/\s+/)[0] || '';
  return (OWNER_SHELL_BINS as readonly string[]).includes(bin);
}

/** Public https only. No localhost / RFC1918 / link-local. */
export function safeHttpsUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t || t.length > 200) return null;
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:') return null;
  const host = u.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host === '0.0.0.0') return null;
  if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.)/.test(host)) return null;
  if (host === '::1' || host.startsWith('[')) return null;
  return u.toString();
}

export function curlHeadCommand(url: string): string {
  return `curl -sI --max-time 8 ${url}`;
}

/** GET body. Saved under scratch/fetch by the runner. */
export function curlFetchCommand(url: string): string {
  return `curl -sL --max-time 8 ${url}`;
}

/** Pull a public https URL out of a paste or a curl line. */
export function curlHttpsTarget(raw: string): { url: string; head: boolean } | null {
  const t = raw.trim();
  const pasted = safeHttpsUrl(t);
  if (pasted) return { url: pasted, head: false };
  if (!/^curl\b/.test(t)) return null;
  const tokens = t.split(/\s+/);
  const head = tokens.some((tok) => tok === '--head' || /^-[A-Za-z]*I[A-Za-z]*$/.test(tok));
  const token = t
    .split(/\s+/)
    .map((s) => s.replace(/^['"]|['"]$/g, ''))
    .find((s) => s.startsWith('https://'));
  const url = token ? safeHttpsUrl(token) : null;
  if (!url) return null;
  return { url, head };
}

export function fetchScratchName(url: string): string {
  let host = 'fetch';
  try {
    host = new URL(url).hostname.toLowerCase().replace(/[^a-z0-9.-]/g, '').slice(0, 40) || 'fetch';
  } catch {
    /* keep fetch */
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${host}-${stamp}.txt`;
}

/** Visitors may only touch their own scratch workspace. Never git, email, repo files, shell, or proof. */
export const VISITOR_COMPUTER_TASK_TYPES = [
  'write_scratch_file',
  'files_tree',
  'files_search',
  'scratch_peek',
  'scratch_clock',
] as const;

export type VisitorComputerTaskType = (typeof VISITOR_COMPUTER_TASK_TYPES)[number];

export function isVisitorComputerTaskType(value: unknown): value is VisitorComputerTaskType {
  return typeof value === 'string' && (VISITOR_COMPUTER_TASK_TYPES as readonly string[]).includes(value);
}

export function inspectFilesForRoute(route: string): readonly string[] {
  const key = route.trim() || '/';
  return ROUTE_INSPECT_FILES[key] ?? ROUTE_INSPECT_FILES['/daily'];
}

const FORBIDDEN_BODY_KEYS = ['command', 'shell', 'exec', 'cwd', 'env', 'argv', 'script'];

export function forbiddenShellFields(body: Record<string, unknown>): string[] {
  return FORBIDDEN_BODY_KEYS.filter((k) => k in body && body[k] != null);
}

export const COMPUTER_LIMITS = {
  instructionChars: 4000,
  scopeChars: 500,
  maxArtifacts: 8,
  maxArtifactPreviewChars: 2000,
  maxConcurrentRunning: 1,
  maxOpenTasks: 8,
  workspaceFileBytes: 64 * 1024,
};
