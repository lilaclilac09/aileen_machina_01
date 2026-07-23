import { err, ok } from '../../../../../lib/api/jsonResp';
import { getInklingConfig } from '../../../../../lib/inkling/client';
import { checkMediaDeps } from '../../../../../lib/inkling/media';

export const runtime = 'nodejs';

/**
 * Lightweight readiness probe for the public Audio Clipping UI.
 * Does not start a job — only reports whether Run can work on this host.
 */
export async function GET() {
  const media = { ok: false as boolean, error: null as string | null };
  const api = { ok: false as boolean, error: null as string | null };

  try {
    checkMediaDeps();
    media.ok = true;
  } catch (e) {
    media.error = e instanceof Error ? e.message : String(e);
  }

  try {
    getInklingConfig();
    api.ok = true;
  } catch (e) {
    api.error = e instanceof Error ? e.message : String(e);
  }

  const ready = media.ok && api.ok;
  return ok({
    ready,
    media,
    api,
    hint: ready
      ? 'Browser Run is available on this host.'
      : 'Browser Run needs yt-dlp + ffmpeg + TOGETHER_API_KEY (or INKLING_API_KEY) on the server. Use CLI or docker-compose until then.',
  });
}
