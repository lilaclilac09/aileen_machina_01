#!/usr/bin/env tsx
/**
 * Dreaming / consolidate — offline memory maintenance (CPU only).
 *
 * Weekly: pnpm dreaming
 * Produces a review report under memories/archived/ for human merge.
 * Also snapshots social RSS / numbers (Semi + mach33) into the report + episodic digest.
 * Full LLM merge can be added later (ReMe / O-Mem hooks).
 */

import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  isSubstanceTweet,
  isWatchlistScreen,
  loadWatchlistScreenNames,
} from '../lib/data/socialWatchlist';

const ROOT = process.cwd();
const BRAIN = join(ROOT, 'aileena_second_brain');
const MEMORIES = join(BRAIN, 'memories');
const ARCHIVED = join(MEMORIES, 'archived');
const DATA = join(ROOT, 'data');
const SOCIAL = join(DATA, 'social');

function walkMd(dir: string, base: string, acc: { rel: string; bytes: number; lines: number }[]): void {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkMd(full, base, acc);
    else if (name.endsWith('.md') && !name.startsWith('consolidate-report-')) {
      const rel = relative(BRAIN, full);
      const text = readFileSync(full, 'utf8');
      acc.push({ rel, bytes: text.length, lines: text.split('\n').length });
    }
  }
}

function tokenize(s: string): string[] {
  return s.toLowerCase().split(/[^a-z0-9\u4e00-\u9fff]+/).filter((t) => t.length > 3);
}

function loadJsonl<T>(path: string): T[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => {
      try {
        return JSON.parse(l) as T;
      } catch {
        return null as unknown as T;
      }
    })
    .filter(Boolean);
}

type TweetRow = { id: string; screenName?: string; text?: string; createdAt?: string };
type NumberRow = { metric?: string; value?: string; tweetId?: string; confidence?: string; source?: string };
type RssReport = {
  ranAt?: string;
  accounts?: Array<{ screenName: string; rssCount: number; missing: string[]; ingested: string[]; error?: string }>;
};

function buildSocialSnapshot(date: string): { reportSection: string; episodicPath: string | null } {
  const tweetsPath = join(DATA, 'tweets.jsonl');
  const numbersPath = join(SOCIAL, 'numbers.jsonl');
  const rssPath = join(SOCIAL, 'last-rss-sync.json');
  const watchPath = join(SOCIAL, 'watchlist.json');

  if (!existsSync(tweetsPath) && !existsSync(rssPath)) {
    return {
      reportSection: '_No social DB yet — run `pnpm sync:social-rss` or wait for 6h cron._',
      episodicPath: null,
    };
  }

  const tweetsAll = loadJsonl<TweetRow>(tweetsPath);
  const numbers = loadJsonl<NumberRow>(numbersPath);
  const rss: RssReport = existsSync(rssPath)
    ? (JSON.parse(readFileSync(rssPath, 'utf8')) as RssReport)
    : {};
  const watch = existsSync(watchPath)
    ? (JSON.parse(readFileSync(watchPath, 'utf8')) as { accounts?: Array<{ screenName: string; org?: string }> })
    : { accounts: [] };

  const allowed = loadWatchlistScreenNames(ROOT);
  // Teachers only — drop Elon/SpaceX/RT meme authors still sitting in older JSONL.
  const tweets = tweetsAll.filter((t) => isWatchlistScreen(t.screenName, allowed));
  const dropped = tweetsAll.length - tweets.length;

  const byScreen = new Map<string, number>();
  for (const t of tweets) {
    const sn = (t.screenName ?? 'unknown').toLowerCase();
    byScreen.set(sn, (byScreen.get(sn) ?? 0) + 1);
  }

  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const recent = tweets
    .filter((t) => {
      const ts = t.createdAt ? Date.parse(t.createdAt) : NaN;
      if (!(Number.isFinite(ts) && ts >= weekAgo)) return false;
      // Soft drop short banter / emoji memes from teachers' timelines
      return isSubstanceTweet(t.text);
    })
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));

  const recentLines = recent.slice(0, 12).map((t) => {
    const sn = t.screenName ?? '?';
    const blurb = (t.text ?? '').replace(/\s+/g, ' ').slice(0, 100);
    return `- @${sn} \`${t.id}\` — ${blurb}${(t.text ?? '').length > 100 ? '…' : ''}`;
  });

  const topNumbers = numbers
    .filter((n) => n.value && n.metric)
    .slice(-16)
    .reverse()
    .map(
      (n) =>
        `- **${n.metric}**: ${n.value} _(tweet ${n.tweetId ?? '?'}, ${n.confidence ?? n.source ?? '?'})_`,
    );

  const rssLines = (rss.accounts ?? []).map((a) => {
    const miss = a.missing?.length ?? 0;
    const ing = a.ingested?.length ?? 0;
    const err = a.error ? ` · err: ${a.error}` : '';
    return `- @${a.screenName}: rss=${a.rssCount} missing=${miss} ingested=${ing}${err}`;
  });

  const watchLines = (watch.accounts ?? [])
    .map((a) => `- @${a.screenName}${a.org ? ` (${a.org})` : ''}`)
    .join('\n');

  const screenTable = [...byScreen.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([sn, n]) => `| @${sn} | ${n} |`)
    .join('\n');

  const reportSection = `Last RSS sync: \`${rss.ranAt ?? 'n/a'}\` · watchlist tweets: **${tweets.length}**${dropped ? ` · pruned off-watchlist from digest: **${dropped}**` : ''} · numbers: **${numbers.length}**

### Watchlist

${watchLines || '_empty_'}

### Tweets by account (watchlist only)

| Account | Count |
|---------|-------|
${screenTable || '| — | 0 |'}

### Last RSS run

${rssLines.length ? rssLines.join('\n') : '_No last-rss-sync.json_'}

### Recent teacher tweets (7d · substance filter)

${recentLines.length ? recentLines.join('\n') : '_None with createdAt in last 7d_'}

### Numbers sample (newest)

${topNumbers.length ? topNumbers.join('\n') : '_No numbers.jsonl rows_'}

Ops: \`data/social/README.md\` · cron: \`.github/workflows/social-rss-sync.yml\` · dossier: \`memories/semantic/analysts-dylan-aaron.md\`
`;

  const episodicDir = join(MEMORIES, 'episodic');
  mkdirSync(episodicDir, { recursive: true });
  const episodicPath = join(episodicDir, `social-changelog-${date}.md`);
  const episodic = `---
id: social-changelog-${date}
type: episodic
date: ${date}
title: Social RSS / teachers digest for Dreaming
topics: [semianalysis, mach33, social-rss, dylan-patel, aaron-burnett]
---

# Social digest — ${date}

Auto-written by \`pnpm dreaming\` from \`data/tweets.jsonl\` + \`data/social/*\` (**watchlist + substance only** — no RT meme authors).
Review → promote durable facts into \`memories/semantic/analysts-dylan-aaron.md\` or research ledgers.

## Snapshot

- Watchlist tweets: **${tweets.length}**${dropped ? ` (digest dropped ${dropped} off-watchlist)` : ''}
- Numbers: **${numbers.length}**
- Last RSS: \`${rss.ranAt ?? 'n/a'}\`

## By account

| Account | Count |
|---------|-------|
${screenTable || '| — | 0 |'}

## Recent (7d · substance)

${recentLines.length ? recentLines.join('\n') : '_none_'}

## Numbers (newest)

${topNumbers.length ? topNumbers.join('\n') : '_none_'}
`;
  writeFileSync(episodicPath, episodic);

  return { reportSection, episodicPath };
}

