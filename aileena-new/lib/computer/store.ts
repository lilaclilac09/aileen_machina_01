import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ComputerTask } from './types';
import { COMPUTER_LIMITS } from './allowlist';
import { OWNER_COMPUTER_ID } from './workspaceName';
import { cfGetFile, cfPutFile, isCloudflareComputerReady } from './cfClient';

type Memory = {
  tasks: Record<string, ComputerTask>;
};

const g = globalThis as typeof globalThis & { __aileenaComputerTasks?: Memory };

/** Durable Object path. Must stay under the worker write allowlist. */
export const TASKS_STORE_PATH = '/workspace/reports/_store/tasks.json';
const MAX_PERSISTED_TASKS = 5;
const MAX_STORE_BYTES = 60 * 1024;

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

function persistDisk(): void {
  try {
    mkdirSync(dataDir(), { recursive: true });
    writeFileSync(storePath(), JSON.stringify(memory().tasks, null, 2));
  } catch {
    /* local prototype; memory still works */
  }
}

function hydrateDisk(): void {
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
  return task.actorId && task.actorId.length > 0 ? task.actorId : OWNER_COMPUTER_ID;
}

export function isOwnerComputerTask(task: ComputerTask): boolean {
  return taskActorId(task) === OWNER_COMPUTER_ID;
}

function allTasks(): ComputerTask[] {
  return Object.values(memory().tasks);
}

function compactTask(task: ComputerTask, keepPreview: boolean): ComputerTask {
  return {
    ...task,
    logsRedacted: task.logsRedacted.slice(-12),
    artifacts: task.artifacts.slice(0, 4).map((a) => ({
      ...a,
      preview: (a.preview || '').slice(0, keepPreview ? 2000 : 400),
    })),
  };
}

function persistableMap(actorId: string): Record<string, ComputerTask> {
  const list = allTasks()
    .filter((t) => taskActorId(t) === actorId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, MAX_PERSISTED_TASKS)
    .map((t, i) => compactTask(t, i === 0));
  let map = Object.fromEntries(list.map((t) => [t.id, t]));
  let body = JSON.stringify(map);
  if (Buffer.byteLength(body) <= MAX_STORE_BYTES) return map;
  map = Object.fromEntries(
    list.map((t) => [
      t.id,
      {
        ...t,
        artifacts: t.artifacts.map((a) => ({ ...a, preview: (a.preview || '').slice(0, 200) })),
        logsRedacted: t.logsRedacted.slice(-6),
      },
    ]),
  );
  body = JSON.stringify(map);
  if (Buffer.byteLength(body) <= MAX_STORE_BYTES) return map;
  const smaller = list.slice(0, 2).map((t) => ({
    ...t,
    artifacts: t.artifacts.map((a) => ({ ...a, preview: '' })),
    logsRedacted: t.logsRedacted.slice(-4),
  }));
  return Object.fromEntries(smaller.map((t) => [t.id, t]));
}

function replaceActorTasks(actorId: string, incoming: Record<string, ComputerTask>): void {
  for (const id of Object.keys(memory().tasks)) {
    if (taskActorId(memory().tasks[id]) === actorId) delete memory().tasks[id];
  }
  for (const task of Object.values(incoming)) {
    if (task && typeof task === 'object' && typeof task.id === 'string') {
      memory().tasks[task.id] = task;
    }
  }
}

/** Load this actor's tasks from the Durable Object (production) or local disk. */
export async function hydrateComputerStore(actorId: string): Promise<void> {
  if (isCloudflareComputerReady()) {
    try {
      const raw = await cfGetFile(TASKS_STORE_PATH, actorId);
      const parsed = JSON.parse(raw) as Record<string, ComputerTask>;
      if (parsed && typeof parsed === 'object') replaceActorTasks(actorId, parsed);
    } catch {
      /* missing or corrupt — keep in-isolate memory */
    }
    return;
  }
  hydrateDisk();
}

async function persistActor(actorId: string): Promise<void> {
  if (isCloudflareComputerReady()) {
    const map = persistableMap(actorId);
    await cfPutFile(TASKS_STORE_PATH, JSON.stringify(map), actorId);
    return;
  }
  persistDisk();
}

export function listComputerTasks(actorId: string): ComputerTask[] {
  return allTasks()
    .filter((t) => taskActorId(t) === actorId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getComputerTask(id: string): ComputerTask | null {
  return memory().tasks[id] ?? null;
}

export async function upsertComputerTask(task: ComputerTask): Promise<ComputerTask> {
  memory().tasks[task.id] = task;
  await persistActor(taskActorId(task));
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
export async function canEnqueueTask(actorId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await hydrateComputerStore(actorId);
  const all = allTasks();
  if (all.filter(isOpen).length >= COMPUTER_LIMITS.maxOpenTasks) {
    return { ok: false, error: 'Too many open computer tasks. Cancel one first.' };
  }
  if (all.filter((t) => taskActorId(t) === actorId && isOpen(t)).length >= COMPUTER_LIMITS.maxConcurrentRunning) {
    return { ok: false, error: 'A computer task is already running. Wait or cancel it.' };
  }
  return { ok: true };
}
