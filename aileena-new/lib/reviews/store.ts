import { mkdir, readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { unwrapReport, type ReviewReport } from './report';

export type ReviewSummary = {
  id: string;
  savedAt: string;
  scope: string;
  mode: string;
  findings: number;
  screenedFiles: number;
  requestChanges: number;
  writable: boolean;
};

export type StoredReview =
  | { status: 'ok'; id: string; savedAt: string; writable: boolean; report: ReviewReport }
  | { status: 'empty' }
  | { status: 'error'; message: string };

const ID_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;

export function isReviewId(id: string): boolean {
  return ID_RE.test(id);
}

function repoDir(): string {
  return join(process.cwd(), 'data', 'reviews');
}

function instanceDir(): string {
  return join(process.cwd(), '.data', 'reviews');
}

async function readOne(path: string): Promise<{ savedAt: string; report: ReviewReport } | null> {
  try {
    const [text, info] = await Promise.all([readFile(path, 'utf8'), stat(path)]);
    const report = unwrapReport(JSON.parse(text) as unknown);
    if (!report) return null;
    return { savedAt: info.mtime.toISOString(), report };
  } catch {
    return null;
  }
}

async function idsIn(dir: string): Promise<string[]> {
  try {
    const names = await readdir(dir);
    return names
      .filter((name) => name.endsWith('.json'))
      .map((name) => name.slice(0, -5))
      .filter(isReviewId);
  } catch {
    return [];
  }
}

function summary(id: string, savedAt: string, report: ReviewReport, writable: boolean): ReviewSummary {
  const findings = report.findings.filter((row) => row && typeof row === 'object');
  return {
    id,
    savedAt,
    scope: report.scope,
    mode: report.mode === 'codebase' ? 'codebase' : 'changes',
    findings: findings.length,
    screenedFiles: report.screenedFiles,
    requestChanges: findings.filter((row) => row.action === 'request_changes').length,
    writable,
  };
}

export async function listReviews(): Promise<ReviewSummary[]> {
  const [repoIds, instanceIds] = await Promise.all([idsIn(repoDir()), idsIn(instanceDir())]);
  const ids = [...new Set([...instanceIds, ...repoIds])];
  const rows = await Promise.all(
    ids.map(async (id) => {
      const instance = await readOne(join(instanceDir(), `${id}.json`));
      if (instance) return summary(id, instance.savedAt, instance.report, true);
      const repo = await readOne(join(repoDir(), `${id}.json`));
      if (repo) return summary(id, repo.savedAt, repo.report, false);
      return null;
    }),
  );
  return rows
    .filter((row): row is ReviewSummary => row !== null)
    .sort((a, b) => (a.savedAt < b.savedAt ? 1 : a.savedAt > b.savedAt ? -1 : a.id < b.id ? 1 : -1));
}

export async function readReview(id: string): Promise<StoredReview> {
  if (!isReviewId(id)) return { status: 'error', message: 'Report could not be read' };
  const instance = await readOne(join(instanceDir(), `${id}.json`));
  if (instance) {
    return { status: 'ok', id, savedAt: instance.savedAt, writable: true, report: instance.report };
  }
  const repo = await readOne(join(repoDir(), `${id}.json`));
  if (repo) return { status: 'ok', id, savedAt: repo.savedAt, writable: false, report: repo.report };
  return { status: 'empty' };
}

function reviewId(report: ReviewReport): string {
  const base = report.scope.split('/').filter(Boolean).pop() || 'review';
  const name = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'review';
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  return `${stamp}-${name}`.slice(0, 80);
}

export async function saveReview(report: ReviewReport): Promise<ReviewSummary> {
  const dir = instanceDir();
  await mkdir(dir, { recursive: true });
  let id = reviewId(report);
  let n = 2;
  while (await readOne(join(dir, `${id}.json`))) {
    id = `${reviewId(report).slice(0, 76)}-${n}`;
    n += 1;
  }
  const path = join(dir, `${id}.json`);
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`);
  const stored = await readOne(path);
  if (!stored) throw new Error('Report could not be read');
  return summary(id, stored.savedAt, stored.report, true);
}

export async function removeInstanceReview(id: string): Promise<boolean> {
  if (!isReviewId(id)) return false;
  try {
    await unlink(join(instanceDir(), `${id}.json`));
    return true;
  } catch {
    return false;
  }
}
