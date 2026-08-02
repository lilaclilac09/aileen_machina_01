#!/usr/bin/env tsx
/**
 * Extract numeric claims from tweet text into data/social/numbers.jsonl.
 * Used by RSS cron so numbers refresh without manual Grok paste.
 *
 *   pnpm extract:tweet-numbers
 *   pnpm extract:tweet-numbers -- --since-ids id1,id2
 *   pnpm extract:tweet-numbers -- --all
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const TWEETS = join(ROOT, 'data', 'tweets.jsonl');
const NUMBERS = join(ROOT, 'data', 'social', 'numbers.jsonl');

type Tweet = { id: string; text?: string; screenName?: string };
type NumberRow = {
  id: string;
  metric: string;
  value: string;
  unit: string | null;
  context: string;
  tweetId: string;
  confidence: 'regex-auto';
  source: 'rss-auto';
  ingestedAt: string;
};

type Pattern = {
  metric: string;
  re: RegExp;
  unit?: string | null;
  value?: (m: RegExpMatchArray) => string;
};

const PATTERNS: Pattern[] = [
  {
    metric: 'money',
    re: /\$\s?(\d+(?:\.\d+)?)\s*([TtBbMm]|trillion|billion|million)?\b/g,
    value: (m) => `$${m[1]}${m[2] ?? ''}`.replace(/\s+/g, ''),
  },
  {
    metric: 'bandwidth',
    re: /(\d+(?:\.\d+)?)\s*(Gbit\/s|Gbps|Tbps|TB\/s|GB\/s)\b/gi,
    value: (m) => `${m[1]} ${m[2]}`,
  },
  {
    metric: 'memory',
    re: /(\d+(?:\.\d+)?)\s*(GB|TB)\b(?:\s*(?:HBM|memory|DRAM))?/gi,
    value: (m) => `${m[1]} ${m[2]}`,
  },
  {
    metric: 'multiplier',
    re: /(\d+(?:\.\d+)?)\s*[x×]\b/gi,
    value: (m) => `${m[1]}×`,
  },
  {
    metric: 'percent',
    re: /(\d+(?:\.\d+)?)\s*%/g,
    value: (m) => `${m[1]}%`,
  },
  {
    metric: 'power',
    re: /~?\s*(\d+(?:\.\d+)?)\s*(kW|MW)\b/gi,
    value: (m) => `${m[1]} ${m[2]}`,
  },
  {
    metric: 'params',
    re: /(\d+(?:\.\d+)?)\s*[Tt]\b(?:-?param| params| parameters)?/g,
    value: (m) => `${m[1]}T`,
  },
  {
    metric: 'tokens_per_sec',
    re: /~?\s*([\d,]+)\s*tokens?\/sec(?:\/GPU)?/gi,
    value: (m) => m[1].replace(/,/g, ''),
    unit: 'tokens/sec',
  },
  {
    metric: 'hourly_gpu',
    re: /\$\s?(\d+(?:\.\d+)?)\s*\/\s*hr(?:\/GPU)?/gi,
    value: (m) => `$${m[1]}/hr`,
  },
];

function loadJsonl<T>(path: string): T[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as T);
}

function upsertJsonl(path: string, idKey: string, row: Record<string, unknown>) {
  mkdirSync(dirname(path), { recursive: true });
  const id = String(row[idKey]);
  const lines = existsSync(path)
    ? readFileSync(path, 'utf8').split(/\r?\n/).filter((l) => l.trim())
    : [];
  const next: string[] = [];
  let replaced = false;
  for (const line of lines) {
    try {
      const existing = JSON.parse(line) as Record<string, unknown>;
      if (String(existing[idKey]) === id) {
        next.push(JSON.stringify(row));
        replaced = true;
      } else next.push(line);
    } catch {
      next.push(line);
    }
  }
  if (!replaced) next.push(JSON.stringify(row));
  writeFileSync(path, next.join('\n') + '\n');
}

function extractFromTweet(t: Tweet, now: string): NumberRow[] {
  const text = t.text ?? '';
  if (!text.trim()) return [];
  const out: NumberRow[] = [];
  const seen = new Set<string>();

  for (const p of PATTERNS) {
    const re = new RegExp(p.re.source, p.re.flags.includes('g') ? p.re.flags : `${p.re.flags}g`);
    let m: RegExpMatchArray | null;
    while ((m = re.exec(text))) {
      const value = (p.value ? p.value(m) : m[0]).trim();
      if (!value || value.length > 40) continue;
      // skip tiny bare multipliers that are usually noise (1x, 2x in prose)
      if (p.metric === 'multiplier') {
        const n = Number(value.replace('×', ''));
        if (!Number.isFinite(n) || n < 3) continue;
      }
      const id = `${t.id}:${p.metric}:${value}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const start = Math.max(0, (m.index ?? 0) - 40);
      const end = Math.min(text.length, (m.index ?? 0) + m[0].length + 40);
      const context = text.slice(start, end).replace(/\s+/g, ' ').trim();
      out.push({
        id,
        metric: p.metric,
        value,
        unit: p.unit ?? null,
        context,
        tweetId: t.id,
        confidence: 'regex-auto',
        source: 'rss-auto',
        ingestedAt: now,
      });
    }
  }
  return out;
}

function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--');
  const all = args.includes('--all');
  const sinceArg =
    args.find((a) => a.startsWith('--since-ids='))?.slice('--since-ids='.length) ??
    (args.includes('--since-ids') ? args[args.indexOf('--since-ids') + 1] : undefined);
  const since = sinceArg
    ? new Set(sinceArg.split(',').map((s) => s.trim()).filter(Boolean))
    : null;

  const tweets = loadJsonl<Tweet>(TWEETS);
  const selected = all
    ? tweets
    : since
      ? tweets.filter((t) => since.has(t.id))
      : tweets.slice(-80); // default: recent window

  const now = new Date().toISOString();
  let added = 0;
  for (const t of selected) {
    for (const row of extractFromTweet(t, now)) {
      upsertJsonl(NUMBERS, 'id', row);
      added++;
    }
  }
  console.log(
    `[extract-numbers] tweets=${selected.length} rowsUpserted≈${added} → ${NUMBERS}`,
  );
}

main();
