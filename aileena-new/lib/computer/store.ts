import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ComputerTask } from './types';
import { COMPUTER_LIMITS } from './allowlist';

type Memory = {
  tasks: Record<string, ComputerTask>;
};

const g = globalThis as typeof globalThis & { __aileenaComputerTasks?: Memory };

function memory(): Memory {
  if (!g.__aileenaComputerTasks) g.__aileenaComputerTasks = { tasks: {} };
  return g.__aileenaComputerTasks;
}

function dataDir(): string {
  return join(process.cwd(), '.data', 'computer-prototype');
}

function storePath(): string {
  return join(dataDir(), 'tasks.json');
}

function persist(): void {
  try {
    mkdirSync(dataDir(), { recursive: true });
    writeFileSync(storePath(), JSON.stringify(memory().tasks, null, 2));
  } catch {
    /* local prototype; memory still works */
  }
}

function hydrate(): void {
  if (Object.keys(memory().tasks).length > 0) return;
  try {
    if (!existsSync(storePath())) return;
    const parsed = JSON.parse(readFileSync(storePath(), 'utf8')) as Record<string, ComputerTask>;
    if (parsed && typeof parsed === 'object') memory().tasks = parsed;
  } catch {
    /* ignore corrupt local file */
  }
}

export function newId(prefix: string): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return `${prefix}-${c.randomUUID().slice(0, 8)}`;
  return `${prefix}-${Date.now().toString(36)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function listComputerTasks(): ComputerTask[] {
  hydrate();
  return Object.values(memory().tasks).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getComputerTask(id: string): ComputerTask | null {
  hydrate();
  return memory().tasks[id] ?? null;
}

export function upsertComputerTask(task: ComputerTask): ComputerTask {
  hydrate();
  memory().tasks[task.id] = task;
  persist();
  return task;
}

export function countOpenTasks(): { running: number; open: number } {
  const tasks = listComputerTasks();
  const running = tasks.filter((t) => t.status === 'running').length;
  const open = tasks.filter((t) => t.status === 'queued' || t.status === 'running').length;
  return { running, open };
}

export function canEnqueueTask(): { ok: true } | { ok: false; error: string } {
  const { running, open } = countOpenTasks();
  if (running >= COMPUTER_LIMITS.maxConcurrentRunning) {
    return { ok: false, error: 'A computer task is already running. Wait or cancel it.' };
  }
  if (open >= COMPUTER_LIMITS.maxOpenTasks) {
    return { ok: false, error: 'Too many open computer tasks. Cancel one first.' };
  }
  return { ok: true };
}
