/**
 * Generic loader for structured data files (JSON arrays + JSONL).
 *
 * Files live under aileena-new/data/. Each file is imported via the
 * standard TS JSON import (build-time bundled) for the JSON case, and
 * for JSONL we ship a tiny build script that pre-bundles the .jsonl
 * lines into a .json companion the runtime can import. Edge-runtime
 * does not have fs.
 *
 * Validation: every loader takes a zod schema. Items that fail are
 * dropped with a warning (not thrown) so a single malformed row in
 * Aileen's tracking sheet doesn't take the agent offline.
 */

import type { z } from 'zod';
import type { LoadedDataset } from './types';

export function loadArray<T>(
  raw: unknown,
  schema: z.ZodType<T>,
  source: string,
): LoadedDataset<T> {
  if (!Array.isArray(raw)) {
    console.error(`[data] ${source}: expected an array, got ${typeof raw}`);
    return { items: [], source, loadedAt: new Date().toISOString(), invalidCount: 0 };
  }
  const items: T[] = [];
  let invalid = 0;
  for (let i = 0; i < raw.length; i++) {
    const parsed = schema.safeParse(raw[i]);
    if (parsed.success) {
      items.push(parsed.data);
    } else {
      invalid++;
      if (invalid <= 3) {
        console.warn(
          `[data] ${source}: invalid entry at index ${i} —`,
          parsed.error.issues.map((iss) => `${iss.path.join('.')}: ${iss.message}`).join('; '),
        );
      }
    }
  }
  if (invalid > 3) {
    console.warn(`[data] ${source}: ${invalid - 3} additional invalid entries suppressed`);
  }
  return { items, source, loadedAt: new Date().toISOString(), invalidCount: invalid };
}
