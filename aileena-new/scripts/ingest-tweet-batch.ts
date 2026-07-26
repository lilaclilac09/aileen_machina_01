#!/usr/bin/env tsx
/**
 * Batch-ingest tweet URLs listed in data/social/ingest-queue.txt (one URL per line).
 * Also refreshes watchlist profiles.
 *
 *   pnpm ingest:tweet:batch
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const QUEUE = join(ROOT, 'data', 'social', 'ingest-queue.txt');
const WATCH = join(ROOT, 'data', 'social', 'watchlist.json');

function run(args: string[]) {
  const r = spawnSync('pnpm', ['exec', 'tsx', 'scripts/ingest-tweet.ts', '--', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (r.status !== 0) throw new Error(`ingest failed: ${args.join(' ')}`);
}

function main() {
  if (existsSync(WATCH)) {
    const w = JSON.parse(readFileSync(WATCH, 'utf8')) as {
      accounts?: Array<{ screenName: string }>;
    };
    for (const a of w.accounts ?? []) {
      console.log(`[batch] profile @${a.screenName}`);
      run(['--profile', a.screenName]);
    }
  }

  if (!existsSync(QUEUE)) {
    console.log(`[batch] no queue at ${QUEUE}`);
    return;
  }
  const urls = readFileSync(QUEUE, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  console.log(`[batch] ${urls.length} tweet URL(s)`);
  for (const url of urls) {
    console.log(`[batch] ${url}`);
    try {
      run([url]);
    } catch (e) {
      console.warn(`[batch] skip ${url}:`, e);
    }
  }
}

main();
