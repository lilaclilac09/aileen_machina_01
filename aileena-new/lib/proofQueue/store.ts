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
  const leftover = memory().items['proof-daily-owner-key'];
  if (leftover && /owner key/i.test(`${leftover.title} ${leftover.problem}`)) {
    leftover.title = '/daily owner door leftover';
    leftover.problem = 'Public /daily must not mount a typed owner-secret form. Passkey lives off this board.';
    leftover.proposedChange =
      'Keep the owner door off /daily. Computer stays in the site-agent dialog. No typed secret in visitor UI.';
    persist();
  }
}

function seedKnownIssues(): void {
  const now = new Date().toISOString();
  const seeds: Omit<ProofItem, 'createdAt' | 'updatedAt'>[] = [
    {
      id: 'proof-daily-owner-key',
      title: '/daily owner door leftover',
      route: '/daily',
      problem: 'Public /daily must not mount a typed owner-secret form. Passkey lives off this board.',
      proposedChange: 'Keep the owner door off /daily. Computer stays in the site-agent dialog. No typed secret in visitor UI.',
      source: 'seed',
      status: 'observed',
      risk: 'medium',
      acceptanceCriteria: ['Visitor 390px still usable', 'Owner can still enter', 'No OWNER_KEY string in visitor UI'],
      screenshots: [],
      filesChanged: [],
      checksRun: [],
      computerTaskIds: [],
      resultSummary: '',
    },
    {
      id: 'proof-daily-notes',
      title: '/daily notes not displaying',
      route: '/daily',
      problem: 'Today’s note may not show for visitors when persistence is memory or today is empty.',
      proposedChange: 'Make the public read path show the latest stored note, and report persistence honestly.',
      source: 'seed',
      status: 'observed',
      risk: 'medium',
      acceptanceCriteria: ['Visitor sees latest published note', 'Empty state is explicit'],
      screenshots: [],
      filesChanged: [],
      checksRun: [],
      computerTaskIds: [],
      resultSummary: '',
    },
    {
      id: 'proof-daily-comments',
      title: '/daily comments missing',
      route: '/daily',
      problem: 'Bubble form is hidden when there is no note; production without Redis returns 503.',
      proposedChange: 'Keep a comment target when notes exist; fail closed without durable store.',
      source: 'seed',
      status: 'observed',
      risk: 'medium',
      acceptanceCriteria: ['Bubbles show when a note exists', '503 copy is a bolt, not a stack trace'],
      screenshots: [],
      filesChanged: [],
      checksRun: [],
      computerTaskIds: [],
      resultSummary: '',
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
