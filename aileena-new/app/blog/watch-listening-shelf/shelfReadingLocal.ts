/**
 * localStorage fallback for owner reading progress when the API is unreachable.
 * Server Redis/memory remains the durable store; this keeps page-turn snappy offline.
 */

import type { ShelfProgress, ShelfReadingState } from '../../../lib/shelfReadingStore';

const KEY = 'aileena.shelf.reading.v1';

function empty(): ShelfReadingState {
  return { favorites: [], currentlyReading: null, progress: {} };
}

export function readLocalShelfReading(): ShelfReadingState {
  if (typeof window === 'undefined') return empty();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as ShelfReadingState;
    return {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites.filter((x) => typeof x === 'string') : [],
      currentlyReading:
        typeof parsed.currentlyReading === 'string' ? parsed.currentlyReading : null,
      progress:
        parsed.progress && typeof parsed.progress === 'object'
          ? (parsed.progress as Record<string, ShelfProgress>)
          : {},
    };
  } catch {
    return empty();
  }
}

export function writeLocalShelfReading(state: ShelfReadingState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

export function mergeReadingStates(
  server: ShelfReadingState,
  local: ShelfReadingState,
): ShelfReadingState {
  const favorites = [...new Set([...server.favorites, ...local.favorites])];
  const currentlyReading = server.currentlyReading ?? local.currentlyReading;
  const progress: Record<string, ShelfProgress> = { ...local.progress };
  for (const [slug, row] of Object.entries(server.progress)) {
    const prior = progress[slug];
    if (!prior || row.updatedAt >= prior.updatedAt) progress[slug] = row;
  }
  return { favorites, currentlyReading, progress };
}
