/**
 * Owner shelf reading state: favorites, currently reading, per-book CFI progress.
 * Redis when UPSTASH_* is set; in-memory fallback for local QA (same pattern as dailyBoardStore).
 */

import { getVisitorRedis } from './visitorMemory';
import { isShelfBookSlug } from './shelfEpub';

const KEY = 'owner:shelf:reading';

export type ShelfProgress = {
  cfi: string;
  percent: number;
  page: number | null;
  updatedAt: number;
};

export type ShelfReadingState = {
  favorites: string[];
  currentlyReading: string | null;
  progress: Record<string, ShelfProgress>;
};

const EMPTY: ShelfReadingState = {
  favorites: [],
  currentlyReading: null,
  progress: {},
};

type Memory = { state: ShelfReadingState };
const g = globalThis as typeof globalThis & { __aileenaShelfReading?: Memory };

function memory(): Memory {
  if (!g.__aileenaShelfReading) g.__aileenaShelfReading = { state: structuredClone(EMPTY) };
  return g.__aileenaShelfReading;
}

export function shelfReadingPersistence(): 'redis' | 'memory' {
  return getVisitorRedis() ? 'redis' : 'memory';
}

function parseJson<T>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  if (typeof raw === 'object') return raw as T;
  return null;
}

function sanitizeProgress(raw: unknown): ShelfProgress | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Partial<ShelfProgress>;
  if (typeof row.cfi !== 'string' || row.cfi.length > 2000) return null;
  const percent = typeof row.percent === 'number' && Number.isFinite(row.percent) ? row.percent : 0;
  const page =
    typeof row.page === 'number' && Number.isFinite(row.page) && row.page >= 0
      ? Math.floor(row.page)
      : null;
  const updatedAt =
    typeof row.updatedAt === 'number' && Number.isFinite(row.updatedAt) ? row.updatedAt : Date.now();
  return {
    cfi: row.cfi,
    percent: Math.min(1, Math.max(0, percent)),
    page,
    updatedAt,
  };
}

export function sanitizeShelfReadingState(raw: unknown): ShelfReadingState {
  if (!raw || typeof raw !== 'object') return structuredClone(EMPTY);
  const row = raw as Partial<ShelfReadingState>;
  const favorites = Array.isArray(row.favorites)
    ? [...new Set(row.favorites.filter((id): id is string => typeof id === 'string' && isShelfBookSlug(id)))]
    : [];
  const currentlyReading =
    typeof row.currentlyReading === 'string' && isShelfBookSlug(row.currentlyReading)
      ? row.currentlyReading
      : null;
  const progress: Record<string, ShelfProgress> = {};
  if (row.progress && typeof row.progress === 'object') {
    for (const [slug, value] of Object.entries(row.progress)) {
      if (!isShelfBookSlug(slug)) continue;
      const next = sanitizeProgress(value);
      if (next) progress[slug] = next;
    }
  }
  return { favorites, currentlyReading, progress };
}

export async function readShelfReadingState(): Promise<ShelfReadingState> {
  const redis = getVisitorRedis();
  if (!redis) return sanitizeShelfReadingState(memory().state);
  const raw = await redis.get(KEY);
  return sanitizeShelfReadingState(parseJson(raw) ?? memory().state);
}

export async function writeShelfReadingState(next: ShelfReadingState): Promise<ShelfReadingState> {
  const cleaned = sanitizeShelfReadingState(next);
  const redis = getVisitorRedis();
  if (!redis) {
    memory().state = cleaned;
    return cleaned;
  }
  await redis.set(KEY, cleaned);
  memory().state = cleaned;
  return cleaned;
}

export type ShelfReadingPatch = {
  favorites?: string[];
  currentlyReading?: string | null;
  progress?: Record<string, Partial<ShelfProgress> & { cfi: string }>;
};

export async function patchShelfReadingState(patch: ShelfReadingPatch): Promise<ShelfReadingState> {
  const current = await readShelfReadingState();
  const next: ShelfReadingState = {
    favorites: patch.favorites !== undefined ? patch.favorites : current.favorites,
    currentlyReading:
      patch.currentlyReading !== undefined ? patch.currentlyReading : current.currentlyReading,
    progress: { ...current.progress },
  };
  if (patch.progress) {
    for (const [slug, value] of Object.entries(patch.progress)) {
      if (!isShelfBookSlug(slug)) continue;
      const merged = sanitizeProgress({
        ...current.progress[slug],
        ...value,
        updatedAt: Date.now(),
      });
      if (merged) next.progress[slug] = merged;
    }
  }
  return writeShelfReadingState(next);
}
