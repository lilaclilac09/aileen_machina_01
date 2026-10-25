/**
 * Owner-only EPUB files for the watch/listening shelf.
 *
 * Lookup order:
 * 1. Local disk: SHELF_EPUB_DIR (if set), then .data/shelf-epubs/{slug}.epub (gitignored)
 * 2. Private GitHub repo (durable for Vercel): SHELF_EPUB_GITHUB_REPO contents via
 *    Contents API with Accept: application/vnd.github.raw
 *
 * Never under public/. Catalog + stream APIs 403 non-owners.
 * Copyrighted bytes must never be committed to the public site repo.
 */

import { access, readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { SHELF_ITEMS } from './watchListeningShelf';

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;

const DEFAULT_GITHUB_REPO = 'lilaclilac09/aileena-owner-epubs';
const DEFAULT_GITHUB_REF = 'main';
const CACHE_TTL_MS = 15 * 60 * 1000;

type CacheEntry = { bytes: Uint8Array; expiresAt: number };
const bytesCache = new Map<string, CacheEntry>();
let remoteSlugCache: { slugs: string[]; expiresAt: number } | null = null;

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

function githubRepo(): string {
  const raw = (process.env.SHELF_EPUB_GITHUB_REPO || '').trim() || DEFAULT_GITHUB_REPO;
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(raw)) return DEFAULT_GITHUB_REPO;
  return raw;
}

function githubRef(): string {
  const raw = (process.env.SHELF_EPUB_GITHUB_REF || '').trim() || DEFAULT_GITHUB_REF;
  return raw.slice(0, 128) || DEFAULT_GITHUB_REF;
}

/** Token with Contents:Read on the private epub repo (first match wins). */
export function shelfEpubGithubToken(): string {
  return (
    (process.env.SHELF_EPUB_GITHUB_TOKEN || '').trim() ||
    (process.env.AGENT_CODE_GITHUB_TOKEN || '').trim() ||
    (process.env.GITHUB_TOKEN || '').trim() ||
    (process.env.GH_TOKEN || '').trim() ||
    (process.env.GITHUB_MCP_TOKEN || '').trim()
  );
}

function githubHeaders(token: string, accept: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: accept,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'aileena-shelf-epub',
  };
}

async function listRemoteEpubSlugs(): Promise<string[]> {
  const now = Date.now();
  if (remoteSlugCache && remoteSlugCache.expiresAt > now) {
    return remoteSlugCache.slugs;
  }

  const token = shelfEpubGithubToken();
  if (!token) return [];

  const [owner, repo] = githubRepo().split('/');
  const ref = encodeURIComponent(githubRef());
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/?ref=${ref}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: githubHeaders(token, 'application/vnd.github+json'),
      cache: 'no-store',
    });
  } catch {
    return [];
  }

  if (!res.ok) {
    // 404 = repo missing or token lacks Contents:Read on that private repo
    return [];
  }

  let entries: unknown;
  try {
    entries = await res.json();
  } catch {
    return [];
  }
  if (!Array.isArray(entries)) return [];

  const found: string[] = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const rec = entry as { name?: unknown; type?: unknown; size?: unknown };
    if (rec.type !== 'file' || typeof rec.name !== 'string') continue;
    if (!rec.name.endsWith('.epub')) continue;
    const size = typeof rec.size === 'number' ? rec.size : 0;
    if (size <= 0) continue;
    const slug = rec.name.slice(0, -5);
    if (isShelfBookSlug(slug)) found.push(slug);
  }

  const slugs = [...new Set(found)].sort();
  remoteSlugCache = { slugs, expiresAt: now + CACHE_TTL_MS };
  return slugs;
}

async function readRemoteEpubBytes(slug: string): Promise<Uint8Array | null> {
  if (!isShelfBookSlug(slug)) return null;

  const now = Date.now();
  const cached = bytesCache.get(slug);
  if (cached && cached.expiresAt > now) return cached.bytes;

  const token = shelfEpubGithubToken();
  if (!token) return null;

  const [owner, repo] = githubRepo().split('/');
  const ref = encodeURIComponent(githubRef());
  const path = encodeURIComponent(`${slug}.epub`);
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: githubHeaders(token, 'application/vnd.github.raw'),
      cache: 'no-store',
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength === 0) return null;
  // EPUB is a zip — require PK magic so we never serve an HTML error body as a book
  if (buf[0] !== 0x50 || buf[1] !== 0x4b) return null;

  bytesCache.set(slug, { bytes: buf, expiresAt: now + CACHE_TTL_MS });
  return buf;
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

  for (const slug of await listRemoteEpubSlugs()) {
    found.add(slug);
  }

  return [...found].sort();
}

export async function readEpubBytes(slug: string): Promise<Uint8Array | null> {
  const path = await firstExistingPath(slug);
  if (path) {
    const buf = await readFile(path);
    if (buf.byteLength > 0) return new Uint8Array(buf);
  }
  return readRemoteEpubBytes(slug);
}
