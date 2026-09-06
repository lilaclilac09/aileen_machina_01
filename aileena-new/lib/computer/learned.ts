import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type LearnedCommand = {
  alias: string;
  expands: string;
  taskType: string;
  instructions: string;
  route: string;
  at: string;
};

const MAX = 12;
const g = globalThis as typeof globalThis & { __aileenaComputerLearned?: LearnedCommand[] };

function dataDir(): string {
  return join(process.cwd(), '.data', 'computer-prototype');
}

function storePath(): string {
  return join(dataDir(), 'learned.json');
}

function memory(): LearnedCommand[] {
  if (!g.__aileenaComputerLearned) g.__aileenaComputerLearned = hydrate();
  return g.__aileenaComputerLearned;
}

function hydrate(): LearnedCommand[] {
  try {
    if (!existsSync(storePath())) return [];
    const parsed = JSON.parse(readFileSync(storePath(), 'utf8')) as LearnedCommand[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function persist(rows: LearnedCommand[]): void {
  try {
    mkdirSync(dataDir(), { recursive: true });
    writeFileSync(storePath(), JSON.stringify(rows, null, 2));
  } catch {
    /* local prototype */
  }
}

export function listLearned(): LearnedCommand[] {
  return memory().slice();
}

export function rememberCommand(row: Omit<LearnedCommand, 'at'>): LearnedCommand {
  const alias = row.alias.trim().slice(0, 40);
  const next: LearnedCommand = {
    alias,
    expands: row.expands.trim().slice(0, 200),
    taskType: row.taskType,
    instructions: row.instructions.slice(0, 4000),
    route: row.route || '/proof',
    at: new Date().toISOString(),
  };
  if (!alias) return next;
  const cur = memory().filter((r) => r.alias.toLowerCase() !== alias.toLowerCase());
  cur.unshift(next);
  g.__aileenaComputerLearned = cur.slice(0, MAX);
  persist(g.__aileenaComputerLearned);
  return next;
}

export function matchLearned(phrase: string): LearnedCommand | null {
  const t = phrase.trim().toLowerCase();
  if (!t) return null;
  return memory().find((r) => r.alias.toLowerCase() === t) ?? null;
}

export function labelForTask(taskType: string, instructions: string): string {
  if (taskType === 'write_scratch_file') {
    const n = instructions.replace(/^write \/scratch.*/i, '').trim();
    return n ? `note: ${n.slice(0, 24)}` : 'note';
  }
  if (taskType === 'files_search') {
    const q = instructions.replace(/^\/workspace\s+/, '').trim();
    return q ? `find ${q.slice(0, 24)}` : 'find';
  }
  if (taskType === 'files_tree') return 'list';
  if (taskType === 'git_status') return 'git status';
  if (taskType === 'git_log') return 'git recent';
  return taskType.slice(0, 24);
}
