/**
 * News / tracking-item query layer + agent tools.
 *
 * Reads /aileena-new/data/news.json (build-time bundle of news.jsonl).
 * Each item is a dated short tracker: rumour, earnings note, order,
 * supplier shift, allocation update.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { loadArray } from './load';
import { NewsItemSchema, type NewsItem, VendorEnum } from './types';
import { buildTfIdf } from '../tfidf';
import newsRaw from '../../data/news.json';

const dataset = loadArray<NewsItem>(newsRaw, NewsItemSchema, 'data/news.json');
const NEWS = dataset.items.slice().sort((a, b) => b.date.localeCompare(a.date));

// TF-IDF over title + summary so the model can free-text search the
// tracker without needing exact tags.
const searcher = buildTfIdf<NewsItem>(NEWS, (n) => `${n.title}\n${n.summary}\n${(n.topics ?? []).join(' ')}`);

export function latestNews(filter: {
  vendor?: string;
  sinceDate?: string;
  limit?: number;
}): NewsItem[] {
  const out: NewsItem[] = [];
  const lim = filter.limit ?? 10;
  for (const n of NEWS) {
    if (filter.vendor && !(n.vendors ?? []).includes(filter.vendor.toLowerCase() as never)) continue;
    if (filter.sinceDate && n.date < filter.sinceDate) continue;
    out.push(n);
    if (out.length >= lim) break;
  }
  return out;
}

export function searchNews(query: string, k = 5): NewsItem[] {
  return searcher.search(query, k).map((h) => h.item);
}

// ── Agent tools ─────────────────────────────────────────────────────────

export const newsTools = {
  latestNews: tool({
    description:
      "Most recent tracking items, optionally filtered by vendor and a 'since' date. Use for 'what's new with NVIDIA?', 'show me TSMC updates this month', 'recent AI silicon news'.",
    inputSchema: z.object({
      vendor: VendorEnum.optional(),
      sinceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      limit: z.number().int().min(1).max(20).optional().default(10),
    }),
    execute: async ({ vendor, sinceDate, limit }) => {
      const items = latestNews({ vendor, sinceDate, limit });
      return { count: items.length, items };
    },
  }),

  searchNews: tool({
    description:
      "Free-text TF-IDF search over the tracker's title + summary + topics. Use for 'what's the latest on HBM3E supply?', 'Cerebras pricing news', or any free-form tracker question.",
    inputSchema: z.object({
      query: z.string().min(2),
      k: z.number().int().min(1).max(10).optional().default(5),
    }),
    execute: async ({ query, k }) => {
      const items = searchNews(query, k);
      return { count: items.length, items };
    },
  }),
};

export const newsDatasetInfo = () => ({
  source: dataset.source,
  count: NEWS.length,
  invalidCount: dataset.invalidCount,
});
