/**
 * Listening-shelf RSS feeds — same sources as homepage / watch-listening-shelf.
 * Tools pull headlines from here; do not invent a parallel catalogue.
 */

export type FeedSource = {
  id: 'semianalysis' | 'asymmetrical-bets';
  name: string;
  meta: string;
  siteUrl: string;
  feedUrl: string;
};

export const LISTENING_FEEDS: FeedSource[] = [
  {
    id: 'semianalysis',
    name: 'SemiAnalysis',
    meta: 'semis / AI infrastructure',
    siteUrl: 'https://www.semianalysis.com',
    feedUrl: 'https://www.semianalysis.com/feed/',
  },
  {
    id: 'asymmetrical-bets',
    name: 'Asymmetrical Bets',
    meta: 'markets / narratives',
    siteUrl: 'https://asymmetricalbets.substack.com',
    feedUrl: 'https://asymmetricalbets.substack.com/feed',
  },
];

export type FeedItem = {
  sourceId: FeedSource['id'];
  sourceName: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: string | null;
};

function decodeXml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tag(block: string, name: string): string {
  const re = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i');
  const m = block.match(re);
  return m ? decodeXml(m[1]) : '';
}

export function parseRssItems(xml: string, source: FeedSource, limit = 20): FeedItem[] {
  const items: FeedItem[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks) {
    const title = tag(block, 'title');
    const link = tag(block, 'link');
    if (!title || !link) continue;
    const summary = tag(block, 'description') || tag(block, 'content:encoded');
    const publishedAt = tag(block, 'pubDate') || null;
    items.push({
      sourceId: source.id,
      sourceName: source.name,
      title,
      link,
      summary: summary.slice(0, 280),
      publishedAt,
    });
    if (items.length >= limit) break;
  }
  return items;
}

declare global {
  var __listeningFeedCache:
    | { at: number; items: FeedItem[] }
    | undefined;
}

const CACHE_MS = 15 * 60 * 1000;

export async function loadListeningFeedItems(limitPerFeed = 12): Promise<FeedItem[]> {
  const now = Date.now();
  if (globalThis.__listeningFeedCache && now - globalThis.__listeningFeedCache.at < CACHE_MS) {
    return globalThis.__listeningFeedCache.items;
  }

  const batches = await Promise.all(
    LISTENING_FEEDS.map(async (source) => {
      try {
        const res = await fetch(source.feedUrl, {
          headers: { Accept: 'application/rss+xml, application/xml, text/xml, */*' },
          next: { revalidate: 900 },
        });
        if (!res.ok) throw new Error(`${source.id} HTTP ${res.status}`);
        const xml = await res.text();
        return parseRssItems(xml, source, limitPerFeed);
      } catch (e) {
        console.error('[feeds]', source.id, e);
        return [] as FeedItem[];
      }
    }),
  );

  const items = batches.flat();
  globalThis.__listeningFeedCache = { at: now, items };
  return items;
}

export function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
