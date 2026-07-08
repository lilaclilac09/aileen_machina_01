#!/usr/bin/env tsx
/**
 * Scan live site sources → L3 memory (latest songs, podcasts, documentaries, articles).
 * Run before dreaming in the memory workflow.
 *
 *   pnpm sync:content-memory
 */

import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';

const ROOT = process.cwd();
const BRAIN = join(ROOT, 'aileena_second_brain');
const SEMANTIC = join(BRAIN, 'memories', 'semantic');
const EPISODIC = join(BRAIN, 'memories', 'episodic');
const LATEST_PATH = join(SEMANTIC, 'latest-content.md');

type TrackRow = { id: string; title: string; artist?: string; bpm?: number | null; key?: string | null };
type MediaRow = { title: string; href?: string; meta?: string; label?: string; year?: string };
type ArticleRow = { slug: string; title: string; date: string; url: string };

type ContentSnapshot = {
  curatedSet: TrackRow[];
  playerTracks: TrackRow[];
  podcasts: MediaRow[];
  documentaries: MediaRow[];
  channels: MediaRow[];
  articles: ArticleRow[];
};

function readText(path: string): string {
  return readFileSync(path, 'utf8');
}

function parseSetlist(): { genre: string; tracks: TrackRow[] } {
  const raw = JSON.parse(readText(join(ROOT, 'public', 'dj-set', 'setlist.json'))) as {
    genre?: string;
    tracks?: Array<{
      id: string;
      title: string;
      artist?: string;
      bpm?: number | null;
      key?: string | null;
    }>;
  };
  return {
    genre: raw.genre ?? '',
    tracks: (raw.tracks ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      bpm: t.bpm,
      key: t.key,
    })),
  };
}

function parseDjStationTracks(): TrackRow[] {
  const src = readText(join(ROOT, 'components', 'DJStation.tsx'));
  const re =
    /\{\s*id:\s*['"]([^'"]+)['"],\s*title:\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')/g;
  const out: TrackRow[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const title = (m[2] ?? m[3] ?? '').replace(/\\'/g, "'").replace(/\\"/g, '"');
    out.push({ id: m[1], title });
  }
  return out;
}

function extractConstBlock(source: string, constName: string): string {
  const marker = `const ${constName} = [`;
  const start = source.indexOf(marker);
  if (start === -1) return '';
  let depth = 0;
  let i = start + marker.length - 1;
  for (; i < source.length; i++) {
    const ch = source[i];
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return '';
}

function parseMediaObjects(block: string): MediaRow[] {
  const objects = block.match(/\{[^{}]*\}/g) ?? [];
  const out: MediaRow[] = [];
  for (const obj of objects) {
    const title = obj.match(/title:\s*['"]([^'"]+)['"]/)?.[1];
    if (!title) continue;
    out.push({
      title,
      href: obj.match(/href:\s*['"]([^'"]+)['"]/)?.[1],
      meta: obj.match(/meta:\s*['"]([^'"]+)['"]/)?.[1],
      label: obj.match(/label:\s*['"]([^'"]+)['"]/)?.[1],
      year: obj.match(/year:\s*['"]([^'"]+)['"]/)?.[1],
    });
  }
  return out;
}

function parseWatchShelf(): { podcasts: MediaRow[]; documentaries: MediaRow[]; channels: MediaRow[] } {
  const src = readText(join(ROOT, 'app', 'blog', 'watch-listening-shelf', 'page.tsx'));
  return {
    podcasts: parseMediaObjects(extractConstBlock(src, 'PODCAST_RECS')),
    documentaries: parseMediaObjects(extractConstBlock(src, 'DOCUMENTARY_RECS')),
    channels: parseMediaObjects(extractConstBlock(src, 'CHANNEL_RECS')),
  };
}

function walkBlogPages(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === '_substack' || entry === 'explainer') continue;
      out.push(...walkBlogPages(full));
    } else if (entry === 'page.tsx') {
      out.push(full);
    }
  }
  return out;
}

