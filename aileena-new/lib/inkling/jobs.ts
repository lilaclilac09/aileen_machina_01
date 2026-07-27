import { Redis } from '@upstash/redis';
import type { ClipCandidate } from './clips';
import type { PipelinePhase, PipelineProgress, PipelineResult } from './pipeline';

export type InklingJobStatus = 'queued' | 'running' | 'done' | 'error';

export type InklingJob = {
  id: string;
  status: InklingJobStatus;
  progress: PipelineProgress;
  url: string;
  mode: 'best' | 'query';
  query?: string;
  bestCount: number;
  result?: PipelineResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

const JOB_TTL_SEC = 86_400;
const KEY_PREFIX = 'inkling:job:';

type JobStore = {
  get(id: string): Promise<InklingJob | null>;
  set(job: InklingJob): Promise<void>;
};

declare global {
  var __inklingJobStore: Map<string, InklingJob> | undefined;
}

function memoryStore(): JobStore {
  const map = globalThis.__inklingJobStore ?? new Map<string, InklingJob>();
  globalThis.__inklingJobStore = map;
  return {
    async get(id) {
      return map.get(id) ?? null;
    },
    async set(job) {
      map.set(job.id, job);
    },
  };
}

function redisStore(): JobStore | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const redis = new Redis({ url, token });
  return {
    async get(id) {
      return (await redis.get<InklingJob>(`${KEY_PREFIX}${id}`)) ?? null;
    },
    async set(job) {
      await redis.set(`${KEY_PREFIX}${job.id}`, job, { ex: JOB_TTL_SEC });
    },
  };
}

function store(): JobStore {
  return redisStore() ?? memoryStore();
}

export function createJobId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createInklingJob(input: {
  id: string;
  url: string;
  mode: 'best' | 'query';
  query?: string;
  bestCount: number;
}): Promise<InklingJob> {
  const now = new Date().toISOString();
  const job: InklingJob = {
    id: input.id,
    status: 'queued',
    progress: { phase: 'download', message: 'Queued', progress: 0 },
    url: input.url,
    mode: input.mode,
    query: input.query,
    bestCount: input.bestCount,
    createdAt: now,
    updatedAt: now,
  };
  await store().set(job);
  return job;
}

export async function getInklingJob(id: string): Promise<InklingJob | null> {
  return store().get(id);
}

export async function updateInklingJob(
  id: string,
  patch: Partial<Pick<InklingJob, 'status' | 'progress' | 'result' | 'error'>>,
): Promise<InklingJob | null> {
  const current = await getInklingJob(id);
  if (!current) return null;
  const next: InklingJob = {
    ...current,
    ...patch,
    progress: patch.progress ?? current.progress,
    updatedAt: new Date().toISOString(),
  };
  await store().set(next);
  return next;
}

export function formatTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function youtubeWatchAt(url: string, start_s: number): string {
  const id =
    url.match(/(?:v=|\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/)?.[1] ??
    url.match(/^([A-Za-z0-9_-]{6,})$/)?.[1];
  if (!id) return url;
  return `https://www.youtube.com/watch?v=${id}&t=${Math.floor(start_s)}s`;
}

export type PublicCandidate = ClipCandidate & {
  index: number;
  startLabel: string;
  endLabel: string;
  durationLabel: string;
  youtubeAt: string;
  downloadUrl: string;
};

export function toPublicCandidates(jobId: string, result: PipelineResult): PublicCandidate[] {
  return result.candidates.map((c, index) => {
    const start = c.absoluteStart_s ?? c.start_s;
    const end = c.absoluteEnd_s ?? c.end_s;
    return {
      ...c,
      index,
      startLabel: formatTimestamp(start),
      endLabel: formatTimestamp(end),
      durationLabel: formatTimestamp(end - start),
      youtubeAt: youtubeWatchAt(result.url, start),
      downloadUrl: `/api/tools/inkling-clips/clip?jobId=${encodeURIComponent(jobId)}&index=${index}`,
    };
  });
}

export function publicJobView(job: InklingJob) {
  return {
    id: job.id,
    status: job.status,
    progress: job.progress,
    url: job.url,
    mode: job.mode,
    query: job.query ?? null,
    bestCount: job.bestCount,
    error: job.error ?? null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    result: job.result
      ? {
          title: job.result.title,
          slug: job.result.slug,
          engine: job.result.engine,
          totalDuration_s: job.result.totalDuration_s,
          generatedAt: job.result.generatedAt,
          candidates: toPublicCandidates(job.id, job.result),
        }
      : null,
  };
}

export type { PipelinePhase };
