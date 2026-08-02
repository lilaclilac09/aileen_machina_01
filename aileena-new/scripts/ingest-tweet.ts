#!/usr/bin/env tsx
/**
 * Ingest an X/Twitter status (or profile) into append-only JSONL "databases".
 *
 *   pnpm ingest:tweet -- https://x.com/aaronburnett/status/2077481532835660283
 *   pnpm ingest:tweet -- 2077481532835660283
 *   pnpm ingest:tweet -- --profile aaronburnett
 *   pnpm ingest:tweet -- --profile dylan522p
 *
 * Transport: FixTweet / FxTwitter public API (no key).
 * Optional later: AgentCash stablesocial when wallet funded.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { SocialProfileSchema, SocialTweetSchema, type SocialProfile, type SocialTweet } from '../lib/data/socialTypes';

const ROOT = process.cwd();
const DATA = join(ROOT, 'data');
const TWEETS_PATH = join(DATA, 'tweets.jsonl');
const PROFILES_PATH = join(DATA, 'profiles.jsonl');
const FXT = 'https://api.fxtwitter.com';

function ensureFiles() {
  mkdirSync(DATA, { recursive: true });
  if (!existsSync(TWEETS_PATH)) writeFileSync(TWEETS_PATH, '');
  if (!existsSync(PROFILES_PATH)) writeFileSync(PROFILES_PATH, '');
}

function parseStatusArg(raw: string): { screen?: string; id: string } | null {
  const url = raw.match(/(?:x\.com|twitter\.com)\/([^/]+)\/status\/(\d+)/i);
  if (url) return { screen: url[1], id: url[2] };
  if (/^\d{10,}$/.test(raw.trim())) return { id: raw.trim() };
  return null;
}

function loadIds(path: string, idKey: string): Set<string> {
  if (!existsSync(path)) return new Set();
  const ids = new Set<string>();
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line) as Record<string, unknown>;
      if (typeof row[idKey] === 'string') ids.add(row[idKey] as string);
    } catch {
      /* skip */
    }
  }
  return ids;
}

function upsertJsonl(path: string, idKey: string, row: Record<string, unknown>) {
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
      } else {
        next.push(line);
      }
    } catch {
      next.push(line);
    }
  }
  if (!replaced) next.push(JSON.stringify(row));
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, next.join('\n') + '\n');
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { 'user-agent': 'aileena-ingest-tweet/0.1 (+https://aileena.xyz)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function extractUrls(text: string): string[] {
  const out = new Set<string>();
  const re = /https?:\/\/[^\s)]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out.add(m[0].replace(/[.,;:!?]+$/, ''));
  }
  return [...out];
}

async function ingestProfile(screenName: string): Promise<SocialProfile> {
  const raw = (await fetchJson(`${FXT}/${encodeURIComponent(screenName)}`)) as {
    code?: number;
    user?: Record<string, unknown>;
  };
  if (!raw.user) throw new Error(`No user for @${screenName}`);
  const u = raw.user;
  const website =
    typeof u.website === 'object' && u.website && 'url' in (u.website as object)
      ? String((u.website as { url: string }).url)
      : undefined;
  const verification = u.verification as { verified?: boolean } | undefined;
  const tags: string[] = [];
  const desc = String(u.description ?? '');
  if (/semianalysis/i.test(desc) || screenName === 'dylan522p') tags.push('semianalysis');
  if (/mach33|33fg/i.test(desc) || screenName === 'aaronburnett') tags.push('mach33');

  const profile = SocialProfileSchema.parse({
    id: String(u.id),
    screenName: String(u.screen_name ?? screenName),
    name: u.name ? String(u.name) : undefined,
    description: desc || undefined,
    location: u.location ? String(u.location) : undefined,
    website,
    followers: typeof u.followers === 'number' ? u.followers : undefined,
    following: typeof u.following === 'number' ? u.following : undefined,
    tweets: typeof u.tweets === 'number' ? u.tweets : undefined,
    verified: verification?.verified,
    avatarUrl: u.avatar_url ? String(u.avatar_url) : undefined,
    tags,
    org: tags.includes('semianalysis')
      ? 'SemiAnalysis'
      : tags.includes('mach33')
        ? 'mach33 / 33fg'
        : undefined,
    source: 'fxtwitter',
    updatedAt: new Date().toISOString(),
  });
  upsertJsonl(PROFILES_PATH, 'id', profile);
  return profile;
}

