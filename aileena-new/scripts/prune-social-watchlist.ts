#!/usr/bin/env tsx
/**
 * Drop off-watchlist tweets (and orphan numbers / non-teacher profiles) from social DB.
 * Use after RT leakage filled tweets.jsonl with Elon/SpaceX/meme authors.
 *
 *   pnpm prune:social-watchlist
 *   pnpm prune:social-watchlist -- --dry-run
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { isWatchlistScreen, loadWatchlistScreenNames, normalizeScreen } from '../lib/data/socialWatchlist';

const ROOT = process.cwd();
const TWEETS = join(ROOT, 'data', 'tweets.jsonl');
const PROFILES = join(ROOT, 'data', 'profiles.jsonl');
const NUMBERS = join(ROOT, 'data', 'social', 'numbers.jsonl');

function loadJsonl(path: string): { line: string; row: Record<string, unknown> }[] {
  if (!existsSync(path)) return [];
  const out: { line: string; row: Record<string, unknown> }[] = [];
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      out.push({ line, row: JSON.parse(line) as Record<string, unknown> });
    } catch {
      /* skip bad line */
    }
  }
  return out;
}

function main() {
  const dry = process.argv.includes('--dry-run');
  const allowed = loadWatchlistScreenNames(ROOT);
  if (!allowed.size) throw new Error('empty watchlist');

  const tweets = loadJsonl(TWEETS);
  const keepTweets = tweets.filter((t) =>
    isWatchlistScreen(String(t.row.screenName ?? ''), allowed),
  );
  const dropTweets = tweets.length - keepTweets.length;
  const keepIds = new Set(keepTweets.map((t) => String(t.row.id ?? '')).filter(Boolean));

  const numbers = loadJsonl(NUMBERS);
  const keepNumbers = numbers.filter((n) => {
    const tid = String(n.row.tweetId ?? '');
    return !tid || keepIds.has(tid);
  });
  const dropNumbers = numbers.length - keepNumbers.length;

  const profiles = loadJsonl(PROFILES);
  const keepProfiles = profiles.filter((p) =>
    isWatchlistScreen(String(p.row.screenName ?? ''), allowed),
  );
  const dropProfiles = profiles.length - keepProfiles.length;

  const droppedAuthors = [
    ...new Set(
      tweets
        .filter((t) => !isWatchlistScreen(String(t.row.screenName ?? ''), allowed))
        .map((t) => normalizeScreen(String(t.row.screenName ?? ''))),
    ),
  ].sort();

  console.log(
    `[prune-social] tweets ${tweets.length}→${keepTweets.length} (−${dropTweets}) · numbers ${numbers.length}→${keepNumbers.length} (−${dropNumbers}) · profiles ${profiles.length}→${keepProfiles.length} (−${dropProfiles})`,
  );
  if (droppedAuthors.length) console.log(`[prune-social] dropped authors: ${droppedAuthors.join(', ')}`);

  if (dry) {
    console.log('[prune-social] dry-run — no write');
    return;
  }

  writeFileSync(TWEETS, keepTweets.map((t) => t.line).join('\n') + (keepTweets.length ? '\n' : ''));
  writeFileSync(NUMBERS, keepNumbers.map((n) => n.line).join('\n') + (keepNumbers.length ? '\n' : ''));
  writeFileSync(
    PROFILES,
    keepProfiles.map((p) => p.line).join('\n') + (keepProfiles.length ? '\n' : ''),
  );

  const b = spawnSync('pnpm', ['build:data-index'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (b.status !== 0) process.exit(b.status ?? 1);
  console.log('[prune-social] wrote jsonl + rebuilt data index');
}

main();
