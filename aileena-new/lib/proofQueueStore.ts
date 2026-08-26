/**
 * Proof queue persistence.
 * Redis when UPSTASH_* is set; in-memory fallback for same-instance local QA.
 */

import { getVisitorRedis } from './visitorMemory';
import { taipeiDay } from './taipeiDay';
import { readDailyNotes } from './dailyBoardStore';
import {
  DAILY_OWNER_KEY_SEED,
  PROOF_QUEUE_SEEDS,
  applyStatusChange,
  buildPreparePrPrompt,
  canBecomeReady,
  clipProof,
  draftFromMessage,
  formatQueueList,
  isProofRisk,
  newProofId,
  nowIso,
  parseProofQueueCommand,
  sanitizeProposal,
  sanitizeRoute,
  sanitizeScreenshot,
  type ProofCommand,
  type ProofEvent,
  type ProofProposal,
  type ProofRisk,
  type ProofScreenshot,
  type ProofSource,
  type ProofStatus,
} from './proofQueue';

const PROPOSALS_KEY = 'proof:proposals';
const EVENTS_KEY = 'proof:events';
const OBSERVE_PREFIX = 'proof:obs:';
const MAX_PROPOSALS = 80;
const MAX_EVENTS = 80;

type Memory = {
  proposals: ProofProposal[];
  events: ProofEvent[];
};

const g = globalThis as typeof globalThis & { __aileenaProofQueue?: Memory };

function memory(): Memory {
  if (!g.__aileenaProofQueue) {
    g.__aileenaProofQueue = { proposals: [], events: [] };
  }
  return g.__aileenaProofQueue;
}

export function proofQueuePersistence(): 'redis' | 'memory' {
  if (process.env['PROOF_QUEUE_MEMORY'] === '1') return 'memory';
  return getVisitorRedis() ? 'redis' : 'memory';
}

export function proofQueueWritesOk(): boolean {
  if (proofQueuePersistence() === 'redis') return true;
  return process.env['VERCEL'] !== '1';
}

export function resetProofQueueForTests(): void {
  g.__aileenaProofQueue = { proposals: [], events: [] };
}

function parseJson<T>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  if (typeof raw === 'object') return raw as T;
  return null;
}

async function readAllProposals(): Promise<ProofProposal[]> {
  const redis = proofQueuePersistence() === 'redis' ? getVisitorRedis() : null;
  const raw = redis ? await redis.get(PROPOSALS_KEY) : memory().proposals;
  const parsed = redis ? parseJson<unknown[]>(raw) : (raw as unknown[]);
  if (!Array.isArray(parsed)) return [];
  return parsed.map(sanitizeProposal).filter((p): p is ProofProposal => Boolean(p));
}

async function writeAllProposals(proposals: ProofProposal[]): Promise<void> {
  const next = proposals.slice(0, MAX_PROPOSALS);
  const redis = proofQueuePersistence() === 'redis' ? getVisitorRedis() : null;
  if (!redis) {
    memory().proposals = next;
    return;
  }
  await redis.set(PROPOSALS_KEY, next);
}

async function readAllEvents(): Promise<ProofEvent[]> {
  const redis = proofQueuePersistence() === 'redis' ? getVisitorRedis() : null;
  const raw = redis ? await redis.get(EVENTS_KEY) : memory().events;
  const parsed = redis ? parseJson<ProofEvent[]>(raw) : (raw as ProofEvent[]);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((e) => e && typeof e.id === 'string' && typeof e.message === 'string').slice(0, MAX_EVENTS);
}

async function writeAllEvents(events: ProofEvent[]): Promise<void> {
  const next = events.slice(0, MAX_EVENTS);
  const redis = proofQueuePersistence() === 'redis' ? getVisitorRedis() : null;
  if (!redis) {
    memory().events = next;
    return;
  }
  await redis.set(EVENTS_KEY, next);
}

