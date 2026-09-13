#!/usr/bin/env tsx
/**
 * Watch / listening shelf: films include Ladies First (2026); books + videos are photo-real spines.
 * Run: pnpm verify:watch-shelf
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DOCUMENTARY_RECS,
  FILM_RECS,
  SHELF_ITEMS,
  VIDEO_RECS,
  resolveShelfHash,
  shelfRowsInSection,
} from '../lib/watchListeningShelf';

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), 'utf8');
}

function main() {
  const watch = SHELF_ITEMS.filter((item) => item.section === 'watch');
  const videos = SHELF_ITEMS.filter((item) => item.row === 'video');
  const notes = SHELF_ITEMS.filter((item) => item.row === 'notes');
  const expectedWatch = [
    ...DOCUMENTARY_RECS.map((item) => item.shelfTitle),
    ...FILM_RECS.map((item) => item.shelfTitle),
  ];

  assert('watch starts with Joan Didion', watch[0]?.id === 'joan-didion', watch[0]?.id);
  assert(
    'watch order is docs then films',
    watch.map((item) => item.title).join('|') === expectedWatch.join('|'),
  );
  const ladies = watch.find((item) => item.id === 'ladies-first');
  assert(
    'Ladies First 2026 is the last film poster',
    ladies?.coverKind === 'poster' &&
      ladies.cover === '/shelf/ladies-first.jpg' &&
      watch[watch.length - 1]?.id === 'ladies-first',
    watch[watch.length - 1]?.id,
  );
  assert('Ladies First note stays empty for later', ladies?.note === '');
  assert(
    'video ridge uses photo-real spines',
    videos.length === VIDEO_RECS.length &&
      videos.every(
        (item) => item.coverKind === 'spine' && typeof item.cover === 'string' && item.cover.includes('spine-video'),
      ),
  );
  assert('video notes stay empty for later', videos.every((item) => item.note === ''));
  assert(
    'book ridge uses photo-real spines',
    notes.length >= 4 && notes.every((item) => item.coverKind === 'spine' && Boolean(item.cover)),
  );
  assert(
    'films stay posters, not spines',
    SHELF_ITEMS.filter((item) => item.section === 'watch').every((item) => item.coverKind === 'poster'),
  );
  assert('#watch stays Joan Didion', resolveShelfHash('#watch') === 'joan-didion');
  assert('#films stays Blue', resolveShelfHash('#films') === 'blue-is-the-warmest-color');
  assert('#video lands on first spine', resolveShelfHash('#video') === 'cache');

  const watchRows = shelfRowsInSection('watch').map((row) => row.row).join(',');
  const readRows = shelfRowsInSection('read').map((row) => row.row).join(',');
  assert('watch is one row', watchRows === 'watch');
  assert('read rows are notes then video', readRows === 'notes,video');

  for (const item of SHELF_ITEMS) {
    if (!item.cover) continue;
    const rel = item.cover.replace(/^\//, '');
    assert(`${item.cover} exists`, existsSync(join(process.cwd(), 'public', rel.replace(/^public\//, ''))), rel);
  }

  const ui = read('app/blog/watch-listening-shelf/WatchShelf.tsx');
  const css = read('app/blog/watch-listening-shelf/watch-shelf.css');
  assert('covers stay object-fit contain', /objectFit:\s*'contain'/.test(ui) && !/objectFit:\s*'cover'/.test(ui));
  assert('css covers stay contain', /object-fit:\s*contain/.test(css) && !/object-fit:\s*cover/.test(css));
  assert('spine photos sit in a fixed ridge slot', /\.watch-obj\.is-spine[\s\S]*height:\s*96px/.test(css));
  assert('later-note placeholder exists', /drop a note later/.test(ui));

  const failed = checks.filter((c) => !c.ok);
  console.log(`\nResult: ${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) process.exit(1);
}

main();
