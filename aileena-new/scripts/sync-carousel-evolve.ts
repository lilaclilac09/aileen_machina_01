#!/usr/bin/env tsx
/**
 * Self-evolution: DJStation new tracks → /dj-set carousel + L3 memory.
 *
 *   pnpm sync:carousel-evolve
 *
 * Called automatically before sync:content-memory and on pnpm build.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const BRAIN = join(ROOT, 'aileena_second_brain');
const SETLIST_PATH = join(ROOT, 'public', 'dj-set', 'setlist.json');
const COVERS_DIR = join(ROOT, 'public', 'dj-set', 'assets', 'covers');
const DJ_STATION = join(ROOT, 'components', 'DJStation.tsx');
const STATE_PATH = join(BRAIN, 'memories', 'semantic', 'carousel-sync-state.json');
const SETLIST_MD = join(BRAIN, 'memories', 'semantic', 'setlist.md');
const MUSIC_TASTE_PROMPT = join(BRAIN, 'prompts', 'music-taste.md');
const EVOLVE_LOG = join(BRAIN, 'memories', 'semantic', 'self-evolution-log.md');
const EPISODIC = join(BRAIN, 'memories', 'episodic');

/** How many tail slots in DJStation to scan for new adds (addmusic appends to end). */
const SYNC_TAIL = 14;

type PlayerTrack = {
  spotifyId: string;
  title: string;
  bpm: number;
  key: string;
  dur: number;
  thumb: string;
};

type SetlistTrack = {
  id: string;
  spotifyId?: string;
  title: string;
  artist?: string;
  album?: string;
  bpm?: number | null;
  key?: string | null;
  durationSec?: number | null;
  cover?: string;
  note?: string;
};

type SetlistFile = {
  title?: string;
  genre?: string;
  curation?: string;
  tracks: SetlistTrack[];
};

type SyncState = {
  knownSpotifyIds: string[];
  lastRun: string;
};

function readText(path: string): string {
  return readFileSync(path, 'utf8');
}

function normalizeTitle(t: string): string {
  return t.toLowerCase().replace(/\s+/g, ' ').trim();
}

function parsePlayerTracks(): PlayerTrack[] {
  return parsePlayerTracksLineByLine(readText(DJ_STATION));
}