async function appendEvent(partial: Omit<ProofEvent, 'id' | 'createdAt'> & { createdAt?: string }): Promise<ProofEvent> {
  const event: ProofEvent = {
    id: newProofId('ev'),
    type: clipProof(partial.type, 40) || 'note',
    route: sanitizeRoute(partial.route),
    message: clipProof(partial.message, 240) || 'event',
    proposalId: partial.proposalId,
    createdAt: partial.createdAt || nowIso(),
  };
  const events = await readAllEvents();
  events.unshift(event);
  await writeAllEvents(events);
  return event;
}

function sortProposals(proposals: ProofProposal[]): ProofProposal[] {
  const rank: Record<ProofStatus, number> = {
    ready_for_review: 0,
    in_progress: 1,
    approved: 2,
    proposed: 3,
    observed: 4,
    rejected: 5,
    shipped: 6,
  };
  return [...proposals].sort((a, b) => {
    const d = rank[a.status] - rank[b.status];
    if (d !== 0) return d;
    return a.updatedAt < b.updatedAt ? 1 : -1;
  });
}

export async function listProofQueue(): Promise<{
  proposals: ProofProposal[];
  events: ProofEvent[];
  persistence: 'redis' | 'memory';
}> {
  const [proposals, events] = await Promise.all([readAllProposals(), readAllEvents()]);
  return {
    proposals: sortProposals(proposals),
    events: events.slice(0, 40),
    persistence: proofQueuePersistence(),
  };
}

async function saveProposal(next: ProofProposal, eventType: string, message: string): Promise<ProofProposal> {
  const all = await readAllProposals();
  const idx = all.findIndex((p) => p.id === next.id);
  if (idx >= 0) all[idx] = next;
  else all.unshift(next);
  await writeAllProposals(all);
  await appendEvent({
    type: eventType,
    route: next.route,
    message,
    proposalId: next.id,
  });
  return next;
}

export async function getProposal(id: string): Promise<ProofProposal | null> {
  const all = await readAllProposals();
  return all.find((p) => p.id === id) ?? null;
}

export async function createObserved(input: {
  title?: string;
  message: string;
  route: string;
  source: ProofSource;
  proposedChange?: string;
  risk?: ProofRisk;
}): Promise<ProofProposal> {
  const existing = await findOpenDuplicate(input.route, input.message);
  if (existing) return existing;
  const proposal = draftFromMessage({
    title: input.title,
    message: input.message,
    route: input.route,
    source: input.source,
    status: 'observed',
    risk: input.risk,
    proposedChange: input.proposedChange,
  });
  return saveProposal(proposal, 'observed', `${proposal.title} · ${proposal.route}`);
}

export async function createProposal(input: {
  title?: string;
  message: string;
  route: string;
  source: ProofSource;
  owner: boolean;
  proposedChange?: string;
  acceptanceCriteria?: string;
  risk?: ProofRisk;
}): Promise<ProofProposal> {
  const status: ProofStatus = input.owner ? 'proposed' : 'observed';
  const source: ProofSource = input.owner ? (input.source === 'visitor' ? 'owner' : input.source) : 'visitor';
  const proposal = draftFromMessage({
    title: input.title,
    message: input.message,
    route: input.route,
    source,
    status,
    risk: input.risk,
    proposedChange: input.proposedChange,
    acceptanceCriteria: input.acceptanceCriteria,
  });
  return saveProposal(proposal, status, `${proposal.title} · ${proposal.route}`);
}

async function findOpenDuplicate(route: string, message: string): Promise<ProofProposal | null> {
  const all = await readAllProposals();
  const needle = clipProof(message, 80).toLowerCase();
  return (
    all.find(
      (p) =>
        p.route === sanitizeRoute(route) &&
        p.status !== 'rejected' &&
        p.status !== 'shipped' &&
        (p.title.toLowerCase() === needle || p.problem.toLowerCase().startsWith(needle.slice(0, 40))),
    ) ?? null
  );
}

export async function transitionProposal(
  id: string,
  next: ProofStatus,
  owner: boolean,
): Promise<{ ok: true; proposal: ProofProposal } | { ok: false; error: string; status: number }> {
  const current = await getProposal(id);
  if (!current) return { ok: false, error: 'not found', status: 404 };
  const applied = applyStatusChange(current, next, { owner });
  if (!applied.ok) return { ok: false, error: applied.error, status: applied.status ?? 409 };
  const saved = await saveProposal(applied.proposal, next, `${applied.proposal.id} → ${next}`);
  return { ok: true, proposal: saved };
}

