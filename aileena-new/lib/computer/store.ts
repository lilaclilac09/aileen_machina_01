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

export function taskActorId(task: ComputerTask): string {
  return task.actorId && task.actorId.length > 0 ? task.actorId : 'owner';
}

export function isOwnerComputerTask(task: ComputerTask): boolean {
  return taskActorId(task) === 'owner';
}

function allTasks(): ComputerTask[] {
  hydrate();
  return Object.values(memory().tasks);
}

export function listComputerTasks(actorId: string): ComputerTask[] {
  return allTasks()
    .filter((t) => taskActorId(t) === actorId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
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

function isOpen(task: ComputerTask): boolean {
  return task.status === 'queued' || task.status === 'running';
}

export function countOpenTasks(actorId?: string): { running: number; open: number } {
  const tasks = actorId ? listComputerTasks(actorId) : allTasks();
  const running = tasks.filter((t) => t.status === 'running').length;
  const open = tasks.filter(isOpen).length;
  return { running, open };
}

/** One open task per actor. Global cap so visitors cannot fill the store. */
export function canEnqueueTask(actorId: string): { ok: true } | { ok: false; error: string } {
  const all = allTasks();
  if (all.filter(isOpen).length >= COMPUTER_LIMITS.maxOpenTasks) {
    return { ok: false, error: 'Too many open computer tasks. Cancel one first.' };
  }
  if (all.filter((t) => taskActorId(t) === actorId && isOpen(t)).length >= COMPUTER_LIMITS.maxConcurrentRunning) {
    return { ok: false, error: 'A computer task is already running. Wait or cancel it.' };
  }
  return { ok: true };
}
