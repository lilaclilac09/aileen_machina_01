/**
 * Client-safe Spotify search types + helpers.
 * No tokens, no Client Secret, no Node Buffer.
 */

export type SpotifySearchTrack = {
  spotifyId: string;
  title: string;
  artists: string[];
  album: string;
  albumArt: string | null;
  durationMs: number;
  externalUrl: string;
  previewUrl: string | null;
  source: 'spotify';
};

export type SpotifyApiTrack = {
  id?: string;
  name?: string;
  duration_ms?: number;
  preview_url?: string | null;
  external_urls?: { spotify?: string };
  artists?: Array<{ name?: string }>;
  album?: {
    name?: string;
    images?: Array<{ url?: string }>;
  };
};

export function spotifyTrackKey(id: string | null | undefined): string {
  return (id || '').trim().toLowerCase();
}

export function isSpotifyDuplicate(
  library: Array<{ id: string; spotifyId?: string }>,
  spotifyId: string,
): boolean {
  const key = spotifyTrackKey(spotifyId);
  if (!key) return false;
  return library.some((t) => spotifyTrackKey(t.spotifyId) === key || spotifyTrackKey(t.id) === key);
}

export function mapSpotifyApiTrack(raw: SpotifyApiTrack): SpotifySearchTrack | null {
  const spotifyId = typeof raw.id === 'string' && /^[a-zA-Z0-9]{22}$/.test(raw.id) ? raw.id : '';
  const title = raw.name?.trim() || '';
  if (!spotifyId || !title) return null;
  const artists = (raw.artists ?? [])
    .map((a) => a.name?.trim() || '')
    .filter(Boolean);
  const images = raw.album?.images ?? [];
  const albumArt = images[1]?.url || images[0]?.url || null;
  return {
    spotifyId,
    title,
    artists,
    album: raw.album?.name?.trim() || '',
    albumArt,
    durationMs: Math.max(0, Number(raw.duration_ms) || 0),
    externalUrl: raw.external_urls?.spotify || `https://open.spotify.com/track/${spotifyId}`,
    previewUrl: raw.preview_url ?? null,
    source: 'spotify',
  };
}
