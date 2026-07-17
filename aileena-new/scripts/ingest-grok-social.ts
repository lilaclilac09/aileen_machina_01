#!/usr/bin/env tsx
/**
 * Ingest Grok-exported social JSON into tweets.jsonl / profiles.jsonl / numbers.jsonl.
 *
 *   pnpm ingest:grok -- data/social/inbox/grok-semi-2026-07-17.json
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { SocialProfileSchema, SocialTweetSchema } from '../lib/data/socialTypes';

const ROOT = process.cwd();
const DATA = join(ROOT, 'data');
const TWEETS = join(DATA, 'tweets.jsonl');
const PROFILES = join(DATA, 'profiles.jsonl');
const NUMBERS = join(DATA, 'social', 'numbers.jsonl');

type GrokBundle = {
  profiles?: Array<Record<string, unknown>>;
  tweets?: Array<Record<string, unknown>>;
  numbers?: Array<Record<string, unknown>>;
};

function normalizeQuotes(raw: string): string {
  return raw
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
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

function main() {
  const file = process.argv.slice(2).filter((a) => a !== '--')[0];
  if (!file) {
    console.error('Usage: pnpm ingest:grok -- <path-to-grok.json>');
    process.exit(1);
  }
  const abs = file.startsWith('/') ? file : join(ROOT, file);
  const bundle = JSON.parse(normalizeQuotes(readFileSync(abs, 'utf8'))) as GrokBundle;
  const now = new Date().toISOString();

  let pCount = 0;
  for (const raw of bundle.profiles ?? []) {
    const screenName = String(raw.screenName ?? '');
    const tags = Array.isArray(raw.tags) ? (raw.tags as string[]) : [];
    const org = raw.org ? String(raw.org) : undefined;
    const profile = SocialProfileSchema.parse({
      id: String(raw.id ?? `handle:${screenName}`),
      screenName,
      name: raw.name ? String(raw.name) : undefined,
      description: raw.description ? String(raw.description) : undefined,
      location: raw.location ? String(raw.location) : undefined,
      website: raw.website ? String(raw.website) : undefined,
      followers: typeof raw.followers === 'number' ? raw.followers : undefined,
      following: typeof raw.following === 'number' ? raw.following : undefined,
      tweets: typeof raw.tweets === 'number' ? raw.tweets : undefined,
      verified: typeof raw.verified === 'boolean' ? raw.verified : undefined,
      avatarUrl: raw.avatarUrl ? String(raw.avatarUrl) : undefined,
      tags,
      org,
      source: 'grok-export',
      updatedAt: now,
    });
    upsertJsonl(PROFILES, 'id', profile);
    // Also upsert by screenName collision: merge if prior fxtwitter id differs
    pCount++;
  }

  // Deduplicate profiles by screenName (keep newest / prefer real twitter id)
  if (existsSync(PROFILES)) {
    const byScreen = new Map<string, Record<string, unknown>>();
    for (const line of readFileSync(PROFILES, 'utf8').split(/\r?\n/).filter(Boolean)) {
      const row = JSON.parse(line) as Record<string, unknown>;
      const sn = String(row.screenName).toLowerCase();
      const prev = byScreen.get(sn);
      if (!prev) byScreen.set(sn, row);
      else {
        const prevId = String(prev.id);
        const nextId = String(row.id);
        // Prefer numeric twitter ids over handle: aliases
        const preferNext =
          (/^\d+$/.test(nextId) && !/^\d+$/.test(prevId)) ||
          String(row.updatedAt ?? '') >= String(prev.updatedAt ?? '');
        if (preferNext) byScreen.set(sn, { ...prev, ...row, id: /^\d+$/.test(nextId) ? nextId : prev.id });
      }
    }
    writeFileSync(
      PROFILES,
      [...byScreen.values()].map((r) => JSON.stringify(r)).join('\n') + '\n',
    );
  }

  let tCount = 0;
  for (const raw of bundle.tweets ?? []) {
    const tweet = SocialTweetSchema.parse({
      id: String(raw.id),
      url: String(raw.url),
      screenName: String(raw.screenName),
      authorId: raw.authorId ? String(raw.authorId) : undefined,
      authorName: raw.authorName ? String(raw.authorName) : undefined,
      text: String(raw.text ?? ''),
      createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
      createdTimestamp: typeof raw.createdTimestamp === 'number' ? raw.createdTimestamp : undefined,
      likes: typeof raw.likes === 'number' ? raw.likes : undefined,
      retweets: typeof raw.retweets === 'number' ? raw.retweets : undefined,
      replies: typeof raw.replies === 'number' ? raw.replies : undefined,
      bookmarks: typeof raw.bookmarks === 'number' ? raw.bookmarks : undefined,
      views: typeof raw.views === 'number' ? raw.views : undefined,
      isNoteTweet: Boolean(raw.isNoteTweet),
      mediaUrls: Array.isArray(raw.mediaUrls) ? (raw.mediaUrls as string[]) : undefined,
      linkedUrls: Array.isArray(raw.linkedUrls) ? (raw.linkedUrls as string[]) : undefined,
      topics: Array.isArray(raw.topics) ? (raw.topics as string[]) : undefined,
      tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : undefined,
      source: 'grok-export',
      ingestedAt: now,
    });
    upsertJsonl(TWEETS, 'id', tweet);
    tCount++;
  }

  let nCount = 0;
  mkdirSync(dirname(NUMBERS), { recursive: true });
  for (const raw of bundle.numbers ?? []) {
    const row = {
      id: `${raw.tweetId ?? 'na'}:${String(raw.metric ?? nCount)}`,
      metric: String(raw.metric ?? ''),
      value: String(raw.value ?? ''),
      unit: raw.unit == null ? null : String(raw.unit),
      context: raw.context ? String(raw.context) : undefined,
      tweetId: raw.tweetId ? String(raw.tweetId) : undefined,
      confidence: raw.confidence ? String(raw.confidence) : undefined,
      source: 'grok-export',
      ingestedAt: now,
    };
    upsertJsonl(NUMBERS, 'id', row);
    nCount++;
  }

  console.log(
    `[ingest-grok] profiles≈${pCount}, tweets=${tCount}, numbers=${nCount} → ${PROFILES}, ${TWEETS}, ${NUMBERS}`,
  );
}

main();