function extractShellProp(source: string, propName: string): string {
  const reStr = new RegExp(`\\b${propName}\\s*=\\s*"((?:[^"\\\\]|\\\\.)*)"`);
  const m = source.match(reStr);
  return m ? m[1].replace(/\\"/g, '"') : '';
}

function parseArticles(): ArticleRow[] {
  const pages = walkBlogPages(join(ROOT, 'app', 'blog'));
  const rows: ArticleRow[] = [];
  for (const file of pages) {
    const src = readText(file);
    const slug = basename(dirname(file));
    const title = extractShellProp(src, 'title');
    const date = extractShellProp(src, 'date');
    if (!title) continue;
    rows.push({
      slug,
      title,
      date: date || '0000.00.00',
      url: `https://aileena.xyz/blog/${slug}`,
    });
  }
  rows.sort((a, b) => b.date.localeCompare(a.date));
  return rows;
}

function snapshotHash(s: ContentSnapshot): string {
  return createHash('sha256').update(JSON.stringify(s)).digest('hex').slice(0, 16);
}

function readPreviousHash(): string | null {
  if (!existsSync(LATEST_PATH)) return null;
  const m = readText(LATEST_PATH).match(/^contentHash:\s*([a-f0-9]+)/m);
  return m?.[1] ?? null;
}

function diffLists<T>(prev: T[], next: T[], key: (x: T) => string): T[] {
  const prevKeys = new Set(prev.map(key));
  return next.filter((x) => !prevKeys.has(key(x)));
}

function parseSnapshotFromMarkdown(md: string): ContentSnapshot | null {
  const jsonMatch = md.match(/<!-- snapshot:([\s\S]*?) -->/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[1]) as ContentSnapshot;
  } catch {
    return null;
  }
}

function formatTrackLine(t: TrackRow): string {
  const meta = [t.artist, t.bpm ? `BPM ${t.bpm}` : null, t.key ? `KEY ${t.key}` : null]
    .filter(Boolean)
    .join(' · ');
  return meta ? `- **${t.title}** (${t.id}) — ${meta}` : `- **${t.title}** (${t.id})`;
}

function formatMediaLine(m: MediaRow): string {
  const bits = [m.meta, m.year, m.label].filter(Boolean).join(' · ');
  const link = m.href ? ` — ${m.href}` : '';
  return bits ? `- **${m.title}** (${bits})${link}` : `- **${m.title}**${link}`;
}

function buildLatestMarkdown(
  snapshot: ContentSnapshot,
  hash: string,
  genre: string,
  generatedAt: string,
): string {
  const recentPlayer = snapshot.playerTracks.slice(-8).reverse();
  const recentArticles = snapshot.articles.slice(0, 8);

  return `---
contentHash: ${hash}
generatedAt: ${generatedAt}
source: scripts/sync-content-memory.ts
---

# Latest content — auto-synced

Agent truth for **newest songs, podcasts, documentaries, and articles** on aileena.xyz.
Regenerated by \`pnpm sync:content-memory\` (weekly GitHub Action + before Dreaming).

<!-- snapshot:${JSON.stringify(snapshot)} -->

## Curated DJ set (\`/dj-set/\`)

Genre: ${genre || '_see setlist.json_'}

${snapshot.curatedSet.map(formatTrackLine).join('\n')}

## Player deck — newest additions (\`/sound\`)

Last ${recentPlayer.length} tracks in \`DJStation.tsx\` (end of array = most recently added):

${recentPlayer.map(formatTrackLine).join('\n')}

## Podcasts (\`/blog/watch-listening-shelf\`)

${snapshot.podcasts.map(formatMediaLine).join('\n')}

## Documentaries & films

${snapshot.documentaries.map(formatMediaLine).join('\n')}

## Channels (listening shelf)

${snapshot.channels.map(formatMediaLine).join('\n')}

## Latest articles (by date)

${recentArticles.map((a) => `- **${a.title}** (${a.date}) — ${a.url}`).join('\n')}

## Agent rule

When asked what Aileen recently added, published, or is listening to — call \`searchMemories\` with query "latest content" or the specific medium (podcast, documentary, song, article). This file is the canonical auto-updated shelf.
`;
}

