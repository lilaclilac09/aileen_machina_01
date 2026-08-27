import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ProofItem, ProofStatus } from './types';

type Memory = { items: Record<string, ProofItem> };
const g = globalThis as typeof globalThis & { __aileenaProofQueue?: Memory };

function memory(): Memory {
  if (!g.__aileenaProofQueue) g.__aileenaProofQueue = { items: {} };
  return g.__aileenaProofQueue;
}

function dataDir(): string {
  return join(process.cwd(), '.data', 'computer-prototype');
}

function storePath(): string {
  return join(dataDir(), 'proof.json');
}

function persist(): void {
  try {
    mkdirSync(dataDir(), { recursive: true });
    writeFileSync(storePath(), JSON.stringify(memory().items, null, 2));
  } catch {
    /* memory still works */
  }
}

function isOpenProof(item: ProofItem): boolean {
  return item.status !== 'shipped' && item.status !== 'rejected';
}

function shipProof(
  id: string,
  fields: Pick<ProofItem, 'title' | 'problem' | 'proposedChange' | 'resultSummary'>,
): void {
  const item = memory().items[id];
  if (!item || item.status === 'shipped') return;
  item.status = 'shipped';
  item.title = fields.title;
  item.problem = fields.problem;
  item.proposedChange = fields.proposedChange;
  item.resultSummary = fields.resultSummary;
  item.updatedAt = item.createdAt;
}

function closeShippedDailyProofs(): void {
  shipProof('proof-daily-owner-key', {
    title: '/daily owner door — off the board',
    problem: 'Public /daily must not mount a typed owner-secret form. This is already true.',
    proposedChange:
      'Keep the owner door off /daily. Computer stays in the site-agent dialog. KeyShield is the door.',
    resultSummary: 'DailyBoard has no OwnerUnlockForm. Unlock is KeyShield on council / cabinet / proof.',
  });
  shipProof('proof-daily-notes', {
    title: '/daily notes — public latest',
    problem: 'Visitors must see the latest published note, or an explicit empty state. Writer is owner-only.',
    proposedChange:
      'Public read path shows latest stored note. Persistence is named when it is only this instance.',
    resultSummary:
      'showWriter is owner. Visitors see daily-latest or nothing today yet. Memory shows “this instance”.',
  });
  shipProof('proof-daily-comments', {
    title: '/daily comments — on a published note',
    problem: 'Bubbles need a published note. Production without Redis fails closed.',
    proposedChange: 'Comment form mounts when a note exists. 503 is a bolt. No second store.',
    resultSummary:
      'commentNote is todayNote ?? latest. 503 toast is Nope. Writes still refuse memory on Vercel.',
  });
  persist();
}

function hydrate(): void {
  if (Object.keys(memory().items).length === 0) {
    try {
      if (existsSync(storePath())) {
        const parsed = JSON.parse(readFileSync(storePath(), 'utf8')) as Record<string, ProofItem>;
        if (parsed && typeof parsed === 'object') memory().items = parsed;
      }
    } catch {
      /* ignore */
    }
    if (Object.keys(memory().items).length === 0) seedKnownIssues();
  }
  closeShippedDailyProofs();
}

function seedKnownIssues(): void {
  const now = new Date().toISOString();
  const seeds: Omit<ProofItem, 'createdAt' | 'updatedAt'>[] = [
    {
      id: 'proof-daily-owner-key',
      title: '/daily owner door — off the board',
      route: '/daily',
      problem: 'Public /daily must not mount a typed owner-secret form. This is already true.',
      proposedChange: 'Keep the owner door off /daily. Computer stays in the site-agent dialog. KeyShield is the door.',
      source: 'seed',
      status: 'shipped',
      risk: 'medium',
      acceptanceCriteria: ['Visitor 390px still usable', 'Owner can still enter', 'No OWNER_KEY string in visitor UI'],
      screenshots: [],
      filesChanged: ['aileena-new/components/DailyBoard.tsx'],
      checksRun: ['verify:computer-prototype'],
      computerTaskIds: [],
      resultSummary: 'DailyBoard has no OwnerUnlockForm. Unlock is KeyShield on council / cabinet / proof.',
    },
    {
      id: 'proof-daily-notes',
      title: '/daily notes — public latest',
      route: '/daily',
      problem: 'Visitors must see the latest published note, or an explicit empty state. Writer is owner-only.',
      proposedChange:
        'Public read path shows latest stored note. Persistence is named when it is only this instance.',
      source: 'seed',
      status: 'shipped',
      risk: 'medium',
      acceptanceCriteria: ['Visitor sees latest published note', 'Empty state is explicit'],
      screenshots: [],
      filesChanged: ['aileena-new/components/DailyBoard.tsx'],
      checksRun: ['verify:daily-board'],
      computerTaskIds: [],
      resultSummary:
        'showWriter is owner. Visitors see daily-latest or nothing today yet. Memory shows “this instance”.',
    },
    {
      id: 'proof-daily-comments',
      title: '/daily comments — on a published note',
      route: '/daily',
      problem: 'Bubbles need a published note. Production without Redis fails closed.',
      proposedChange: 'Comment form mounts when a note exists. 503 is a bolt. No second store.',
      source: 'seed',
      status: 'shipped',
      risk: 'medium',
      acceptanceCriteria: ['Bubbles show when a note exists', '503 copy is a bolt, not a stack trace'],
      screenshots: [],
      filesChanged: ['aileena-new/components/DailyBoard.tsx'],
      checksRun: ['verify:daily-board'],
      computerTaskIds: [],
      resultSummary:
        'commentNote is todayNote ?? latest. 503 toast is Nope. Writes still refuse memory on Vercel.',
    },
  ];
  for (const s of seeds) {
    memory().items[s.id] = { ...s, createdAt: now, updatedAt: now };
  }
  persist();
}

export function listProofItems(): ProofItem[] {
  hydrate();
  return Object.values(memory().items).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function nextOpenProof(route?: string): ProofItem | null {
  return listProofItems().find((item) => isOpenProof(item) && (!route || item.route === route)) ?? null;
}

export function getProofItem(id: string): ProofItem | null {
  hydrate();
  return memory().items[id] ?? null;
}

export function upsertProofItem(item: ProofItem): ProofItem {
  hydrate();
  memory().items[item.id] = item;
  persist();
  return item;
}

export function newProofId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return `proof-${c.randomUUID().slice(0, 8)}`;
  return `proof-${Date.now().toString(36)}`;
}

export function attachTaskToProof(proofItemId: string, taskId: string, status?: ProofStatus): ProofItem | null {
  const item = getProofItem(proofItemId);
  if (!item) return null;
  const ids = item.computerTaskIds.includes(taskId)
    ? item.computerTaskIds
    : [...item.computerTaskIds, taskId];
  const next: ProofItem = {
    ...item,
    computerTaskIds: ids,
    status: status ?? item.status,
    updatedAt: new Date().toISOString(),
  };
  return upsertProofItem(next);
}

export function applyOwnerProofAction(
  id: string,
  action: 'approve' | 'reject',
): ProofItem | { error: string } {
  const item = getProofItem(id);
  if (!item) return { error: 'missing' };
  if (action === 'approve') {
    if (item.status === 'rejected' || item.status === 'shipped') {
      return { error: 'closed' };
    }
    return upsertProofItem({
      ...item,
      status: 'approved',
      updatedAt: new Date().toISOString(),
    });
  }
  return upsertProofItem({
    ...item,
    status: 'rejected',
    updatedAt: new Date().toISOString(),
  });
}
