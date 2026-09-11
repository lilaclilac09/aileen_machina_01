import { createHash } from 'node:crypto';
import type { DifficultyBucket, TaskPrompt } from '../types';
import { DIFFICULTY_BUCKETS } from '../types';

const STOP = new Set(['the', 'a', 'an', 'her', 'she', 'is', 'to', 'of', 'and', 'or', 'for']);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

/** Stable structure fingerprint: tags + prompt skeleton (numbers stripped). */
export function structureFingerprint(task: Pick<TaskPrompt, 'structure' | 'prompt'>): string {
  const skeleton = tokenize(task.prompt.replace(/\d+/g, '#'))
    .slice(0, 12)
    .join(' ');
  const tags = [...task.structure].map((s) => s.toLowerCase()).sort().join('|');
  return `${tags}::${skeleton}`;
}

export function jaccard(a: string[], b: string[]): number {
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function tooSimilar(a: TaskPrompt, b: TaskPrompt, threshold = 0.6): boolean {
  if (structureFingerprint(a) === structureFingerprint(b)) return true;
  const tagsA = a.structure.map((s) => s.toLowerCase());
  const tagsB = b.structure.map((s) => s.toLowerCase());
  const tagScore = jaccard(tagsA, tagsB);
  const tokScore = jaccard(tokenize(a.prompt), tokenize(b.prompt));
  if (tagScore >= 0.99 && tokScore >= threshold) return true;
  return tagScore >= 0.8 && tokScore >= 0.85;
}

export function bucketCounts(tasks: TaskPrompt[]): Record<DifficultyBucket, number> {
  const out = { easy: 0, medium: 0, hard: 0, adversarial: 0 };
  for (const t of tasks) out[t.bucket] += 1;
  return out;
}

/** Collapse if easy > 40% of a generated batch, or a bucket is empty when n>=4. */
export function distributionOk(tasks: TaskPrompt[]): { ok: boolean; reason: string } {
  if (tasks.length === 0) return { ok: false, reason: 'empty batch' };
  const counts = bucketCounts(tasks);
  const easyShare = counts.easy / tasks.length;
  if (easyShare > 0.4) return { ok: false, reason: `easy share ${easyShare.toFixed(2)} > 0.40` };
  if (tasks.length >= 4) {
    for (const b of DIFFICULTY_BUCKETS) {
      if (counts[b] === 0) return { ok: false, reason: `missing bucket ${b}` };
    }
  }
  return { ok: true, reason: 'ok' };
}

export function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}
