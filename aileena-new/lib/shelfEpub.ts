/**
 * Owner-only EPUB files for the watch/listening shelf.
 * Bytes live under .data/shelf-epubs/{shelf-item-id}.epub (gitignored).
 * Never under public/. Catalog + stream APIs 403 non-owners.
 */

import { access, readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { SHELF_ITEMS } from './watchListeningShelf';

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;

export function isShelfBookSlug(slug: string): boolean {
  if (!SLUG_RE.test(slug)) return false;
  const item = SHELF_ITEMS.find((entry) => entry.id === slug);
  return Boolean(item && item.type === 'book');
}

export function shelfBookIds(): string[] {
  return SHELF_ITEMS.filter((item) => item.type === 'book').map((item) => item.id);
}

function epubDirs(): string[] {
  const fromEnv = (process.env.SHELF_EPUB_DIR || '').trim();
  const dirs = [join(process.cwd(), '.data', 'shelf-epubs')];
  if (fromEnv) dirs.unshift(fromEnv);
  return dirs;
}

export function epubPathForSlug(slug: string): string | null {
  if (!isShelfBookSlug(slug)) return null;
  // Prefer first existing file across configured dirs.
  return join(epubDirs()[0], `${slug}.epub`);
}

async function firstExistingPath(slug: string): Promise<string | null> {
  if (!isShelfBookSlug(slug)) return null;
  for (const dir of epubDirs()) {
    const path = join(dir, `${slug}.epub`);
    try {
      await access(path);
      const info = await stat(path);
      if (info.isFile() && info.size > 0) return path;
    } catch {
      /* try next */
    }
  }
  return null;
}

export async function listAvailableEpubSlugs(): Promise<string[]> {
  const found = new Set<string>();
  for (const dir of epubDirs()) {
    let names: string[] = [];
    try {
      names = await readdir(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      if (!name.endsWith('.epub')) continue;
      const slug = name.slice(0, -5);
      if (!isShelfBookSlug(slug)) continue;
      try {
        const info = await stat(join(dir, name));
        if (info.isFile() && info.size > 0) found.add(slug);
      } catch {
        /* skip */
      }
    }
  }
  return [...found].sort();
}

export async function readEpubBytes(slug: string): Promise<Uint8Array | null> {
  const path = await firstExistingPath(slug);
  if (!path) return null;
  const buf = await readFile(path);
  return new Uint8Array(buf);
}
