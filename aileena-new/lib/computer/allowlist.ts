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
  maxArtifactPreviewChars: 1200,
  maxConcurrentRunning: 1,
  maxOpenTasks: 8,
  workspaceFileBytes: 64 * 1024,
};
