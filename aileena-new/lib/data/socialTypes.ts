/**
 * Social / X (Twitter) tracked layer — profiles + tweets as append-only JSONL.
 * Ingest: `pnpm ingest:tweet -- <url-or-id>`
 * Why not Grok: Grok has native X access. We use public FixTweet/FxTwitter
 * mirrors (no key). Optional upgrade: AgentCash stablesocial when funded.
 */

import { z } from 'zod';

export const SocialProfileSchema = z.object({
  id: z.string().min(1),
  screenName: z.string().min(1),
  name: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  followers: z.number().optional(),
  following: z.number().optional(),
  tweets: z.number().optional(),
  verified: z.boolean().optional(),
  avatarUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  org: z.string().optional(),
  source: z.string().default('fxtwitter'),
  updatedAt: z.string(),
});
export type SocialProfile = z.infer<typeof SocialProfileSchema>;

export const SocialTweetSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  screenName: z.string(),
  authorId: z.string().optional(),
  authorName: z.string().optional(),
  text: z.string(),
  createdAt: z.string().optional(),
  createdTimestamp: z.number().optional(),
  likes: z.number().optional(),
  retweets: z.number().optional(),
  replies: z.number().optional(),
  bookmarks: z.number().optional(),
  views: z.number().optional(),
  isNoteTweet: z.boolean().optional(),
  mediaUrls: z.array(z.string()).optional(),
  linkedUrls: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().default('fxtwitter'),
  ingestedAt: z.string(),
});
export type SocialTweet = z.infer<typeof SocialTweetSchema>;