export async function editProposalScope(
  id: string,
  owner: boolean,
  patch: {
    proposedChange?: string;
    acceptanceCriteria?: string;
    risk?: ProofRisk;
    route?: string;
    title?: string;
    problem?: string;
  },
): Promise<{ ok: true; proposal: ProofProposal } | { ok: false; error: string; status: number }> {
  if (!owner) return { ok: false, error: '⚡ Owner only.', status: 403 };
  const current = await getProposal(id);
  if (!current) return { ok: false, error: 'not found', status: 404 };
  if (current.status === 'shipped') return { ok: false, error: 'shipped proposals are frozen', status: 409 };
  const next: ProofProposal = {
    ...current,
    proposedChange: patch.proposedChange !== undefined ? clipProof(patch.proposedChange, 600) : current.proposedChange,
    acceptanceCriteria:
      patch.acceptanceCriteria !== undefined ? clipProof(patch.acceptanceCriteria, 400) : current.acceptanceCriteria,
    risk: patch.risk && isProofRisk(patch.risk) ? patch.risk : current.risk,
    route: patch.route ? sanitizeRoute(patch.route) : current.route,
    title: patch.title !== undefined ? clipProof(patch.title, 80) || current.title : current.title,
    problem: patch.problem !== undefined ? clipProof(patch.problem, 400) || current.problem : current.problem,
    updatedAt: nowIso(),
  };
  const saved = await saveProposal(next, 'edit', `${next.id} scope edited`);
  return { ok: true, proposal: saved };
}

export async function requestScreenshots(
  id: string,
  owner: boolean,
): Promise<{ ok: true; proposal: ProofProposal } | { ok: false; error: string; status: number }> {
  if (!owner) return { ok: false, error: '⚡ Owner only.', status: 403 };
  const current = await getProposal(id);
  if (!current) return { ok: false, error: 'not found', status: 404 };
  if (current.status === 'in_progress') {
    return transitionProposal(id, 'needs_screenshots', owner);
  }
  const next: ProofProposal = { ...current, screenshotsRequested: true, updatedAt: nowIso() };
  const saved = await saveProposal(next, 'screenshots', `${next.id} ⚡ Need screenshots.`);
  return { ok: true, proposal: saved };
}

export async function attachProof(
  id: string,
  owner: boolean,
  patch: {
    screenshots?: unknown[];
    implementationSummary?: string;
    filesChanged?: unknown;
    checksRun?: unknown;
    knownIssues?: string;
  },
): Promise<{ ok: true; proposal: ProofProposal } | { ok: false; error: string; status: number }> {
  if (!owner) return { ok: false, error: '⚡ Owner only.', status: 403 };
  const current = await getProposal(id);
  if (!current) return { ok: false, error: 'not found', status: 404 };
  const extra = Array.isArray(patch.screenshots)
    ? patch.screenshots.map(sanitizeScreenshot).filter((s): s is ProofScreenshot => Boolean(s))
    : [];
  const files = Array.isArray(patch.filesChanged)
    ? patch.filesChanged.filter((f): f is string => typeof f === 'string').map((f) => clipProof(f, 160)).filter(Boolean)
    : current.filesChanged;
  const checks = Array.isArray(patch.checksRun)
    ? patch.checksRun.filter((f): f is string => typeof f === 'string').map((f) => clipProof(f, 120)).filter(Boolean)
    : current.checksRun;
  const next: ProofProposal = {
    ...current,
    screenshots: extra.length ? [...current.screenshots, ...extra].slice(0, 12) : current.screenshots,
    implementationSummary:
      patch.implementationSummary !== undefined
        ? clipProof(patch.implementationSummary, 800)
        : current.implementationSummary,
    filesChanged: files.slice(0, 24),
    checksRun: checks.slice(0, 16),
    knownIssues: patch.knownIssues !== undefined ? clipProof(patch.knownIssues, 400) : current.knownIssues,
    updatedAt: nowIso(),
  };
  const saved = await saveProposal(next, 'proof', `${next.id} proof attached`);
  return { ok: true, proposal: saved };
}