function parsePlayerTracksLineByLine(src: string): PlayerTrack[] {
  const lines = src.split('\n');
  const out: PlayerTrack[] = [];
  for (const line of lines) {
    const idM = line.match(/id:\s*['"]([^'"]+)['"]/);
    if (!idM) continue;
    const titleM = line.match(/title:\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')/);
    const bpmM = line.match(/bpm:\s*(\d+)/);
    const keyM = line.match(/key:\s*['"]([^'"]+)['"]/);
    const durM = line.match(/dur:\s*(\d+)/);
    const thumbM = line.match(/thumb:\s*(PLACEHOLDER_THUMB|'([^']*)'|"([^"]*)")/);
    if (!titleM || !bpmM || !keyM || !durM) continue;
    const title = (titleM[1] ?? titleM[2] ?? '').replace(/\\'/g, "'").replace(/\\"/g, '"');
    let thumb = 'PLACEHOLDER_THUMB';
    if (thumbM) {
      thumb = thumbM[1] === 'PLACEHOLDER_THUMB' ? 'PLACEHOLDER_THUMB' : (thumbM[2] ?? thumbM[3] ?? '');
    }
    out.push({
      spotifyId: idM[1],
      title,
      bpm: Number(bpmM[1]),
      key: keyM[1],
      dur: Number(durM[1]),
      thumb,
    });
  }
  return out;
}

function loadSetlist(): SetlistFile {
  return JSON.parse(readText(SETLIST_PATH)) as SetlistFile;
}

function loadState(): SyncState {
  if (!existsSync(STATE_PATH)) {
    return { knownSpotifyIds: [], lastRun: '' };
  }
  return JSON.parse(readText(STATE_PATH)) as SyncState;
}

function saveState(state: SyncState): void {
  mkdirSync(join(BRAIN, 'memories', 'semantic'), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');
}

function makeCarouselId(spotifyId: string, title: string): string {
  const fromId = spotifyId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
  if (fromId.length >= 4) return fromId;
  const fromTitle = title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
  return fromTitle || 'TRACK';
}

function isInSetlist(track: SetlistTrack, player: PlayerTrack): boolean {
  if (track.spotifyId && track.spotifyId === player.spotifyId) return true;
  return normalizeTitle(track.title) === normalizeTitle(player.title);
}

function coverAccent(title: string): string {
  const hues = [170, 190, 210, 330, 280];
  const h = [...title].reduce((a, c) => a + c.charCodeAt(0), 0) % hues.length;
  return `hsl(${hues[h]}, 65%, 65%)`;
}

function writeCoverSvg(id: string, title: string): string {
  const file = `${id.toLowerCase()}.svg`;
  const path = join(COVERS_DIR, file);
  if (existsSync(path)) return `assets/covers/${file}`;
  const accent = coverAccent(title);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#0b0d10"/>
  <circle cx="200" cy="200" r="150" fill="none" stroke="${accent}" stroke-opacity="0.4" stroke-width="2"/>
  <text x="200" y="188" fill="${accent}" font-family="monospace" font-size="20" text-anchor="middle">${id}</text>
  <text x="200" y="220" fill="#7f90a1" font-family="sans-serif" font-size="14" text-anchor="middle">${title.replace(/&/g, '&amp;').replace(/</g, '&lt;').slice(0, 28)}</text>
</svg>
`;
  mkdirSync(COVERS_DIR, { recursive: true });
  writeFileSync(path, svg);
  return `assets/covers/${file}`;
}

function pickNewTracks(player: PlayerTrack[], setlist: SetlistTrack[], state: SyncState): PlayerTrack[] {
  const candidates = new Set<PlayerTrack>();

  // Tail of DJStation = where /addmusic appends
  for (const p of player.slice(-SYNC_TAIL)) {
    if (!setlist.some((t) => isInSetlist(t, p))) candidates.add(p);
  }

  // After first sync: any brand-new spotify id anywhere in the deck
  if (state.knownSpotifyIds.length > 0) {
    for (const p of player) {
      if (state.knownSpotifyIds.includes(p.spotifyId)) continue;
      if (!setlist.some((t) => isInSetlist(t, p))) candidates.add(p);
    }
  }

  return [...candidates];
}

function evolveSetlistMarkdown(setlist: SetlistFile, genre: string): void {
  const lines = setlist.tracks.map((t, i) => {
    const meta = [
      t.bpm ? `${t.bpm} BPM` : null,
      t.key ? t.key : null,
      t.spotifyId ? `spotify:${t.spotifyId}` : null,
      t.note?.includes('Auto-synced') ? 'auto-evolved' : 'curated',
    ]
      .filter(Boolean)
      .join(', ');
    const artist = t.artist ?? '—';
    return `${i + 1}. **TRACK ${t.id}** — ${t.title} / ${artist}${meta ? ` (${meta})` : ''}`;
  });

  const md = `# Curated set — auto-evolved

Synced from \`public/dj-set/setlist.json\` by \`pnpm sync:carousel-evolve\`.
Hand-curated entries are preserved; new \`/addmusic\` / DJStation tracks append automatically.

Genre: ${genre}

${lines.join('\n')}

## Carousel URL

https://aileena.xyz/dj-set/
`;
  writeFileSync(SETLIST_MD, md);
}

function evolveMusicTastePrompt(setlist: SetlistFile, genre: string): void {
  const header = `Techno（personal）：${genre.split(':').pop()?.trim() ?? genre}

当前 set（setlist.json — self-evolved ${new Date().toISOString().slice(0, 10)}）：`;

  const numbered = setlist.tracks.map((t, i) => {
    const bpmKey = [t.bpm ? `${t.bpm} BPM` : null, t.key].filter(Boolean).join(', ');
    const artist = t.artist ?? 'Machina deck';
    const suffix = bpmKey ? ` (${bpmKey})` : '';
    return `${i + 1}. TRACK ${t.id} — ${t.title} / ${artist}${suffix}`;
  });

  const footer = `
策展规则：用户链接原样收录；搜索曲找 Bleep/Beatport/Bandcamp；封面必须对发行。
自进化：DJStation 新增曲目 → carousel + 本文件由 sync:carousel-evolve 更新。
`;

  writeFileSync(MUSIC_TASTE_PROMPT, header + '\n' + numbered.join('\n') + footer);
}

function appendEvolutionLog(date: string, added: PlayerTrack[]): void {
  const line = `- ${date}: carousel +${added.length} track(s) — ${added.map((t) => t.title).join(', ') || 'no new tracks'}\n`;
  if (!existsSync(EVOLVE_LOG)) {
    writeFileSync(
      EVOLVE_LOG,
      `# Self-evolution log\n\nMachina auto-updates carousel + memory when DJStation gains tracks.\n\n`,
    );
  }
  writeFileSync(EVOLVE_LOG, readText(EVOLVE_LOG) + line);
}

function writeEvolveEpisodic(date: string, added: PlayerTrack[], setlist: SetlistFile): void {
  if (!added.length) return;
  mkdirSync(EPISODIC, { recursive: true });
  const path = join(EPISODIC, `evolve-carousel-${date}.md`);
  const body = `# Carousel self-evolution — ${date}

Auto-promoted from \`DJStation.tsx\` → \`public/dj-set/setlist.json\` + semantic memory.

## New tracks

${added
  .map(
    (t) =>
      `- **${t.title}** (spotify:${t.spotifyId}) — BPM ${t.bpm}, KEY ${t.key}, ${Math.floor(t.dur / 60)}:${String(t.dur % 60).padStart(2, '0')}`,
  )
  .join('\n')}

## Full carousel (${setlist.tracks.length} tracks)

${setlist.tracks.map((t) => `- TRACK ${t.id}: ${t.title}`).join('\n')}

## Agent note

Visitors asking about her **latest songs** or **DJ set** should use \`searchMemories\` — \`latest-content.md\` and \`setlist.md\` reflect this sync.
`;
  writeFileSync(path, body);
}

export function syncCarouselAndEvolve(): { added: PlayerTrack[]; total: number } {
  const player = parsePlayerTracksLineByLine(readText(DJ_STATION));
  const setlist = loadSetlist();
  const state = loadState();
  const toAdd = pickNewTracks(player, setlist.tracks, state);

  const usedIds = new Set(setlist.tracks.map((t) => t.id));
  for (const p of toAdd) {
    let id = makeCarouselId(p.spotifyId, p.title);
    let n = 0;
    while (usedIds.has(id)) {
      n++;
      id = makeCarouselId(p.spotifyId, p.title).slice(0, 4) + String(n).padStart(2, '0');
    }
    usedIds.add(id);

    const cover =
      p.thumb && p.thumb !== 'PLACEHOLDER_THUMB' && p.thumb.startsWith('http')
        ? p.thumb
        : writeCoverSvg(id, p.title);

    setlist.tracks.push({
      id,
      spotifyId: p.spotifyId,
      title: p.title,
      artist: 'Machina deck',
      bpm: p.bpm,
      key: p.key,
      durationSec: p.dur,
      cover,
      note: 'Auto-synced from DJStation (self-evolution)',
    });
  }

  if (toAdd.length) {
    writeFileSync(SETLIST_PATH, JSON.stringify(setlist, null, 2) + '\n');
  }

  const genre = setlist.genre ?? '';
  evolveSetlistMarkdown(setlist, genre);
  evolveMusicTastePrompt(setlist, genre);

  const date = new Date().toISOString().slice(0, 10);
  if (toAdd.length) {
    appendEvolutionLog(date, toAdd);
    writeEvolveEpisodic(date, toAdd, setlist);
  }

  saveState({
    knownSpotifyIds: player.map((p) => p.spotifyId),
    lastRun: new Date().toISOString(),
  });

  return { added: toAdd, total: setlist.tracks.length };
}

function main() {
  const { added, total } = syncCarouselAndEvolve();
  console.log(`[sync-carousel-evolve] carousel ${total} tracks (+${added.length} new)`);
  for (const t of added) {
    console.log(`  + ${t.title} (${t.spotifyId})`);
  }
  if (added.length) {
    console.log(`[sync-carousel-evolve] → ${SETLIST_PATH}`);
    console.log(`[sync-carousel-evolve] memory → setlist.md, music-taste.md, evolve episodic`);
  }
}

main();