function buildChangelog(
  date: string,
  prev: ContentSnapshot | null,
  next: ContentSnapshot,
): string | null {
  if (!prev) return null;

  const newCurated = diffLists(prev.curatedSet, next.curatedSet, (t) => t.id);
  const newPlayer = diffLists(prev.playerTracks, next.playerTracks, (t) => t.id);
  const newPodcasts = diffLists(prev.podcasts, next.podcasts, (t) => t.title);
  const newDocs = diffLists(prev.documentaries, next.documentaries, (t) => t.title);
  const newChannels = diffLists(prev.channels, next.channels, (t) => t.title);
  const newArticles = diffLists(prev.articles, next.articles, (t) => t.slug);

  const sections: string[] = [];
  if (newCurated.length) {
    sections.push(`## New curated set tracks\n\n${newCurated.map(formatTrackLine).join('\n')}`);
  }
  if (newPlayer.length) {
    sections.push(`## New player tracks (DJStation)\n\n${newPlayer.map(formatTrackLine).join('\n')}`);
  }
  if (newPodcasts.length) {
    sections.push(`## New podcasts\n\n${newPodcasts.map(formatMediaLine).join('\n')}`);
  }
  if (newDocs.length) {
    sections.push(`## New documentaries\n\n${newDocs.map(formatMediaLine).join('\n')}`);
  }
  if (newChannels.length) {
    sections.push(`## New channels\n\n${newChannels.map(formatMediaLine).join('\n')}`);
  }
  if (newArticles.length) {
    const sorted = [...newArticles].sort((a, b) => b.date.localeCompare(a.date));
    sections.push(
      `## New articles\n\n${sorted.map((a) => `- **${a.title}** (${a.date}) — ${a.url}`).join('\n')}`,
    );
  }

  if (!sections.length) return null;

  return `# Content changelog — ${date}

Auto-detected updates from site sources (\`sync-content-memory\`).

${sections.join('\n\n')}

## Next step

Review and merge durable facts into \`memories/semantic/\` or \`prompts/\` if needed. Dreaming will pick this up on the next weekly run.
`;
}

function main() {
  const setlist = parseSetlist();
  const playerTracks = parseDjStationTracks();
  const shelf = parseWatchShelf();
  const articles = parseArticles();

  const snapshot: ContentSnapshot = {
    curatedSet: setlist.tracks,
    playerTracks,
    podcasts: shelf.podcasts,
    documentaries: shelf.documentaries,
    channels: shelf.channels,
    articles,
  };

  const hash = snapshotHash(snapshot);
  const prevHash = readPreviousHash();
  const prevSnapshot = existsSync(LATEST_PATH) ? parseSnapshotFromMarkdown(readText(LATEST_PATH)) : null;
  const generatedAt = new Date().toISOString();
  const date = generatedAt.slice(0, 10);

  mkdirSync(SEMANTIC, { recursive: true });
  mkdirSync(EPISODIC, { recursive: true });

  const latestMd = buildLatestMarkdown(snapshot, hash, setlist.genre, generatedAt);
  writeFileSync(LATEST_PATH, latestMd);

  let changelogPath: string | null = null;
  if (prevHash && prevHash !== hash && prevSnapshot) {
    const changelog = buildChangelog(date, prevSnapshot, snapshot);
    if (changelog) {
      changelogPath = join(EPISODIC, `content-changelog-${date}.md`);
      writeFileSync(changelogPath, changelog);
    }
  } else if (!prevHash) {
    writeFileSync(
      join(EPISODIC, `content-baseline-${date}.md`),
      `# Content baseline — ${date}\n\nInitial scan: ${snapshot.playerTracks.length} player tracks, ${snapshot.curatedSet.length} curated, ${snapshot.podcasts.length} podcasts, ${snapshot.documentaries.length} documentaries, ${snapshot.articles.length} articles.\n`,
    );
  }

  const newestArticle = articles[0];
  const newestPlayer = playerTracks.at(-1);

  console.log(`[sync-content-memory] hash ${hash}${prevHash === hash ? ' (unchanged)' : ' (updated)'}`);
  console.log(`[sync-content-memory] → ${LATEST_PATH}`);
  if (changelogPath) console.log(`[sync-content-memory] changelog → ${changelogPath}`);
  console.log(
    `[sync-content-memory] newest article: ${newestArticle?.title ?? '—'} (${newestArticle?.date ?? '—'})`,
  );
  console.log(
    `[sync-content-memory] newest player track: ${newestPlayer?.title ?? '—'} (${newestPlayer?.id ?? '—'})`,
  );
  console.log(
    `[sync-content-memory] podcasts: ${snapshot.podcasts.length}, documentaries: ${snapshot.documentaries.length}`,
  );
}

main();
