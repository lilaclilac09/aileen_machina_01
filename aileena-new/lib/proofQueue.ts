/**
 * Proof queue — site self-evolution with owner gates.
 *
 * Observe → propose → owner approve → patch → screenshots/checks → PR.
 * Never auto-merge. Never auto-deploy. Visitors can only open observed issues.
 */

export const PROOF_STATUSES = [
  'observed',
  'proposed',
  'approved',
  'in_progress',
  'ready_for_review',
  'rejected',
  'shipped',
] as const;

export type ProofStatus = (typeof PROOF_STATUSES)[number];

export const PROOF_SOURCES = ['owner', 'visitor', 'agent', 'error', 'qa'] as const;
export type ProofSource = (typeof PROOF_SOURCES)[number];

export const PROOF_RISKS = ['low', 'medium', 'high'] as const;
export type ProofRisk = (typeof PROOF_RISKS)[number];

export type ProofScreenshot = {
  label: string;
  url: string;
  addedAt: string;
};

export type ProofProposal = {
  id: string;
  title: string;
  problem: string;
  proposedChange: string;
  route: string;
  source: ProofSource;
  status: ProofStatus;
  risk: ProofRisk;
  acceptanceCriteria: string;
  screenshots: ProofScreenshot[];
  screenshotsRequested: boolean;
  implementationSummary: string;
  filesChanged: string[];
  checksRun: string[];
  knownIssues: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  shippedAt?: string;
};

export type ProofEvent = {
  id: string;
  type: string;
  route: string;
  message: string;
  proposalId?: string;
  createdAt: string;
};

export type ProofCommand =
  | { kind: 'log'; route: string; message: string }
  | { kind: 'propose'; route: string; message: string }
  | { kind: 'list' }
  | { kind: 'approve'; id: string }
  | { kind: 'reject'; id: string }
  | { kind: 'prepare'; id: string };

const SECRETISH =
  /(OWNER_KEY|AUTH_SECRET|RESEND_API_KEY|DEEPSEEK_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|SPOTIFY_CLIENT_SECRET|CURSOR_API_KEY)\s*[=:]\s*\S+/gi;
const BEARER = /Bearer\s+\S+/gi;
const KEYISH = /\b(sk-|rk_|whsec_|xai-)[A-Za-z0-9_-]{8,}\b/g;
const COOKIEISH = /__aileena_[A-Za-z0-9_=.-]+/g;

