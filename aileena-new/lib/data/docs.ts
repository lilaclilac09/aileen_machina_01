/**
 * Document corpus query layer + agent tools.
 *
 * Loads /aileena-new/lib/dataDocIndex.json — a build-time TF-IDF chunk
 * index over /aileena-new/data/earnings/ and /aileena-new/data/research/
 * (markdown + plain text). See scripts/build-data-index.ts.
 *
 * Two tools exposed:
 *   - searchEarnings(query)  — restrict to earnings transcripts
 *   - searchResearch(query)  — restrict to broker / analyst notes
 *   - searchDocs(query)      — both corpora together
 *
 * Each tool returns ranked passages with the source doc's metadata
 * (date, title, source, tickers, URL) and a TF-IDF-centred snippet.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { buildTfIdf } from '../tfidf';
import type { DocChunk, DocIndex, DocType } from './types';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import docsRaw from '../dataDocIndex.json';

const docIndex = docsRaw as DocIndex;
const ALL_CHUNKS: DocChunk[] = docIndex.chunks ?? [];

// Pre-partition by type so per-corpus searches don't waste cycles
// scanning the wrong corpus.
const EARNINGS = ALL_CHUNKS.filter((c) => c.type === 'earnings');
const RESEARCH = ALL_CHUNKS.filter((c) => c.type === 'research');

const searchAll = buildTfIdf<DocChunk>(ALL_CHUNKS, (c) => `${c.title}\n${c.sectionHint}\n${c.text}`);
const searchEarn = buildTfIdf<DocChunk>(EARNINGS, (c) => `${c.title}\n${c.sectionHint}\n${c.text}`);
const searchRes = buildTfIdf<DocChunk>(RESEARCH, (c) => `${c.title}\n${c.sectionHint}\n${c.text}`);

export type DocHit = {
  id: string;
  type: DocType;
  date: string;
  title: string;
  source?: string;
  tickers?: string[];
  section: string;
  snippet: string;
  url?: string;
  score: number;
};

function toHits(searcherResults: ReturnType<typeof searchAll.search>): DocHit[] {
  return searcherResults.map((h) => ({
    id: h.item.id,
    type: h.item.type,
    date: h.item.date,
    title: h.item.title,
    source: h.item.source,
    tickers: h.item.tickers,
    section: h.item.sectionHint,
    snippet: h.snippet,
    url: h.item.url,
    score: h.score,
  }));
}

export function searchDocs(query: string, k = 4): DocHit[] {
  return toHits(searchAll.search(query, k));
}
export function searchEarnings(query: string, k = 4): DocHit[] {
  return toHits(searchEarn.search(query, k));
}
export function searchResearch(query: string, k = 4): DocHit[] {
  return toHits(searchRes.search(query, k));
}

// ── Agent tools ─────────────────────────────────────────────────────────

export const docTools = {
  searchEarnings: tool({
    description:
      "Keyword-search earnings-call transcripts that Aileen tracks. Returns ranked passages with date, ticker, title and a centred snippet. Use when the visitor asks what a company said on an earnings call ('what did NVIDIA say about Rubin yields on the Q1 call?', 'TSMC capex guidance').",
    inputSchema: z.object({
      query: z.string().min(2),
      k: z.number().int().min(1).max(8).optional().default(4),
    }),
    execute: async ({ query, k }) => ({
      count: searchEarn.size,
      hits: searchEarnings(query, k),
    }),
  }),

  searchResearch: tool({
    description:
      "Keyword-search the broker / analyst research notes Aileen tracks. Returns ranked passages with date, source firm, title, and a centred snippet. Use when the visitor asks for sell-side commentary or industry-analyst takes ('what does Morgan Stanley say about Broadcom AI revenue?', 'sell-side view on HBM supply').",
    inputSchema: z.object({
      query: z.string().min(2),
      k: z.number().int().min(1).max(8).optional().default(4),
    }),
    execute: async ({ query, k }) => ({
      count: searchRes.size,
      hits: searchResearch(query, k),
    }),
  }),

  searchDocs: tool({
    description:
      'Search BOTH earnings transcripts and analyst research together. Use when the visitor wants a market view that benefits from a mix of sources (e.g. "what does the supply chain say about Rubin allocation?"). Prefer searchEarnings or searchResearch when the question is specifically about one corpus.',
    inputSchema: z.object({
      query: z.string().min(2),
      k: z.number().int().min(1).max(8).optional().default(5),
    }),
    execute: async ({ query, k }) => ({
      count: searchAll.size,
      hits: searchDocs(query, k),
    }),
  }),
};

export const docDatasetInfo = () => ({
  totalChunks: ALL_CHUNKS.length,
  earningsChunks: EARNINGS.length,
  researchChunks: RESEARCH.length,
  generatedAt: docIndex.generatedAt,
});
