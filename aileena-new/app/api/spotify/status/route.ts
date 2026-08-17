import { spotifySearchConfigured } from '../../../../lib/spotifySearch';

export const runtime = 'nodejs';

/** Public config probe — never returns secrets. */
export async function GET() {
  return Response.json(
    { ok: true, configured: spotifySearchConfigured() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