async function ingestTweet(statusId: string, hintScreen?: string): Promise<SocialTweet> {
  const path = hintScreen
    ? `${FXT}/${encodeURIComponent(hintScreen)}/status/${statusId}`
    : `${FXT}/status/${statusId}`;
  // FxTwitter accepts /:user/status/:id — if we only have id, try common pattern via status endpoint
  let raw: { code?: number; tweet?: Record<string, unknown>; message?: string };
  try {
    raw = (await fetchJson(path)) as typeof raw;
  } catch {
    raw = (await fetchJson(`${FXT}/i/status/${statusId}`)) as typeof raw;
  }
  if (!raw.tweet) {
    // Retry with known author if first path failed without screen
    if (!hintScreen) throw new Error(raw.message ?? `Tweet ${statusId} not found`);
    throw new Error(raw.message ?? `Tweet ${statusId} not found`);
  }
  const t = raw.tweet;
  const author = (t.author ?? {}) as Record<string, unknown>;
  const mediaAll = ((t.media as { all?: Array<{ url?: string }> } | undefined)?.all ?? [])
    .map((m) => m.url)
    .filter(Boolean) as string[];
  const facets = (t.raw_text as { facets?: Array<{ type?: string; replacement?: string }> } | undefined)
    ?.facets;
  const linkedFromFacets =
    facets
      ?.filter((f) => f.type === 'url' && f.replacement)
      .map((f) => String(f.replacement)) ?? [];
  const text = String(t.text ?? '');
  const screen = String(author.screen_name ?? hintScreen ?? 'unknown');

  const tweet = SocialTweetSchema.parse({
    id: String(t.id ?? statusId),
    url: String(t.url ?? `https://x.com/${screen}/status/${statusId}`),
    screenName: screen,
    authorId: author.id ? String(author.id) : undefined,
    authorName: author.name ? String(author.name) : undefined,
    text,
    createdAt: t.created_at ? String(t.created_at) : undefined,
    createdTimestamp: typeof t.created_timestamp === 'number' ? t.created_timestamp : undefined,
    likes: typeof t.likes === 'number' ? t.likes : undefined,
    retweets: typeof t.retweets === 'number' ? t.retweets : undefined,
    replies: typeof t.replies === 'number' ? t.replies : undefined,
    bookmarks: typeof t.bookmarks === 'number' ? t.bookmarks : undefined,
    views: typeof t.views === 'number' ? t.views : undefined,
    isNoteTweet: Boolean(t.is_note_tweet),
    mediaUrls: mediaAll.length ? mediaAll : undefined,
    linkedUrls: [...new Set([...linkedFromFacets, ...extractUrls(text)])],
    topics: guessTopics(text, screen),
    tags: screen === 'dylan522p' ? ['semianalysis'] : screen === 'aaronburnett' ? ['mach33'] : [],
    source: 'fxtwitter',
    ingestedAt: new Date().toISOString(),
  });

  upsertJsonl(TWEETS_PATH, 'id', tweet);
  if (screen && screen !== 'unknown') {
    try {
      await ingestProfile(screen);
    } catch (e) {
      console.warn(`[ingest-tweet] profile upsert skipped:`, e);
    }
  }
  return tweet;
}

function guessTopics(text: string, screen: string): string[] {
  const topics = new Set<string>();
  if (screen === 'dylan522p') topics.add('semianalysis');
  if (screen === 'aaronburnett') topics.add('mach33');
  const rules: Array<[RegExp, string]> = [
    [/orbital|satellite|spacecraft|suncatcher/i, 'orbital-compute'],
    [/containment tax|coherence|inference/i, 'inference'],
    [/MoE|mixture.of.experts|expert/i, 'moe'],
    [/GB300|NVL72|H100|Hopper|GPU/i, 'gpu'],
    [/SpaceX|Starlink/i, 'spacex'],
    [/CPO|glass bridge|PIC|waveguide/i, 'optical'],
    [/DeepSeek|TCO|CapEx/i, 'ai-cost'],
  ];
  for (const [re, tag] of rules) {
    if (re.test(text)) topics.add(tag);
  }
  return [...topics];
}

async function main() {
  ensureFiles();
  const args = process.argv.slice(2).filter((a) => a !== '--');
  if (args[0] === '--profile' && args[1]) {
    const p = await ingestProfile(args[1].replace(/^@/, ''));
    console.log(`[ingest-tweet] profile @${p.screenName} → ${PROFILES_PATH}`);
    console.log(JSON.stringify(p, null, 2));
    return;
  }
  const target = args[0];
  if (!target) {
    console.error('Usage: pnpm ingest:tweet -- <tweet-url|id> | --profile <screen>');
    process.exit(1);
  }
  const parsed = parseStatusArg(target);
  if (!parsed) {
    console.error('Could not parse tweet URL/id:', target);
    process.exit(1);
  }
  // Prefer author/status path when we have screen from URL
  let tweet: SocialTweet;
  if (parsed.screen) {
    tweet = await ingestTweet(parsed.id, parsed.screen);
  } else {
    // FxTwitter needs user in path for some ids — try status via i/
    const raw = (await fetchJson(`${FXT}/status/${parsed.id}`).catch(() => null)) as
      | { tweet?: { author?: { screen_name?: string }; id?: string } }
      | null;
    if (raw?.tweet?.author?.screen_name) {
      tweet = await ingestTweet(String(raw.tweet.id ?? parsed.id), raw.tweet.author.screen_name);
    } else {
      // Last resort: user must pass full URL
      throw new Error('Pass full https://x.com/<user>/status/<id> URL when id-only fails');
    }
  }
  console.log(`[ingest-tweet] tweet ${tweet.id} → ${TWEETS_PATH}`);
  console.log(
    JSON.stringify(
      {
        id: tweet.id,
        screenName: tweet.screenName,
        topics: tweet.topics,
        linkedUrls: tweet.linkedUrls,
        likes: tweet.likes,
        views: tweet.views,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error('[ingest-tweet] fatal:', e);
  process.exit(1);
});
