/**
 * Generic TF-IDF keyword search.
 *
 * Edge-runtime safe (no fs / path). Build the index once at module load
 * over a pre-fetched array of items + a textFn that maps an item to its
 * searchable text. Then call `search(query, k)` repeatedly.
 *
 * Used by both lib/agentSearch.ts (articles) and lib/data/docs.ts
 * (earnings transcripts + analyst notes). Keeping the algorithm here in
 * one place so improvements (BM25, snippet centring, etc.) only need to
 * land once.
 */

const STOPWORDS = new Set([
  'a',
  'the',
  'is',
  'of',
  'in',
  'for',
  'to',
  'that',
  'it',
  'on',
  'with',
  'as',
  'by',
  'an',
  'and',
  'or',
  'but',
  'this',
  'was',
  'are',
  'be',
  'at',
  'from',
  'has',
  'have',
  'will',
  'would',
  'could',
  'should',
]);

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export type Hit<T> = {
  item: T;
  snippet: string;
  score: number;
};

export type TfIdfSearcher<T> = {
  size: number;
  search: (query: string, k?: number) => Hit<T>[];
};

export function buildTfIdf<T>(
  items: T[],
  textFn: (item: T) => string,
): TfIdfSearcher<T> {
  const N = items.length;
  const tokens: Array<Map<string, number>> = new Array(N);
  const texts: string[] = new Array(N);
  const df = new Map<string, number>();

  for (let i = 0; i < N; i++) {
    const text = textFn(items[i]);
    texts[i] = text;
    const tf = new Map<string, number>();
    for (const t of tokenize(text)) {
      tf.set(t, (tf.get(t) ?? 0) + 1);
    }
    tokens[i] = tf;
    for (const t of tf.keys()) {
      df.set(t, (df.get(t) ?? 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [t, freq] of df.entries()) {
    idf.set(t, Math.log(1 + (N - freq + 0.5) / (freq + 0.5)));
  }

  function search(query: string, k = 3): Hit<T>[] {
    const qTokens = tokenize(query);
    if (qTokens.length === 0) return [];

    const uniqQ = Array.from(new Set(qTokens));
    const scored: Array<{ idx: number; score: number }> = [];

    for (let i = 0; i < N; i++) {
      const tf = tokens[i];
      let score = 0;
      for (const t of uniqQ) {
        const f = tf.get(t);
        if (!f) continue;
        const w = idf.get(t) ?? 0;
        score += w * (1 + Math.log(f));
      }
      if (score > 0) scored.push({ idx: i, score });
    }

    scored.sort((a, b) => b.score - a.score);

    const qByIdf = [...uniqQ].sort(
      (a, b) => (idf.get(b) ?? 0) - (idf.get(a) ?? 0),
    );

    const hits: Hit<T>[] = [];
    for (const { idx, score } of scored.slice(0, k)) {
      hits.push({
        item: items[idx],
        snippet: makeSnippet(texts[idx], qByIdf),
        score: Number(score.toFixed(4)),
      });
    }
    return hits;
  }

  return { size: N, search };
}

function makeSnippet(text: string, qByIdf: string[]): string {
  const WINDOW = 220;
  if (text.length <= WINDOW) return text;

  const lower = text.toLowerCase();
  for (const t of qByIdf) {
    const i = lower.indexOf(t);
    if (i !== -1) {
      const half = Math.floor(WINDOW / 2);
      let start = Math.max(0, i - half);
      let end = Math.min(text.length, start + WINDOW);
      if (end - start < WINDOW) start = Math.max(0, end - WINDOW);
      if (start > 0) {
        const sp = text.indexOf(' ', start);
        if (sp !== -1 && sp - start < 40) start = sp + 1;
      }
      let snip = text.slice(start, end).trim();
      if (start > 0) snip = '…' + snip;
      if (end < text.length) snip = snip + '…';
      return snip;
    }
  }
  return text.slice(0, WINDOW).trim() + '…';
}
