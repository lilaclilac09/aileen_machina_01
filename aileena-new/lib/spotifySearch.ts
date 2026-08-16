/**
 * Spotify Client Credentials search — server only.
 * Search/add-to-carousel metadata. Not a mixable audio source.
 *
 * Do not import this module from client components (uses Node Buffer + secrets).
 * Client code should import types/helpers from `spotifySearchShared`.
 */
import {
  mapSpotifyApiTrack,
  type SpotifyApiTrack,
  type SpotifySearchTrack,
} from './spotifySearchShared';

export type { SpotifyApiTrack, SpotifySearchTrack } from './spotifySearchShared';
export {
  isSpotifyDuplicate,
  mapSpotifyApiTrack,
  spotifyTrackKey,
} from './spotifySearchShared';

export function spotifySearchConfigured(): boolean {
  return Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}

type TokenCache = { access: string; exp: number };
let tokenCache: TokenCache | null = null;

async function clientCredentialsToken(): Promise<string> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error('not_configured');
  }
  const now = Date.now();
  if (tokenCache && tokenCache.exp - 15_000 > now) {
    return tokenCache.access;
  }

  const basic = Buffer.from(`${id}:${secret}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    console.error('[spotify] token request failed', { status: res.status });
    throw new Error('token_failed');
  }
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) {
    console.error('[spotify] token response missing access_token');
    throw new Error('token_failed');
  }
  tokenCache = {
    access: data.access_token,
    exp: now + Math.max(30, Number(data.expires_in) || 3600) * 1000,
  };
  return tokenCache.access;
}

export async function searchSpotifyTracks(q: string, limit = 8): Promise<SpotifySearchTrack[]> {
  const token = await clientCredentialsToken();
  const url = new URL('https://api.spotify.com/v1/search');
  url.searchParams.set('q', q);
  url.searchParams.set('type', 'track');
  url.searchParams.set('limit', String(Math.min(12, Math.max(1, limit))));
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    console.error('[spotify] search failed', { status: res.status });
    throw new Error('search_failed');
  }
  const data = (await res.json()) as { tracks?: { items?: SpotifyApiTrack[] } };
  const items = data.tracks?.items ?? [];
  const out: SpotifySearchTrack[] = [];
  const seen = new Set<string>();
  for (const raw of items) {
    const mapped = mapSpotifyApiTrack(raw);
    if (!mapped) continue;
    if (seen.has(mapped.spotifyId)) continue;
    seen.add(mapped.spotifyId);
    out.push(mapped);
  }
  return out;
}
