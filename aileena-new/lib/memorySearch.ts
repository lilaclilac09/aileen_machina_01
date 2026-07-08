/**
 * TF-IDF search over build-time memory index (L2 fast cache).
 * Edge-safe — imports memoryIndex.json only.
 */

import indexJson from './memoryIndex.json';

export type MemorySearchHit = {
  path: string;
  tier: string;
  title: string;
  section: string;
  snippet: string;
  score: number;
};

type RawChunk = {
  path: string;
  tier: string;
  title: string;
  section: string;
  text: string;
};

type RawIndex = {
  generatedAt: string;
  chunkCount: number;
  chunks: RawChunk[];
};

const STOPWORDS = new Set([
  'a', 'the', 'is', 'of', 'in', 'for', 'to', 'that', 'it', 'on', 'with', 'as', 'by', 'an', 'and', 'or',
  'but', 'this', 'was', 'are', 'be', 'at', 'from', 'has', 'have', 'will', 'would', 'could', 'should',
  '她', '的', '是', '在', '和', '了', '我', '你', '不', '也', '就', '都', '而', '及', '与', '着', '或',
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

const raw = indexJson as RawIndex;
const CHUNKS = raw.chunks ?? [];
const N = CHUNKS.length;

const chunkTokens: Array<Map<string, number>> = new Array(N);
const df: Map<string, number> = new Map();

for (let i = 0; i < N; i++) {
  const tf = new Map<string, number>();
  const c = CHUNKS[i];
  const tokens = tokenize(`${c.title} ${c.section} ${c.text} ${c.path}`);
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  chunkTokens[i] = tf;
  for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
}

const idf = new Map<string, number>();
for (const [t, freq] of df.entries()) {
  idf.set(t, Math.log(1 + (N - freq + 0.5) / (freq + 0.5)));
}

export function searchMemories(query: string, k: number = 3): MemorySearchHit[] {
  const qTokens = tokenize(query);
  if (qTokens.length === 0 || N === 0) return [];

  const uniqQ = Array.from(new Set(qTokens));
  const scored: Array<{ idx: number; score: number }> = [];

  for (let i = 0; i < N; i++) {
    const tf = chunkTokens[i];
    let score = 0;
    for (const t of uniqQ) {
      const f = tf.get(t);
      if (!f) continue;
      score += (idf.get(t) ?? 0) * (1 + Math.log(f));
    }
    // Prefer semantic + personal over archived
    const tier = CHUNKS[i].tier;
    if (tier === 'semantic' || tier === 'personal') score *= 1.15;
    if (tier === 'archived') score *= 0.85;
    if (score > 0) scored.push({ idx: i, score });
  }

  scored.sort((a, b) => b.score - a.score);

  const qByIdf = [...uniqQ].sort((a, b) => (idf.get(b) ?? 0) - (idf.get(a) ?? 0));

  return scored.slice(0, k).map(({ idx, score }) => {
    const c = CHUNKS[idx];
    return {
      path: c.path,
      tier: c.tier,
      title: c.title,
      section: c.section,
      snippet: makeSnippet(c.text, qByIdf),
      score: Number(score.toFixed(4)),
    };
  });
}

function makeSnippet(text: string, qByIdf: string[]): string {
  const WINDOW = 240;
  if (text.length <= WINDOW) return text;
  const lower = text.toLowerCase();
  for (const t of qByIdf) {
    const i = lower.indexOf(t);
    if (i !== -1) {
      const half = Math.floor(WINDOW / 2);
      let start = Math.max(0, i - half);
      let end = Math.min(text.length, start + WINDOW);
      if (end - start < WINDOW) start = Math.max(0, end - WINDOW);
      let snip = text.slice(start, end).trim();
      if (start > 0) snip = '…' + snip;
      if (end < text.length) snip = snip + '…';
      return snip;
    }
  }
  return text.slice(0, WINDOW).trim() + '…';
}

export function memoryIndexMeta(): { chunkCount: number; generatedAt: string } {
  return { chunkCount: raw.chunkCount ?? N, generatedAt: raw.generatedAt ?? '' };
}
