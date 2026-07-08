#!/usr/bin/env tsx
/**
 * Sync curated DJ set (handoff tracks) → L3 memory markdown.
 * Carousel lives on /sound#dj-set — does NOT append DJStation tracks.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const BRAIN = join(ROOT, 'aileena_second_brain');
const SETLIST_PATH = join(ROOT, 'public', 'dj-set', 'setlist.json');
const SETLIST_MD = join(BRAIN, 'memories', 'semantic', 'setlist.md');
const MUSIC_TASTE_PROMPT = join(BRAIN, 'prompts', 'music-taste.md');

type SetlistFile = {
  genre?: string;
  tracks: Array<{
    id: string;
    title: string;
    artist?: string;
    bpm?: number | null;
    key?: string | null;
    note?: string;
  }>;
};

function main() {
  const setlist = JSON.parse(readFileSync(SETLIST_PATH, 'utf8')) as SetlistFile;
  const genre = setlist.genre ?? '';
  const date = new Date().toISOString().slice(0, 10);

  const lines = setlist.tracks.map((t, i) => {
    const meta = [t.bpm ? `${t.bpm} BPM` : null, t.key].filter(Boolean).join(', ');
    const artist = t.artist ?? '—';
    return `${i + 1}. **TRACK ${t.id}** — ${t.title} / ${artist}${meta ? ` (${meta})` : ''}`;
  });

  mkdirSync(join(BRAIN, 'memories', 'semantic'), { recursive: true });

  writeFileSync(
    SETLIST_MD,
    `# Curated set

Handoff tracks on **/sound#dj-set** (\`lib/djSetlist.ts\` + \`public/dj-set/setlist.json\`).

Genre: ${genre}

${lines.join('\n')}

## URL

https://aileena.xyz/sound#dj-set
`,
  );

  writeFileSync(
    MUSIC_TASTE_PROMPT,
    `Techno（personal）：${genre.split(':').pop()?.trim() ?? genre}

当前 set（/sound#dj-set — updated ${date}）：
${setlist.tracks
  .map((t, i) => {
    const bpmKey = [t.bpm ? `${t.bpm} BPM` : null, t.key].filter(Boolean).join(', ');
    const artist = t.artist ?? '—';
    return `${i + 1}. TRACK ${t.id} — ${t.title} / ${artist}${bpmKey ? ` (${bpmKey})` : ''}`;
  })
  .join('\n')}

策展规则：用户链接原样收录；搜索曲找 Bleep/Beatport/Bandcamp；封面必须对发行。
`,
  );

  console.log(`[sync-carousel-evolve] ${setlist.tracks.length} curated tracks → setlist.md, music-taste.md`);
}

main();