export async function markReady(
  id: string,
  owner: boolean,
): Promise<{ ok: true; proposal: ProofProposal } | { ok: false; error: string; status: number }> {
  if (!owner) return { ok: false, error: '⚡ Owner only.', status: 403 };
  const current = await getProposal(id);
  if (!current) return { ok: false, error: 'not found', status: 404 };
  const gate = canBecomeReady(current);
  if (!gate.ok) return { ok: false, error: gate.reason, status: 409 };
  return transitionProposal(id, 'ready_for_review', owner);
}

export async function preparePr(
  id: string,
  owner: boolean,
): Promise<
  | { ok: true; proposal: ProofProposal; prompt: string; merge: false }
  | { ok: false; error: string; status: number }
> {
  if (!owner) return { ok: false, error: '⚡ Owner only.', status: 403 };
  const current = await getProposal(id);
  if (!current) return { ok: false, error: 'not found', status: 404 };
  if (current.status !== 'approved' && current.status !== 'in_progress') {
    return { ok: false, error: 'approve first — prepare PR does not merge', status: 409 };
  }
  let working = current;
  if (current.status === 'approved') {
    const moved = await transitionProposal(id, 'in_progress', owner);
    if (!moved.ok) return moved;
    working = moved.proposal;
  }
  const prompt = buildPreparePrPrompt(working);
  await appendEvent({
    type: 'prepare_pr',
    route: working.route,
    message: `${working.id} PR prompt ready · no merge`,
    proposalId: working.id,
  });
  return { ok: true, proposal: working, prompt, merge: false };
}

export async function observeRuntime(input: {
  type: string;
  route: string;
  message: string;
  source?: ProofSource;
}): Promise<{ ok: true; proposal: ProofProposal | null; skipped?: string }> {
  const message = clipProof(input.message, 160);
  const route = sanitizeRoute(input.route);
  if (!message) return { ok: true, proposal: null, skipped: 'empty' };

  const redis = proofQueuePersistence() === 'redis' ? getVisitorRedis() : null;
  const fp = `${route}:${message}`.slice(0, 120);
  const key = `${OBSERVE_PREFIX}${hashLite(fp)}`;
  if (redis) {
    const hit = await redis.get(key);
    if (hit) return { ok: true, proposal: null, skipped: 'deduped' };
    await redis.set(key, '1', { ex: 60 * 60 });
  }

  const proposal = await createObserved({
    message,
    route,
    source: input.source === 'qa' || input.source === 'error' ? input.source : 'error',
  });
  await appendEvent({ type: input.type || 'error', route, message, proposalId: proposal.id });
  return { ok: true, proposal };
}

