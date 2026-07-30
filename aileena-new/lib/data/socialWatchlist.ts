/**
 * Watchlist helpers for social ingest + Dreaming digest.
 * Teachers only — skip RT/meme authors that leak via timeline RSS.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type WatchAccount = { screenName: string; org?: string; name?: string };

export function loadWatchlistAccounts(root = process.cwd()): WatchAccount[] {
  const path = join(root, 'data', 'social', 'watchlist.json');
  if (!existsSync(path)) return [];
  const raw = JSON.parse(readFileSync(path, 'utf8')) as { accounts?: WatchAccount[] };
  return raw.accounts ?? [];
}

export function loadWatchlistScreenNames(root = process.cwd()): Set<string> {
  return new Set(
    loadWatchlistAccounts(root).map((a) => a.screenName.toLowerCase().replace(/^@/, '')),
  );
}

export function normalizeScreen(screenName: string | undefined | null): string {
  return (screenName ?? '').toLowerCase().replace(/^@/, '');
}

export function isWatchlistScreen(
  screenName: string | undefined | null,
  allowed: Set<string>,
): boolean {
  const sn = normalizeScreen(screenName);
  return Boolean(sn) && allowed.has(sn);
}

/**
 * Soft signal filter: keep analyst substance, drop short banter / emoji memes.
 * - long posts (≥100)
 * - posts with a URL
 * - posts with metric-like numbers ($, %, kW/MW/HBM/nm…) — not “Shrek 2 / 8 hours”
 */
export function isSubstanceTweet(text: string | undefined | null): boolean {
  const t = (text ?? '').replace(/\s+/g, ' ').trim();
  if (t.length < 40) return false;
  if (t.length >= 100) return true;
  if (/https?:\/\//i.test(t)) return true;
  if (/\$[\d,.]+|\d+(\.\d+)?\s*%|\b\d+(\.\d+)?\s*(kW|MW|GW|TB|GB|HBM|nm|Gbps|MW\/MW)\b/i.test(t)) {
    return true;
  }
  return false;
}
