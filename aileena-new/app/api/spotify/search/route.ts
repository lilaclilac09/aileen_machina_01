import { withApi } from '../../../../lib/api/handler';
import { DATA_RATE } from '../../../../lib/api/ratelimit';
import { err, ok } from '../../../../lib/api/jsonResp';
import {
  searchSpotifyTracks,
  spotifySearchConfigured,
} from '../../../../lib/spotifySearch';

export const runtime = 'nodejs';

export const GET = withApi({ rate: DATA_RATE, scope: 'spotify-search' }, async (req) => {
  if (!spotifySearchConfigured()) {
    console.error('[spotify] search called but SPOTIFY_CLIENT_ID/SECRET missing');
    return err(
      'not_configured',
      'Spotify search is not configured.',
      503,
    );
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (q.length < 2) {
    return err('bad_request', 'Query param `q` is required (min 2 chars).', 400);
  }

  try {
    const tracks = await searchSpotifyTracks(q, 8);
    return ok({ configured: true, q, count: tracks.length, tracks });
  } catch (e) {
    const code = e instanceof Error ? e.message : 'search_failed';
    if (code === 'not_configured') {
      return err('not_configured', 'Spotify search is not configured.', 503);
    }
    return err('search_failed', 'Spotify search failed. Try again shortly.', 502);
  }
});

export const OPTIONS = GET;