function main() {
  const files: { rel: string; bytes: number; lines: number }[] = [];
  walkMd(MEMORIES, BRAIN, files);

  const wordFreq = new Map<string, number>();
  for (const f of files) {
    const text = readFileSync(join(BRAIN, f.rel), 'utf8');
    for (const w of tokenize(text)) wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1);
  }

  const episodic = files.filter((f) => f.rel.includes('memories/episodic/'));
  const staleCandidates = episodic.filter((f) => f.bytes < 200);
  const latestContentPath = join(BRAIN, 'memories', 'semantic', 'latest-content.md');
  let latestContentNote = '_No latest-content.md — run `pnpm sync:content-memory`._';
  if (existsSync(latestContentPath)) {
    const lc = readFileSync(latestContentPath, 'utf8');
    const hash = lc.match(/^contentHash:\s*(\S+)/m)?.[1] ?? '?';
    const at = lc.match(/^generatedAt:\s*(\S+)/m)?.[1] ?? '?';
    const changelogToday = episodic.filter((f) => f.rel.includes('content-changelog-'));
    latestContentNote = `Hash \`${hash}\`, synced ${at}. Changelog files: ${changelogToday.length}.`;
  }
  const topTerms = [...wordFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)
    .map(([w, c]) => `- ${w} (${c})`);

  const date = new Date().toISOString().slice(0, 10);
  const social = buildSocialSnapshot(date);
  mkdirSync(ARCHIVED, { recursive: true });
  const outPath = join(ARCHIVED, `consolidate-report-${date}.md`);

  const report = `# Dreaming report — ${date}

Auto-generated by \`pnpm dreaming\`. Review and merge into \`semantic/\` or \`personal/\` by hand.

## Inventory

| File | Lines | Bytes |
|------|-------|-------|
${files.map((f) => `| ${f.rel} | ${f.lines} | ${f.bytes} |`).join('\n')}

## Latest content sync (songs · podcasts · documentaries · articles)

${latestContentNote}

Review \`memories/episodic/content-changelog-*.md\` for auto-detected additions since last run.

## Social teachers (SemiAnalysis · mach33)

${social.reportSection}

${social.episodicPath ? `Episodic digest: \`memories/episodic/social-changelog-${date}.md\`` : ''}

## Episodic → semantic candidates

${staleCandidates.length ? staleCandidates.map((f) => `- ${f.rel} (short — merge or archive)`).join('\n') : '_No short episodic files._'}

## Hot terms (dedup hints)

${topTerms.join('\n')}

## Next steps

1. Merge duplicate facts across semantic files
2. Promote reviewed episodic notes → \`memories/semantic/\` (incl. \`social-changelog-*.md\` → analysts dossier / research ledgers)
3. Write one new skill under \`memories/procedural/skills/\` if a pattern repeats 3×
4. Run \`pnpm build:memory-index\` then deploy
5. Optional: run ReMeLight or O-Mem locally for LLM-assisted merge

## Hardware note

Dreaming runs offline — no GPU KV cache. Smaller indexed corpus = cheaper retrieval prefills at runtime.

## Visitor soft memory (Redis)

Per-visitor questions live in Upstash Redis with a **90-day sliding TTL**.
Dreaming does **not** SCAN Redis in v0.5 — expiry is the GC. Hard Markdown
memories above are never deleted by Redis TTL.
`;

  writeFileSync(outPath, report);
  console.log(`[dreaming] wrote ${outPath}`);
  if (social.episodicPath) console.log(`[dreaming] wrote ${social.episodicPath}`);
  console.log(`[dreaming] ${files.length} memory files, ${episodic.length} episodic`);
}

main();