export function redactProofText(input: string, max = 400): string {
  const raw = String(input || '');
  const cleaned = raw
    .replace(SECRETISH, '$1=█')
    .replace(BEARER, 'Bearer █')
    .replace(KEYISH, '[redacted]')
    .replace(COOKIEISH, '[cookie]')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1)}…`;
}

export function isProofStatus(value: unknown): value is ProofStatus {
  return typeof value === 'string' && (PROOF_STATUSES as readonly string[]).includes(value);
}

export function isProofSource(value: unknown): value is ProofSource {
  return typeof value === 'string' && (PROOF_SOURCES as readonly string[]).includes(value);
}

export function isProofRisk(value: unknown): value is ProofRisk {
  return typeof value === 'string' && (PROOF_RISKS as readonly string[]).includes(value);
}

export function clipProof(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return redactProofText(value, max);
}

export function sanitizeRoute(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '/';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/';
  const path = raw.split(/[?#]/)[0] || '/';
  if (path.length > 120) return path.slice(0, 120);
  return path;
}

export function newProofId(prefix: 'pq' | 'ev' = 'pq'): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') {
    return `${prefix}-${c.randomUUID().replace(/-/g, '').slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function screenshotReady(proposal: Pick<ProofProposal, 'screenshots'>): boolean {
  return Array.isArray(proposal.screenshots) && proposal.screenshots.length > 0;
}

export function proofGateNotes(proposal: ProofProposal): string[] {
  const notes: string[] = [];
  if (!screenshotReady(proposal) || proposal.screenshotsRequested) {
    if (!screenshotReady(proposal)) notes.push('⚡ Need screenshots.');
  }
  if (proposal.status === 'in_progress' && !proposal.implementationSummary.trim()) {
    notes.push('⚡ Need implementation summary.');
  }
  if (proposal.status === 'in_progress' && proposal.filesChanged.length === 0) {
    notes.push('⚡ Need files changed.');
  }
  if (proposal.status === 'in_progress' && proposal.checksRun.length === 0) {
    notes.push('⚡ Need checks.');
  }
  if (proposal.status === 'ready_for_review') notes.push('⚡ Ready.');
  if (proposal.status === 'rejected') notes.push('⚡ Rejected.');
  return notes;
}

export function canBecomeReady(proposal: ProofProposal): { ok: boolean; reason: string } {
  if (proposal.status !== 'in_progress') {
    return { ok: false, reason: 'only in_progress can become ready for review' };
  }
  if (!screenshotReady(proposal)) {
    return { ok: false, reason: '⚡ Need screenshots.' };
  }
  if (!proposal.implementationSummary.trim()) {
    return { ok: false, reason: '⚡ Need implementation summary.' };
  }
  if (proposal.filesChanged.length === 0) {
    return { ok: false, reason: '⚡ Need files changed.' };
  }
  if (proposal.checksRun.length === 0) {
    return { ok: false, reason: '⚡ Need checks.' };
  }
  return { ok: true, reason: '⚡ Ready.' };
}

const TRANSITIONS: Record<ProofStatus, ProofStatus[]> = {
  observed: ['proposed', 'rejected'],
  proposed: ['approved', 'rejected', 'observed'],
  approved: ['in_progress', 'rejected'],
  in_progress: ['ready_for_review', 'rejected', 'approved'],
  ready_for_review: ['shipped', 'in_progress', 'rejected'],
  rejected: [],
  shipped: [],
};

export function canTransition(from: ProofStatus, to: ProofStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export type TransitionOpts = {
  owner: boolean;
  screenshots?: ProofScreenshot[];
  implementationSummary?: string;
  filesChanged?: string[];
  checksRun?: string[];
};

export function applyStatusChange(
  proposal: ProofProposal,
  next: ProofStatus,
  opts: TransitionOpts,
): { ok: true; proposal: ProofProposal } | { ok: false; error: string; status?: number } {
  if (!opts.owner) {
    return { ok: false, error: '⚡ Owner only.', status: 403 };
  }

  if (!canTransition(proposal.status, next)) {
    return { ok: false, error: `cannot move ${proposal.status} → ${next}`, status: 409 };
  }

  const merged: ProofProposal = {
    ...proposal,
    screenshots: opts.screenshots ?? proposal.screenshots,
    implementationSummary: opts.implementationSummary ?? proposal.implementationSummary,
    filesChanged: opts.filesChanged ?? proposal.filesChanged,
    checksRun: opts.checksRun ?? proposal.checksRun,
  };

  if (next === 'ready_for_review') {
    const gate = canBecomeReady({ ...merged, status: 'in_progress' });
    if (!gate.ok) return { ok: false, error: gate.reason, status: 409 };
  }

  const stamp = nowIso();
  const updated: ProofProposal = {
    ...merged,
    status: next,
    updatedAt: stamp,
    approvedAt: next === 'approved' ? stamp : proposal.approvedAt,
    shippedAt: next === 'shipped' ? stamp : proposal.shippedAt,
    screenshotsRequested: next === 'ready_for_review' ? false : proposal.screenshotsRequested,
  };
  return { ok: true, proposal: updated };
}

export function parseProofQueueCommand(text: string): ProofCommand | null {
  const t = String(text || '').trim();
  if (!t) return null;

  if (/^show\s+(evolution|proof)\s+queue\s*[.!?。！？]*$/i.test(t)) {
    return { kind: 'list' };
  }

  const approve = t.match(/^approve\s+proposal\s+(pq-[a-z0-9]+)\s*[.!?。！？]*$/i);
  if (approve) return { kind: 'approve', id: approve[1].toLowerCase() };

  const reject = t.match(/^reject\s+proposal\s+(pq-[a-z0-9]+)\s*[.!?。！？]*$/i);
  if (reject) return { kind: 'reject', id: reject[1].toLowerCase() };

  const prepare = t.match(/^prepare\s+pr\s+for\s+proposal\s+(pq-[a-z0-9]+)\s*[.!?。！？]*$/i);
  if (prepare) return { kind: 'prepare', id: prepare[1].toLowerCase() };

  const logOn = t.match(/^log\s+issue\s+on\s+(\/\S+):\s*(.+)$/i);
  if (logOn) return { kind: 'log', route: sanitizeRoute(logOn[1]), message: clipProof(logOn[2], 400) };

  const log = t.match(/^log\s+issue:\s*(.+)$/i);
  if (log) return { kind: 'log', route: '/', message: clipProof(log[1], 400) };

  const propose = t.match(/^propose\s+fix\s+for\s+(\/\S+):\s*(.+)$/i);
  if (propose) {
    return { kind: 'propose', route: sanitizeRoute(propose[1]), message: clipProof(propose[2], 600) };
  }

  return null;
}

export function isProofQueueCommand(text: string): boolean {
  return parseProofQueueCommand(text) !== null;
}

function titleFromMessage(message: string, fallback: string): string {
  const line = message.split(/[.!?。]/)[0]?.trim() || fallback;
  return clipProof(line, 80) || fallback;
}

export function draftFromMessage(input: {
  title?: string;
  message: string;
  route: string;
  source: ProofSource;
  status: ProofStatus;
  risk?: ProofRisk;
  proposedChange?: string;
  acceptanceCriteria?: string;
}): ProofProposal {
  const stamp = nowIso();
  const problem = clipProof(input.message, 400) || 'unspecified friction';
  return {
    id: newProofId('pq'),
    title: clipProof(input.title, 80) || titleFromMessage(problem, 'site friction'),
    problem,
    proposedChange: clipProof(input.proposedChange || problem, 600),
    route: sanitizeRoute(input.route),
    source: input.source,
    status: input.status,
    risk: input.risk && isProofRisk(input.risk) ? input.risk : 'medium',
    acceptanceCriteria:
      clipProof(
        input.acceptanceCriteria ||
          'screenshots on affected route · mobile 390 · no merge without owner approval',
        400,
      ),
    screenshots: [],
    screenshotsRequested: false,
    implementationSummary: '',
    filesChanged: [],
    checksRun: [],
    knownIssues: '',
    createdAt: stamp,
    updatedAt: stamp,
  };
}

export function sanitizeScreenshot(raw: unknown): ProofScreenshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const url = typeof rec.url === 'string' ? rec.url.trim() : '';
  if (!url || url.length > 300) return null;
  if (!/^(\/|https:\/\/|http:\/\/localhost[:/])/i.test(url) && !url.startsWith('artifact:')) {
    return null;
  }
  return {
    label: clipProof(rec.label, 80) || 'screenshot',
    url,
    addedAt: typeof rec.addedAt === 'string' ? rec.addedAt : nowIso(),
  };
}

export function sanitizeProposal(raw: unknown): ProofProposal | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  if (typeof rec.id !== 'string' || !rec.id.startsWith('pq-')) return null;
  if (!isProofStatus(rec.status) || !isProofSource(rec.source)) return null;
  const screenshots = Array.isArray(rec.screenshots)
    ? rec.screenshots.map(sanitizeScreenshot).filter((s): s is ProofScreenshot => Boolean(s))
    : [];
  const filesChanged = Array.isArray(rec.filesChanged)
    ? rec.filesChanged.filter((f): f is string => typeof f === 'string').map((f) => clipProof(f, 160)).filter(Boolean)
    : [];
  const checksRun = Array.isArray(rec.checksRun)
    ? rec.checksRun.filter((f): f is string => typeof f === 'string').map((f) => clipProof(f, 120)).filter(Boolean)
    : [];
  return {
    id: rec.id.slice(0, 24),
    title: clipProof(rec.title, 80) || 'untitled',
    problem: clipProof(rec.problem, 400) || 'unspecified',
    proposedChange: clipProof(rec.proposedChange, 600),
    route: sanitizeRoute(rec.route),
    source: rec.source,
    status: rec.status,
    risk: isProofRisk(rec.risk) ? rec.risk : 'medium',
    acceptanceCriteria: clipProof(rec.acceptanceCriteria, 400),
    screenshots,
    screenshotsRequested: rec.screenshotsRequested === true,
    implementationSummary: clipProof(rec.implementationSummary, 800),
    filesChanged: filesChanged.slice(0, 24),
    checksRun: checksRun.slice(0, 16),
    knownIssues: clipProof(rec.knownIssues, 400),
    createdAt: typeof rec.createdAt === 'string' ? rec.createdAt : nowIso(),
    updatedAt: typeof rec.updatedAt === 'string' ? rec.updatedAt : nowIso(),
    approvedAt: typeof rec.approvedAt === 'string' ? rec.approvedAt : undefined,
    shippedAt: typeof rec.shippedAt === 'string' ? rec.shippedAt : undefined,
  };
}

