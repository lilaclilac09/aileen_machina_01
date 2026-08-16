/**
 * Persist user-added Spotify reference cards for the existing /sound carousel.
 * Catalogue tracks stay in djSetlist — this store is extras only.
 */
import type { DeckTrack } from './djSetlist';
import type { SpotifySearchTrack } from './spotifySearchShared';
import { isSpotifyDuplicate } from './spotifySearchShared';

const FALLBACK_THUMB =
  "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='300'%20height='300'%3E%3Crect%20width='300'%20height='300'%20fill='%230b0d10'/%3E%3Ctext%20x='150'%20y='172'%20font-family='monospace'%20font-size='44'%20fill='%2300a89d'%20fill-opacity='0.4'%20text-anchor='middle'%3E%E2%99%AA%3C/text%3E%3C/svg%3E";

export const SPOTIFY_CAROUSEL_STORAGE_KEY = 'aileena_sound_spotify_carousel_v1';
export const SPOTIFY_CAROUSEL_CHANGE_EVENT = 'aileena-spotify-carousel-change';

export function searchHitToDeckTrack(hit: SpotifySearchTrack): DeckTrack {
  return {
    id: hit.spotifyId,
    spotifyId: hit.spotifyId,
    title: hit.title,
    artist: hit.artists.join(' · ') || undefined,
    artists: hit.artists,
    album: hit.album || undefined,
    bpm: 120,
    key: '—',
    dur: Math.max(1, Math.round(hit.durationMs / 1000)) || 200,
    thumb: hit.albumArt || FALLBACK_THUMB,
    source: 'spotify',
    previewUrl: hit.previewUrl,
    externalUrl: hit.externalUrl,
  };
}

function isStoredDeckTrack(value: unknown): value is DeckTrack {
  if (!value || typeof value !== 'object') return false;
  const t = value as DeckTrack;
  return (
    t.source === 'spotify' &&
    typeof t.id === 'string' &&
    typeof t.title === 'string' &&
    typeof t.dur === 'number' &&
    typeof t.thumb === 'string'
  );
}

export function parseStoredSpotifyTracks(raw: string): DeckTrack[] {
  try {
    const parsed = JSON.parse(raw || '[]') as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: DeckTrack[] = [];
    const seen = new Set<string>();
    for (const row of parsed) {
      if (!isStoredDeckTrack(row)) continue;
      const key = (row.spotifyId || row.id).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ ...row, source: 'spotify', spotifyId: row.spotifyId || row.id });
    }
    return out;
  } catch {
    return [];
  }
}

export function readStoredSpotifyTracks(): DeckTrack[] {
  if (typeof window === 'undefined') return [];
  try {
    return parseStoredSpotifyTracks(window.localStorage.getItem(SPOTIFY_CAROUSEL_STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function getSpotifyCarouselSnapshot(): string {
  if (typeof window === 'undefined') return '[]';
  try {
    return window.localStorage.getItem(SPOTIFY_CAROUSEL_STORAGE_KEY) ?? '[]';
  } catch {
    return '[]';
  }
}

export function getSpotifyCarouselServerSnapshot(): string {
  return '[]';
}

export function subscribeSpotifyCarousel(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.key === SPOTIFY_CAROUSEL_STORAGE_KEY) onChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(SPOTIFY_CAROUSEL_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(SPOTIFY_CAROUSEL_CHANGE_EVENT, onChange);
  };
}

export function writeStoredSpotifyTracks(tracks: DeckTrack[]): void {
  if (typeof window === 'undefined') return;
  try {
    const extras = tracks.filter((t) => t.source === 'spotify');
    window.localStorage.setItem(SPOTIFY_CAROUSEL_STORAGE_KEY, JSON.stringify(extras));
    window.dispatchEvent(new Event(SPOTIFY_CAROUSEL_CHANGE_EVENT));
  } catch {
    /* private mode */
  }
}

export function addSpotifyHitToLibrary(
  library: DeckTrack[],
  hit: SpotifySearchTrack,
): { library: DeckTrack[]; added: DeckTrack | null; duplicate: boolean } {
  if (isSpotifyDuplicate(library, hit.spotifyId)) {
    return { library, added: null, duplicate: true };
  }
  const added = searchHitToDeckTrack(hit);
  return { library: [...library, added], added, duplicate: false };
}
