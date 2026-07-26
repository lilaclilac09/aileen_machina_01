#!/usr/bin/env tsx
/**
 * Print a ready-to-paste Grok prompt that skips already-ingested tweet ids.
 *
 *   pnpm social:grok-prompt
 *   pnpm social:grok-prompt -- --org mach33
 *   pnpm social:grok-prompt -- --org semianalysis
 *   pnpm social:grok-prompt -- --org all --limit-skip 80
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const TWEETS = join(ROOT, 'data', 'tweets.jsonl');
const WATCH = join(ROOT, 'data', 'social', 'watchlist.json');
const OUT_DIR = join(ROOT, 'data', 'social', 'prompts');

type TweetRow = {
  id: string;
  screenName?: string;
  tags?: string[];
  createdAt?: string;
};

function loadTweets(): TweetRow[] {
  if (!existsSync(TWEETS)) return [];
  const rows: TweetRow[] = [];
  for (const line of readFileSync(TWEETS, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line) as TweetRow);
    } catch {
      /* skip */
    }
  }
  return rows;
}

function orgOf(t: TweetRow): 'mach33' | 'semianalysis' | 'other' {
  const tags = (t.tags ?? []).map((x) => x.toLowerCase());
  const sn = (t.screenName ?? '').toLowerCase();
  if (tags.includes('mach33') || ['aaronburnett', 'mach33', 'vladsaigau'].includes(sn)) {
    return 'mach33';
  }
  if (
    tags.includes('semianalysis') ||
    ['dylan522p', 'semianalysis_'].includes(sn)
  ) {
    return 'semianalysis';
  }
  return 'other';
}

function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--');
  const orgArg = (
    args.find((a) => a.startsWith('--org='))?.slice('--org='.length) ??
    (args.includes('--org') ? args[args.indexOf('--org') + 1] : 'all')
  ).toLowerCase();
  const limitSkip = Number(
    args.find((a) => a.startsWith('--limit-skip='))?.slice('--limit-skip='.length) ??
      (args.includes('--limit-skip') ? args[args.indexOf('--limit-skip') + 1] : '120'),
  );

  const tweets = loadTweets();
  const filtered =
    orgArg === 'all'
      ? tweets
      : tweets.filter((t) => orgOf(t) === orgArg || (orgArg === 'semi' && orgOf(t) === 'semianalysis'));

  const byTime = [...filtered].sort((a, b) =>
    String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')),
  );
  const skipIds = byTime.slice(0, limitSkip).map((t) => t.id);

  const watch = existsSync(WATCH)
    ? (JSON.parse(readFileSync(WATCH, 'utf8')) as {
        accounts?: Array<{ screenName: string; org?: string }>;
      })
    : { accounts: [] };

  const accounts =
    orgArg === 'mach33'
      ? (watch.accounts ?? []).filter((a) => /mach33/i.test(a.org ?? '') || ['aaronburnett', 'mach33', 'VladSaigau'].includes(a.screenName))
      : orgArg === 'semianalysis' || orgArg === 'semi'
        ? (watch.accounts ?? []).filter((a) => /semi/i.test(a.org ?? '') || ['dylan522p', 'SemiAnalysis_'].includes(a.screenName))
        : watch.accounts ?? [];

  const accountLines = accounts
    .map((a, i) => `${i + 1}. @${a.screenName}${a.org ? ` — ${a.org}` : ''}`)
    .join('\n');

  const skipBlock = skipIds.map((id) => `- ${id}`).join('\n');

  const focus =
    orgArg === 'mach33'
      ? 'orbital compute / ODC / Starlink / Starship / bandwidth / SpaceXAI / containment tax / 33fg'
      : orgArg === 'semianalysis' || orgArg === 'semi'
        ? 'GPU / HBM / CPO / Rubin / Helios / TCO / datacenter / STEEL / WideEP / memory'
        : 'AI infra + orbital compute (tag org correctly: SemiAnalysis vs mach33)';

  const prompt = `你是数据抽取助手。请从 X/Twitter 抽取下列账号内容，输出**严格 JSON only**（不要 markdown 围栏、不要前言后语）。

# 账号
${accountLines || '(使用 watchlist 相关账号)'}

# 已入库（跳过这些 id，不要重复输出）
${skipBlock || '(none yet)'}

# 抽取范围
- 最近 40–80 条原创 + note tweet（重要转评可收，标 isRepost=true）
- 优先主题：${focus}
- 只输出**上面 skip 列表以外**的新帖；若近期都被 skip 覆盖，请往更早时间继续挖（deep backfill）
- 时间：优先 2026 年；不够再往前

# 输出 schema（缺了填 null，禁止编造数字）
{
  "profiles": [
    {
      "screenName": "...",
      "name": "...",
      "description": "...",
      "website": "https://...",
      "followers": 0,
      "org": "${orgArg === 'mach33' ? 'mach33' : orgArg === 'all' ? 'SemiAnalysis|mach33' : 'SemiAnalysis'}",
      "tags": ["${orgArg === 'mach33' ? 'mach33' : 'semianalysis'}"]
    }
  ],
  "tweets": [
    {
      "id": "status数字id",
      "url": "https://x.com/.../status/...",
      "screenName": "...",
      "authorName": "...",
      "text": "全文",
      "createdAt": "ISO8601",
      "likes": 0,
      "retweets": 0,
      "replies": 0,
      "views": 0,
      "linkedUrls": [],
      "mediaUrls": [],
      "topics": [],
      "tags": ["${orgArg === 'mach33' ? 'mach33' : 'semianalysis'}"],
      "isNoteTweet": false,
      "isRepost": false
    }
  ],
  "numbers": [
    {
      "metric": "短名",
      "value": "原文字面值",
      "unit": null,
      "context": "一句上下文",
      "tweetId": "对应id",
      "confidence": "quoted"
    }
  ]
}

# 规则
- mach33 账号 org/tags 用 mach33；Semi 用 SemiAnalysis / semianalysis — 不要混
- numbers 只抽推文里明确写出的数字；confidence="quoted"
- ASCII 直引号 "，不要弯引号
- 可分批：先 profiles + 前 30 tweets + numbers；我说 continue 再下一批（仍跳过 skip 列表）
`;

  mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const outFile = join(OUT_DIR, `grok-${orgArg}-${stamp}.txt`);
  writeFileSync(outFile, prompt);
  console.log(prompt);
  console.error(`[grok-prompt] wrote ${outFile} (skip=${skipIds.length} of ${filtered.length} tweets)`);
}

main();