function hashLite(value: string): string {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export async function scanOwnerSignals(owner: boolean): Promise<ProofProposal[]> {
  if (!owner) return [];
  const created: ProofProposal[] = [];
  const notes = await readDailyNotes();
  const today = taipeiDay();
  const todayNote = notes.find((n) => n.date === today);
  if (!todayNote || !String(todayNote.body || '').trim()) {
    created.push(
      await createObserved({
        title: 'Daily note empty today',
        message: 'Owner board has no note for Taipei today.',
        route: '/daily',
        source: 'qa',
      }),
    );
  }
  return created;
}

export async function ensureProofQueueSeeds(): Promise<ProofProposal[]> {
  const all = await readAllProposals();
  const saved: ProofProposal[] = [];
  for (const seed of PROOF_QUEUE_SEEDS) {
    const existing = all.find(
      (p) => p.title === seed.title && p.status !== 'rejected' && p.status !== 'shipped',
    );
    if (existing) {
      saved.push(existing);
      continue;
    }
    const proposal = draftFromMessage({
      title: seed.title,
      message: seed.problem,
      route: seed.route,
      source: 'owner',
      status: seed.status,
      risk: seed.risk,
      proposedChange: seed.proposedChange,
      acceptanceCriteria: seed.acceptanceCriteria,
    });
    saved.push(await saveProposal(proposal, seed.status, `${proposal.title} seeded ${seed.status}`));
  }
  return saved;
}

export async function ensureDailyOwnerKeySeed(): Promise<ProofProposal> {
  const seeded = await ensureProofQueueSeeds();
  const daily = seeded.find((p) => p.title === DAILY_OWNER_KEY_SEED.title);
  if (daily) return daily;
  const proposal = draftFromMessage({
    title: DAILY_OWNER_KEY_SEED.title,
    message: DAILY_OWNER_KEY_SEED.problem,
    route: DAILY_OWNER_KEY_SEED.route,
    source: 'owner',
    status: DAILY_OWNER_KEY_SEED.status,
    risk: DAILY_OWNER_KEY_SEED.risk,
    proposedChange: DAILY_OWNER_KEY_SEED.proposedChange,
    acceptanceCriteria: DAILY_OWNER_KEY_SEED.acceptanceCriteria,
  });
  return saveProposal(proposal, DAILY_OWNER_KEY_SEED.status, `${proposal.title} seeded`);
}

export async function runProofCommand(
  text: string,
  owner: boolean,
): Promise<{ ok: true; reply: string; proposal?: ProofProposal } | { ok: false; error: string; status: number }> {
  const cmd = parseProofQueueCommand(text);
  if (!cmd) return { ok: false, error: 'not a proof-queue command', status: 400 };
  return executeProofCommand(cmd, owner);
}

export async function executeProofCommand(
  cmd: ProofCommand,
  owner: boolean,
): Promise<{ ok: true; reply: string; proposal?: ProofProposal } | { ok: false; error: string; status: number }> {
  if (cmd.kind === 'list') {
    if (!owner) return { ok: false, error: '⚡ Owner only.', status: 403 };
    const { proposals } = await listProofQueue();
    return { ok: true, reply: formatQueueList(proposals) };
  }

  if (cmd.kind === 'log') {
    const proposal = await createObserved({
      message: cmd.message,
      route: cmd.route,
      source: owner ? 'owner' : 'visitor',
    });
    return {
      ok: true,
      reply: owner
        ? `logged ${proposal.id} as observed · ${proposal.route}\nopen /proof to propose.`
        : `logged ${proposal.id} as observed. not approved. owner decides.`,
      proposal,
    };
  }

  if (cmd.kind === 'propose') {
    const proposal = await createProposal({
      message: cmd.message,
      route: cmd.route,
      source: owner ? 'agent' : 'visitor',
      owner,
    });
    if (!owner) {
      return {
        ok: true,
        reply: `${proposal.id} stayed observed. visitors cannot approve or promote.`,
        proposal,
      };
    }
    return {
      ok: true,
      reply: `proposed ${proposal.id} · ${proposal.route} · ${proposal.title}\napprove proposal ${proposal.id}`,
      proposal,
    };
  }

  if (cmd.kind === 'approve') {
    const moved = await transitionProposal(cmd.id, 'approved', owner);
    if (!moved.ok) return moved;
    return {
      ok: true,
      reply: `approved ${moved.proposal.id}. still no merge. prepare PR for proposal ${moved.proposal.id}`,
      proposal: moved.proposal,
    };
  }

  if (cmd.kind === 'reject') {
    const moved = await transitionProposal(cmd.id, 'rejected', owner);
    if (!moved.ok) return moved;
    return { ok: true, reply: `rejected ${moved.proposal.id}.`, proposal: moved.proposal };
  }

  if (cmd.kind === 'ready') {
    const moved = await markReady(cmd.id, owner);
    if (!moved.ok) return moved;
    return { ok: true, reply: `⚡ Ready. ${moved.proposal.id} — still no merge.`, proposal: moved.proposal };
  }

  const prepared = await preparePr(cmd.id, owner);
  if (!prepared.ok) return prepared;
  return {
    ok: true,
    reply: [
      `PR plan for ${prepared.proposal.id} (merge: false)`,
      prepared.prompt,
      'Paste that into a Cursor agent. Owner merges after screenshots.',
    ].join('\n\n'),
    proposal: prepared.proposal,
  };
}
