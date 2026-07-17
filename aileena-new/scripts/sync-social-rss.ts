#!/usr/bin/env tsx
/**
 * Sync recent tweets from Nitter RSS for watchlist accounts.
 * Shallow backfill: ~18–20 newest items per account. New status ids → FxTwitter enrich.
 *
 * Note: Node fetch gets empty body from nitter.net (200 + 0 bytes); we shell out to curl.
 *
 *   pnpm sync:social-rss
 *   pnpm sync:social-rss -- --dry-run
 *   pnpm sync:social-rss -- --only aaronburnett,SemiAnalysis_
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const WATCH = join(ROOT, 'data', 'social', 'watchlist.json');
const TWEETS = join(ROOT, 'data', 'tweets.jsonl');
const REPORT = join(ROOT, 'data', 'social', 'last-rss-sync.json');
const NITTER_BASES = (
  process.env.NITTER_BASES ||
  process.env.NITTER_BASE ||
  'https://nitter.net'
)
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

type Account = { screenName: string; org?: string; tags?: string[] };

function loadExistingIds(): Set<string> {
  const ids = new Set<string>();
  if (!existsSync(TWEETS)) return ids;
  for (const line of readFileSync(TWEETS, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line) as { id?: string };
      if (row.id) ids.add(String(row.id));
    } catch {
      /* skip */
    }
  }
  return ids;
}

function stripHtml(html: string): string {
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

type RssItem = { id: string; screenName: string; title: string; pubDate?: string; link?: string };

/** nitter returns empty body to Node fetch; curl works. */
function curlGet(url: string): string {
  const r = spawnSync(
    'curl',
    [
      '-sS',
      '-L',
      '--max-time',
      '15',
      '-A',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '-H',
      'Accept: application/rss+xml, application/xml, text/xml, */*',
      url,
    ],
    { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 },
  );
  if (r.status !== 0) {
    throw new Error(`curl failed (${r.status}): ${(r.stderr || '').slice(0, 200)}`);
  }
  return r.stdout || '';
}

function parseRss(xml: string, fallbackScreen: string): RssItem[] {
  const items: RssItem[] = [];
  const blocks = xml.split(/<item>/i).slice(1);
  for (const block of blocks) {
    const guid = block.match(/<guid[^>]*>(\d+)<\/guid>/i)?.[1];
    if (!guid) continue;
    const title = stripHtml(block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '');
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim();
    const link = block.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim();
    const creator =
      block.match(/<dc:creator>(@?)([^<]+)<\/dc:creator>/i)?.[2]?.replace(/^@/, '') ??
      fallbackScreen;
    items.push({
      id: guid,
      screenName: creator || fallbackScreen,
      title,
      pubDate,
      link,
    });
  }
  return items;
}

function fetchRss(screenName: string): RssItem[] {
  let lastErr: Error | undefined;
  for (const base of NITTER_BASES) {
    const url = `${base}/${encodeURIComponent(screenName)}/rss`;
    try {
      const xml = curlGet(url);
      const items = parseRss(xml, screenName);
      if (items.length > 0) return items;
      lastErr = new Error(`empty RSS from ${url} (bytes=${xml.length})`);
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error('no NITTER_BASES');
}

function ingestStatus(screenName: string, id: string): boolean {
  const url = `https://x.com/${screenName}/status/${id}`;
  const r = spawnSync('pnpm', ['exec', 'tsx', 'scripts/ingest-tweet.ts', '--', url], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (r.status !== 0) {
    console.warn(`[rss] ingest fail ${id}:`, (r.stderr || r.stdout || '').slice(0, 240));
    return false;
  }
  console.log(`[rss] + ${screenName}/${id}`);
  return true;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--');
  const dry = args.includes('--dry-run');
  const onlyArg =
    args.find((a) => a.startsWith('--only='))?.slice('--only='.length) ??
    (args.includes('--only') ? args[args.indexOf('--only') + 1] : undefined);
  const only = onlyArg
    ? new Set(onlyArg.split(',').map((s) => s.trim().replace(/^@/, '').toLowerCase()))
    : null;

  if (!existsSync(WATCH)) throw new Error(`missing ${WATCH}`);
  const watch = JSON.parse(readFileSync(WATCH, 'utf8')) as { accounts?: Account[] };
  let accounts = watch.accounts ?? [];
  if (only) accounts = accounts.filter((a) => only.has(a.screenName.toLowerCase()));

  const existing = loadExistingIds();
  const report = {
    ranAt: new Date().toISOString(),
    nitterBases: NITTER_BASES,
    dry,
    accounts: [] as Array<{
      screenName: string;
      rssCount: number;
      missing: string[];
      ingested: string[];
      failed: string[];
      error?: string;
    }>,
  };

  console.log(
    `[rss] watchlist=${accounts.length} existingTweets=${existing.size} dry=${dry} bases=${NITTER_BASES.join(',')}`,
  );

  for (const acc of accounts) {
    const row = {
      screenName: acc.screenName,
      rssCount: 0,
      missing: [] as string[],
      ingested: [] as string[],
      failed: [] as string[],
      error: undefined as string | undefined,
    };
    try {
      const items = fetchRss(acc.screenName);
      row.rssCount = items.length;
      const missing = items.filter((it) => !existing.has(it.id));
      row.missing = missing.map((m) => m.id);
      console.log(`[rss] @${acc.screenName}: rss=${items.length} missing=${missing.length}`);
      for (const it of missing) {
        if (dry) {
          console.log(
            `[rss] dry would ingest ${it.screenName}/${it.id} — ${it.title.slice(0, 80)}`,
          );
          continue;
        }
        const ok = ingestStatus(it.screenName || acc.screenName, it.id);
        if (ok) {
          row.ingested.push(it.id);
          existing.add(it.id);
        } else row.failed.push(it.id);
        await sleep(400);
      }
    } catch (e) {
      row.error = e instanceof Error ? e.message : String(e);
      console.warn(`[rss] @${acc.screenName} error:`, row.error);
    }
    report.accounts.push(row);
  }

  mkdirSync(join(ROOT, 'data', 'social'), { recursive: true });
  writeFileSync(REPORT, JSON.stringify(report, null, 2) + '\n');
  const totalIn = report.accounts.reduce((n, a) => n + a.ingested.length, 0);
  const totalMiss = report.accounts.reduce((n, a) => n + a.missing.length, 0);
  console.log(`[rss] done missing=${totalMiss} ingested=${totalIn} → ${REPORT}`);
  if (!dry && totalIn > 0) {
    const b = spawnSync('pnpm', ['build:data-index'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'inherit',
    });
    if (b.status !== 0) process.exit(b.status ?? 1);
  }
}

main().catch((e) => {
  console.error('[rss] fatal:', e);
  process.exit(1);
});