export function buildPreparePrPrompt(proposal: ProofProposal): string {
  return [
    `Title: ${proposal.title}`,
    `Route: ${proposal.route}`,
    `Problem: ${proposal.problem}`,
    `Change: ${proposal.proposedChange}`,
    `Acceptance: ${proposal.acceptanceCriteria}`,
    `Risk: ${proposal.risk}`,
    '',
    'Implement the smallest scoped patch on a feature branch.',
    'Do not merge. Do not auto-merge. Do not auto-deploy.',
    'Do not change production without owner approval.',
    'ready for review requires screenshots + build + mobile 390 + route check.',
    'Owner merges the PR after proof.',
  ].join('\n');
}

export function formatQueueList(proposals: ProofProposal[]): string {
  const open = proposals.filter((p) => p.status !== 'shipped' && p.status !== 'rejected');
  if (open.length === 0) return 'proof queue is empty. log issue: … or open /evolution (owner).';
  const lines = open.slice(0, 12).map((p) => `${p.id} · ${p.status} · ${p.route} · ${p.title}`);
  return [`proof queue · ${open.length} open`, ...lines, 'owner panel: /evolution'].join('\n');
}

export const DAILY_OWNER_KEY_SEED = {
  title: 'Fix /daily owner key UI',
  problem: 'Owner cannot write; ugly owner key block appears in the main daily flow.',
  proposedChange:
    'Move unlock to site agent/corner popover, show inline editor only for owner.',
  route: '/daily',
  acceptanceCriteria:
    'no owner key in main flow · owner can save note · visitor can comment · screenshots attached · no merge without owner approval',
  risk: 'medium' as const,
};
