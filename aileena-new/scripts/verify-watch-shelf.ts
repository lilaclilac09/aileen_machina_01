#!/usr/bin/env tsx
/**
 * Watch / listening shelf: films first, video photo ridge, notes left empty.
 * Run: pnpm verify:watch-shelf
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
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
  const films = watch.filter((item) => item.row === 'films');
  const docs = watch.filter((item) => item.row === 'docs');
  const videos = SHELF_ITEMS.filter((item) => item.row === 'video');
  const notes = SHELF_ITEMS.filter((item) => item.row === 'notes');

  assert('first watch item is Blue Is the Warmest Color', watch[0]?.id === 'blue-is-the-warmest-color', watch[0]?.id);
  assert('films row is laid before docs', films.length > 0 && docs.length > 0 && watch[0]?.row === 'films');
  assert(
    'film ridge matches FILM_RECS order',
    films.map((item) => item.title).join('|') === FILM_RECS.map((item) => item.shelfTitle).join('|'),
  );
  assert('video ridge has still covers', videos.length === VIDEO_RECS.length && videos.every((item) => item.coverKind === 'still' && item.cover));
  assert('video notes are empty for later input', videos.every((item) => item.note === ''));
  assert('read notes stay spines', notes.length >= 4 && notes.every((item) => item.object === 'spine'));
  assert('#films and #watch land on Blue', resolveShelfHash('#films') === 'blue-is-the-warmest-color' && resolveShelfHash('#watch') === 'blue-is-the-warmest-color');
  assert('#video lands on first still', resolveShelfHash('#video') === 'cache');

  const watchRows = shelfRowsInSection('watch').map((row) => row.row).join(',');
  const readRows = shelfRowsInSection('read').map((row) => row.row).join(',');
  assert('watch rows are films then docs', watchRows === 'films,docs');
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
  assert('later-note placeholder exists', /drop a note later/.test(ui));

  const failed = checks.filter((c) => !c.ok);
  console.log(`\nResult: ${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) process.exit(1);
}

main();
