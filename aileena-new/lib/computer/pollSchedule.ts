/**
 * When the Console dock should poll `/api/agent/computer/tasks` next.
 *
 * Every poll reaches the Cloudflare worker and wakes a Durable Object, so the
 * dock only polls while a task is queued/running (1s, backing off to 10s),
 * pauses while the tab is hidden, and stops when idle. The shared room keeps a
 * slow idle refresh so watchers still see other people's notes.
 */
import type { ComputerTask } from './types';

export const POLL_MIN_MS = 1000;
export const POLL_MAX_MS = 10_000;
export const POLL_BACKOFF = 1.5;
/** Shared room only: idle refresh so the live monitor still moves. */
export const SHARED_IDLE_POLL_MS = 15_000;

export function hasActiveTask(tasks: ComputerTask[]): boolean {
  return tasks.some((t) => t.status === 'queued' || t.status === 'running');
}

/** Changes whenever any task appears, moves status, or logs. */
export function taskSignature(tasks: ComputerTask[]): string {
  return tasks.map((t) => `${t.id}:${t.status}:${t.updatedAt}`).join('|');
}

/** Grow the delay while nothing changes; snap back to 1s on any change. */
export function nextBackoff(prevDelayMs: number, changed: boolean): number {
  if (changed) return POLL_MIN_MS;
  return Math.min(POLL_MAX_MS, Math.round(Math.max(POLL_MIN_MS, prevDelayMs) * POLL_BACKOFF));
}

/** Milliseconds until the next poll, or null to stop until something kicks it. */
export function nextPollDelay(opts: { active: boolean; shared: boolean; hidden: boolean; delayMs: number }): number | null {
  if (opts.hidden) return null;
  if (opts.active) return Math.min(POLL_MAX_MS, Math.max(POLL_MIN_MS, opts.delayMs));
  if (opts.shared) return SHARED_IDLE_POLL_MS;
  return null;
}
