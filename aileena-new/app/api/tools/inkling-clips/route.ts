import { after } from 'next/server';
import { join } from 'node:path';
import { z } from 'zod';
import { err, ok } from '../../../../lib/api/jsonResp';
import { checkRateLimit, TOOLS_INKLING_RATE } from '../../../../lib/api/ratelimit';
import { slugFromYoutubeUrl } from '../../../../lib/inkling/clips';
import {
  createInklingJob,
  createJobId,
  getInklingJob,
  publicJobView,
  updateInklingJob,
} from '../../../../lib/inkling/jobs';
import { checkMediaDeps } from '../../../../lib/inkling/media';
import { runInklingClipPipeline } from '../../../../lib/inkling/pipeline';
import { getInklingConfig } from '../../../../lib/inkling/client';

export const runtime = 'nodejs';
export const maxDuration = 300;

const BodySchema = z.object({
  url: z.string().min(8),
  mode: z.enum(['best', 'query']).default('best'),
  query: z.string().min(1).optional(),
  bestCount: z.number().int().min(1).max(8).default(3),
  dryRun: z.boolean().default(false),
  audioOnly: z.boolean().default(false),
});

function rateLimitOrError(req: Request, scope: string) {
  const rl = checkRateLimit(req, TOOLS_INKLING_RATE, scope);
  if (!rl.ok) {
    return err(
      rl.reason === 'burst' ? 'rate_limit_burst' : 'rate_limit_daily',
      rl.reason === 'burst'
        ? `Too many clip jobs. Try again in ${rl.retryAfterSec}s.`
        : `Daily clip limit reached. Resets in ~${Math.round(rl.retryAfterSec / 3600)}h.`,
      429,
      { 'Retry-After': String(rl.retryAfterSec) },
    );
  }
  return null;
}

async function runJob(jobId: string, input: z.infer<typeof BodySchema>) {
  await updateInklingJob(jobId, {
    status: 'running',
    progress: { phase: 'download', message: 'Starting pipeline', progress: 1 },
  });

  const workDir = join('/tmp', 'inkling-clips', jobId);

  try {
    const result = await runInklingClipPipeline({
      url: input.url,
      mode: input.mode,
      bestCount: input.bestCount,
      query: input.query,
      batchSeconds: 900,
      overlapSeconds: 30,
      padSeconds: 20,
      dryRun: input.dryRun,
      audioOnly: input.audioOnly,
      workDir,
      onProgress: async (progress) => {
        await updateInklingJob(jobId, { status: 'running', progress });
      },
    });

    await updateInklingJob(jobId, {
      status: 'done',
      progress: { phase: 'done', message: 'Complete', progress: 100 },
      result,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await updateInklingJob(jobId, {
      status: 'error',
      progress: { phase: 'error', message, progress: 100 },
      error: message,
    });
  }
}

export async function POST(req: Request) {
  const limited = rateLimitOrError(req, 'inkling-clips-start');
  if (limited) return limited;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.errors.map((x) => x.message).join('; ') : 'Invalid JSON';
    return err('bad_request', msg, 400);
  }

  if (body.mode === 'query' && !body.query) {
    return err('bad_request', 'query is required when mode=query', 400);
  }

  try {
    slugFromYoutubeUrl(body.url);
  } catch {
    return err('bad_request', 'Could not parse YouTube URL', 400);
  }

  try {
    checkMediaDeps();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Media tools unavailable';
    return err('service_unavailable', msg, 503);
  }

  try {
    getInklingConfig();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Inkling API not configured';
    return err('service_unavailable', msg, 503);
  }

  const jobId = createJobId();
  await createInklingJob({
    id: jobId,
    url: body.url,
    mode: body.mode,
    query: body.query,
    bestCount: body.bestCount,
  });

  after(async () => {
    await runJob(jobId, body);
  });

  return ok({ jobId, status: 'queued' });
}

export async function GET(req: Request) {
  const limited = rateLimitOrError(req, 'inkling-clips-poll');
  if (limited) return limited;

  const jobId = new URL(req.url).searchParams.get('jobId');
  if (!jobId) return err('bad_request', 'jobId query param required', 400);

  const job = await getInklingJob(jobId);
  if (!job) return err('not_found', 'Job not found or expired', 404);

  return ok(publicJobView(job));
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
