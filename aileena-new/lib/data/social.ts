/**
 * Agent tools over ingested X/Twitter JSON (bundled from tweets.jsonl / profiles.jsonl).
 */

import { tool } from 'ai';
import { z } from 'zod';
import { loadArray } from './load';
import { SocialProfileSchema, SocialTweetSchema, type SocialProfile, type SocialTweet } from './socialTypes';
import { buildTfIdf } from '../tfidf';
import tweetsRaw from '../../data/tweets.json';
import profilesRaw from '../../data/profiles.json';

const tweetsDs = loadArray<SocialTweet>(tweetsRaw, SocialTweetSchema, 'data/tweets.json');
const profilesDs = loadArray<SocialProfile>(profilesRaw, SocialProfileSchema, 'data/profiles.json');

const TWEETS = tweetsDs.items.slice().sort((a, b) => (b.createdTimestamp ?? 0) - (a.createdTimestamp ?? 0));
const PROFILES = profilesDs.items;

const tweetSearcher = buildTfIdf<SocialTweet>(
  TWEETS,
  (t) => `${t.screenName}\n${t.authorName ?? ''}\n${t.text}\n${(t.topics ?? []).join(' ')}`,
);

export function searchTweets(query: string, k = 5): SocialTweet[] {
  return tweetSearcher.search(query, k).map((h) => h.item);
}

export function findProfile(screenOrName: string): SocialProfile | undefined {
  const q = screenOrName.replace(/^@/, '').toLowerCase();
  const exact = PROFILES.find((p) => p.screenName.toLowerCase() === q);
  if (exact) return exact;
  return PROFILES.find(
    (p) => p.name?.toLowerCase().includes(q) || p.org?.toLowerCase().includes(q),
  );
}

export const socialTools = {
  searchTweets: tool({
    description:
      "Search ingested X/Twitter notes (mach33 Aaron Burnett, SemiAnalysis Dylan Patel, etc.). Use for orbital containment tax, Semi tweets already ingested — not live X.",
    inputSchema: z.object({
      query: z.string().min(2),
      k: z.number().int().min(1).max(10).optional().default(5),
    }),
    execute: async ({ query, k }) => {
      const items = searchTweets(query, k);
      return {
        count: items.length,
        items: items.map((t) => ({
          id: t.id,
          url: t.url,
          screenName: t.screenName,
          text: t.text.slice(0, 600),
          topics: t.topics,
          linkedUrls: t.linkedUrls,
          likes: t.likes,
          views: t.views,
        })),
      };
    },
  }),

  lookupSocialProfile: tool({
    description:
      "Lookup an ingested X profile (Aaron Burnett / mach33, Dylan Patel / SemiAnalysis). Use when visitor asks who someone is.",
    inputSchema: z.object({
      handleOrName: z.string().min(2),
    }),
    execute: async ({ handleOrName }) => {
      const p = findProfile(handleOrName);
      if (!p) return { found: false, handleOrName };
      return { found: true, profile: p };
    },
  }),
};

export const socialDatasetInfo = () => ({
  tweets: { source: tweetsDs.source, count: TWEETS.length, invalidCount: tweetsDs.invalidCount },
  profiles: { source: profilesDs.source, count: PROFILES.length, invalidCount: profilesDs.invalidCount },
});
