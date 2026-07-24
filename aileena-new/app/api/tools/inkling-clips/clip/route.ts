import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkRateLimit, DATA_RATE } from '../../../../../lib/api/ratelimit';
import { getInklingJob } from '../../../../../lib/inkling/jobs';
import { findSourceMedia, renderClipToBuffer } from '../../../../../lib/inkling/media';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function GET(req: Request) {
  const rl = checkRateLimit(req, DATA_RATE, 'inkling-clips-download');
  if (!rl.ok) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  const url = new URL(req.url);
  const jobId = url.searchParams.get('jobId');
  const indexRaw = url.searchParams.get('index');
  if (!jobId || indexRaw === null) {
    return new Response('jobId and index required', { status: 400 });
  }

  const index = Number(indexRaw);
  if (!Number.isInteger(index) || index < 0) {
    return new Response('Invalid index', { status: 400 });
  }

  const job = await getInklingJob(jobId);
  if (!job || job.status !== 'done' || !job.result) {
    return new Response('Clip not ready', { status: 404 });
  }

  const candidate = job.result.candidates[index];
  if (!candidate) return new Response('Clip not found', { status: 404 });

  const workDir = join('/tmp', 'inkling-clips', jobId);
  const rendered = job.result.clips.find((c) => c.index === index);
  if (rendered && existsSync(rendered.path)) {
    const buf = readFileSync(rendered.path);
    const type = rendered.filename.endsWith('.m4a') ? 'audio/mp4' : 'video/mp4';
    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': type,
        'Content-Disposition': `attachment; filename="${rendered.filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  }

  try {
    const sourcePath = findSourceMedia(workDir);
    const start = candidate.absoluteStart_s ?? candidate.start_s;
    const end = candidate.absoluteEnd_s ?? candidate.end_s;
    const audioOnly = job.result.clips[0]?.filename.endsWith('.m4a') ?? false;
    const buf = renderClipToBuffer(sourcePath, start, end, audioOnly);
    const filename = `${index + 1}-clip.${audioOnly ? 'm4a' : 'mp4'}`;
    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': audioOnly ? 'audio/mp4' : 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Render failed';
    return new Response(msg, { status: 500 });
  }
}
