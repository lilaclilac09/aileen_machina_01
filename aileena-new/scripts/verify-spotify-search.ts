#!/usr/bin/env tsx
/**
 * Unit checks for Spotify search → carousel mapping / dedupe / secret boundary.
 * Does not call the live Spotify API.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { allDeckTracks } from '../lib/djSetlist';
import {
  addSpotifyHitToLibrary,
  searchHitToDeckTrack,
} from '../lib/spotifyCarouselStore';
import {
  isSpotifyDuplicate,
  mapSpotifyApiTrack,
} from '../lib/spotifySearchShared';

type Check = { name: string; ok: boolean; detail?: string };

const PREVIEW_ID = '7ouMYWpwJ422jRcDASZB7P';
const NO_PREVIEW_ID = '4VqPOruhp5EdPBeR92t6lQ';

function check(name: string, ok: boolean, detail?: string): Check {
  return { name, ok, detail };
}

function mappedPreview() {
  return mapSpotifyApiTrack({
    id: PREVIEW_ID,
    name: 'Knights of Cydonia',
    duration_ms: 366_000,
    preview_url: 'https://p.scdn.co/mp3-preview/example',
    external_urls: { spotify: `https://open.spotify.com/track/${PREVIEW_ID}` },
    artists: [{ name: 'Muse' }],
    album: {
      name: 'Black Holes and Revelations',
      images: [{ url: 'https://example.com/large.jpg' }, { url: 'https://example.com/mid.jpg' }],
    },
  });
}

function mappedNoPreview() {
  return mapSpotifyApiTrack({
    id: NO_PREVIEW_ID,
    name: 'Time',
    duration_ms: 413_000,
    preview_url: null,
    artists: [{ name: 'Pink Floyd' }],
    album: { name: 'The Dark Side of the Moon', images: [] },
  });
}

function secretBoundary(): Check[] {
  const root = join(process.cwd());
  const clientFiles = [
    'components/SpotifySearchAdd.tsx',
    'components/DJStation.tsx',
    'components/TrackLibraryBrowser.tsx',
    'lib/spotifyCarouselStore.ts',
    'lib/spotifySearchShared.ts',
  ];
  const out: Check[] = [];
  for (const rel of clientFiles) {
    const src = readFileSync(join(root, rel), 'utf8');
    const mentionsSecret = /SPOTIFY_CLIENT_SECRET/.test(src);
    const mentionsPublic = /NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET/.test(src);
    out.push(check(
      `${rel} does not mention SPOTIFY_CLIENT_SECRET`,
      !mentionsSecret && !mentionsPublic,
      mentionsSecret ? 'secret identifier present' : 'ok',
    ));
  }
  const searchUi = readFileSync(join(root, 'components/SpotifySearchAdd.tsx'), 'utf8');
  const resultsBlock = searchUi.split('data-testid="spotify-search-results"')[1] ?? '';
  out.push(check(
    'search results render in-flow (not an absolute overlay under the page)',
    resultsBlock.includes("position: 'relative'") && !resultsBlock.includes("position: 'absolute'"),
  ));
  const server = readFileSync(join(root, 'lib/spotifySearch.ts'), 'utf8');
  out.push(check(
    'server search uses Client Credentials env (not NEXT_PUBLIC)',
    /SPOTIFY_CLIENT_SECRET/.test(server) && !/NEXT_PUBLIC_SPOTIFY/.test(server),
  ));
  out.push(check(
    'server search does not log token values',
    !/console\.(log|info|debug|error)\([^)]*data\.access_token/.test(server)
      && !/console\.(log|info|debug|error)\([^)]*tokenCache\.access/.test(server)
      && !/console\.(log|info|debug|error)\(\s*token\b/.test(server),
  ));
  return out;
}

function run(): Check[] {
  const checks: Check[] = [];
  const preview = mappedPreview();
  checks.push(check('map preview track', Boolean(preview && preview.spotifyId === PREVIEW_ID && preview.previewUrl)));
  checks.push(check('map prefers mid-size art', preview?.albumArt === 'https://example.com/mid.jpg'));
  checks.push(check('map artists + album + source', preview?.artists[0] === 'Muse' && preview?.album.includes('Black') && preview?.source === 'spotify'));

  const noPrev = mappedNoPreview();
  checks.push(check('map no preview_url stays null', noPrev?.previewUrl === null));
  checks.push(check('map no preview still has external URL', Boolean(noPrev?.externalUrl.includes(NO_PREVIEW_ID))));

  checks.push(check('reject short id', mapSpotifyApiTrack({ id: 'short', name: 'x' }) === null));
  checks.push(check('reject missing title', mapSpotifyApiTrack({ id: PREVIEW_ID, name: '  ' }) === null));

  const catalogue = allDeckTracks();
  const daydream = catalogue.find((t) => t.spotifyId === '69w5X6uTrOaWM32IetSzvO' || t.id === 'DAYDRM');
  checks.push(check('catalogue includes Daydreaming spotify id', Boolean(daydream)));
  if (daydream?.spotifyId) {
    checks.push(check(
      'duplicate vs catalogue spotify id',
      isSpotifyDuplicate(catalogue, daydream.spotifyId),
    ));
  }

  if (preview) {
    const deck = searchHitToDeckTrack(preview);
    checks.push(check('deck track source=spotify', deck.source === 'spotify'));
    checks.push(check('deck track keeps preview + external', deck.previewUrl === preview.previewUrl && deck.externalUrl === preview.externalUrl));
    checks.push(check('deck duration seconds', deck.dur === 366));
    const first = addSpotifyHitToLibrary(catalogue, preview);
    checks.push(check('add new hit', !first.duplicate && first.added?.id === PREVIEW_ID));
    const second = addSpotifyHitToLibrary(first.library, preview);
    checks.push(check('second add is duplicate', second.duplicate && second.added === null));
  }

  if (noPrev) {
    const deck = searchHitToDeckTrack(noPrev);
    checks.push(check('no-preview deck is still addable as reference', deck.source === 'spotify' && !deck.previewUrl));
  }

  checks.push(...secretBoundary());
  return checks;
}

const checks = run();
const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? 'ok' : 'FAIL'}  ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
}
if (failed.length) {
  console.error(`\n${failed.length}/${checks.length} failed`);
  process.exit(1);
}
console.log(`\n${checks.length} checks passed`);
