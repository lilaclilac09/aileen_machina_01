import { ok } from '../../../../../lib/api/jsonResp';
import { hasInklingApiKey } from '../../../../../lib/inkling/localClips';
import { checkMediaDeps } from '../../../../../lib/inkling/media';

export const runtime = 'nodejs';

/**
 * Lightweight readiness probe for the public Audio Clipping UI.
 * Does not start a job — only reports whether Run can work on this host.
 * Free local mode needs media only; Inkling mode also needs an API key.
 */
export async function GET() {
  const media = { ok: false as boolean, error: null as string | null };
  const api = {
    ok: hasInklingApiKey(),
    error: null as string | null,
  };
  if (!api.ok) {
    api.error = 'No TOGETHER_API_KEY / INKLING_API_KEY — free local heuristic will be used.';
  }

  try {
    checkMediaDeps();
    media.ok = true;
  } catch (e) {
    media.error = e instanceof Error ? e.message : String(e);
  }

  const engine = api.ok ? ('inkling' as const) : ('local' as const);
  const ready = media.ok;
  return ok({
    ready,
    engine,
    media,
    api,
    hint: !media.ok
      ? 'Browser Run needs yt-dlp + ffmpeg + ffprobe on the server. Use CLI or docker-compose until then.'
      : api.ok
        ? 'Browser Run is available (Inkling).'
        : 'Browser Run is available in free local mode (silence gaps — no Together credits).',
  });
}
