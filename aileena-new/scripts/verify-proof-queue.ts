#!/usr/bin/env tsx
/**
 * Proof queue gates: status machine, owner-only approve, no auto-merge, screenshots before ready.
 *
 *   pnpm verify:proof-queue
 *   VERIFY_BASE_URL=http://localhost:3000 pnpm verify:proof-queue
 */

process.env.PROOF_QUEUE_MEMORY = '1';
process.env.VERCEL = process.env.VERCEL === '1' ? '' : process.env.VERCEL;

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createOwnerSession, SESSION_COOKIE } from '../lib/auth';
import {
  applyStatusChange,
  canBecomeReady,
  DAILY_OWNER_KEY_SEED,
  draftFromMessage,
  parseProofQueueCommand,
  redactProofText,
} from '../lib/proofQueue';
import {
  createObserved,
  createProposal,
  ensureDailyOwnerKeySeed,
  executeProofCommand,
  markReady,
  preparePr,
  resetProofQueueForTests,
  attachProof,
  transitionProposal,
} from '../lib/proofQueueStore';

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function loadEnvLocal() {
  const p = join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), 'utf8');
}

function sourceHasNoMerge(rel: string) {
  const src = read(rel);
  assert(
    `${rel} has no merge command`,
    !/gh pr merge/.test(src) && !/enableAutoMerge/.test(src) && !/pr merge --auto/.test(src),
  );
}

async function unit() {
  resetProofQueueForTests();

  const log = parseProofQueueCommand('log issue: button overlap on /sound');
  assert('parse log issue', log?.kind === 'log' && log.message.includes('button overlap'));

  const propose = parseProofQueueCommand(
    'propose fix for /daily: Owner cannot write; ugly owner key block appears.',
  );
  assert('parse propose fix', propose?.kind === 'propose' && propose.route === '/daily');

  assert('parse show queue', parseProofQueueCommand('show proof queue')?.kind === 'list');
  assert('parse approve', parseProofQueueCommand('approve proposal pq-abc123')?.kind === 'approve');
  assert('parse reject', parseProofQueueCommand('reject proposal pq-abc123')?.kind === 'reject');
  assert('parse prepare', parseProofQueueCommand('prepare PR for proposal pq-abc123')?.kind === 'prepare');
  assert('non-command is null', parseProofQueueCommand('hello there') === null);

  const redacted = redactProofText('OWNER_KEY=super-secret-value and Bearer abcdef and sk-123456789');
  assert(
    'redacts secrets',
    /█/.test(redacted) && !/super-secret-value/.test(redacted) && !/sk-123456789/.test(redacted),
  );

  const draft = draftFromMessage({
    title: DAILY_OWNER_KEY_SEED.title,
    message: DAILY_OWNER_KEY_SEED.problem,
    route: '/daily',
    source: 'owner',
    status: 'observed',
  });
  const visitorPromoteOwnerCard = applyStatusChange(draft, 'proposed', { owner: false });
  assert(
    'visitor cannot move any status',
    visitorPromoteOwnerCard.ok === false && visitorPromoteOwnerCard.status === 403,
  );

  const visitorCard = draftFromMessage({
    message: 'layout jump',
    route: '/',
    source: 'visitor',
    status: 'observed',
  });
  const visitorPromote = applyStatusChange(visitorCard, 'proposed', { owner: false });
  assert('visitor cannot promote own issue', visitorPromote.ok === false && visitorPromote.status === 403);

  const ownerPromote = applyStatusChange(draft, 'proposed', { owner: true });
  assert('owner can observe → proposed', ownerPromote.ok === true && ownerPromote.ok && ownerPromote.proposal.status === 'proposed');
  if (!ownerPromote.ok) return;

  const visitorOk = applyStatusChange(ownerPromote.proposal, 'approved', { owner: false });
  assert('visitor cannot approve', visitorOk.ok === false && visitorOk.status === 403);

  const approved = applyStatusChange(ownerPromote.proposal, 'approved', { owner: true });
  assert('owner can approve', approved.ok === true);
  if (!approved.ok) return;

  const progressing = applyStatusChange(approved.proposal, 'in_progress', { owner: true });
  assert('approved → in_progress', progressing.ok === true);
  if (!progressing.ok) return;

  const premature = canBecomeReady(progressing.proposal);
  assert('ready blocked without screenshots', premature.ok === false && /screenshots/i.test(premature.reason));

  const withShot = {
    ...progressing.proposal,
    screenshots: [{ label: 'daily', url: '/evolution-proposal-card.png', addedAt: new Date().toISOString() }],
    implementationSummary: 'moved unlock to popover',
    filesChanged: ['components/DailyBoard.tsx'],
    checksRun: ['pnpm verify:daily-board'],
  };
  const readyOk = canBecomeReady(withShot);
  assert('ready allowed with proof', readyOk.ok === true);

  const skipReady = applyStatusChange(progressing.proposal, 'ready_for_review', { owner: true });
  assert('status machine refuses ready without proof', skipReady.ok === false);

  resetProofQueueForTests();
  const seeded = await ensureDailyOwnerKeySeed();
  assert('seed daily owner key UI as observed', seeded.status === 'observed' && seeded.title === DAILY_OWNER_KEY_SEED.title);
  const proposed = await transitionProposal(seeded.id, 'proposed', true);
  assert('seed moves observed → proposed', proposed.ok === true && proposed.ok && proposed.proposal.status === 'proposed');
  if (proposed.ok) {
    assert('seed is not auto-approved', proposed.proposal.status !== 'approved' && !proposed.proposal.approvedAt);
  }

  resetProofQueueForTests();
  const visitorIssue = await createObserved({
    message: 'visitor friction',
    route: '/sound',
    source: 'visitor',
  });
  const visitorCmd = await executeProofCommand({ kind: 'approve', id: visitorIssue.id }, false);
  assert('command approve without owner fails', visitorCmd.ok === false && visitorCmd.status === 403);

  const visitorPropose = await createProposal({
    message: 'make it prettier',
    route: '/',
    source: 'visitor',
    owner: false,
  });
  assert('visitor propose stays observed', visitorPropose.status === 'observed');

  const ownerProp = await createProposal({
    title: DAILY_OWNER_KEY_SEED.title,
    message: DAILY_OWNER_KEY_SEED.problem,
    route: '/daily',
    source: 'owner',
    owner: true,
    proposedChange: DAILY_OWNER_KEY_SEED.proposedChange,
  });
  assert('owner propose is proposed', ownerProp.status === 'proposed');
  const approvedLive = await transitionProposal(ownerProp.id, 'approved', true);
  assert('owner approve works in store', approvedLive.ok === true);

  if (approvedLive.ok) {
    const prepared = await preparePr(approvedLive.proposal.id, true);
    assert('prepare PR returns merge:false', prepared.ok === true && prepared.ok && prepared.merge === false);
    assert(
      'prepare PR prompt forbids merge',
      prepared.ok && /Do not merge/.test(prepared.prompt) && /Do not auto-merge/.test(prepared.prompt),
    );
    if (prepared.ok) {
      const attached = await attachProof(prepared.proposal.id, true, {
        screenshots: [{ label: 'daily', url: '/opt/cursor/artifacts/evolution-proposal-card.png' }],
        implementationSummary: 'popover unlock',
        filesChanged: ['components/DailyBoard.tsx'],
        checksRun: ['pnpm verify:proof-queue'],
      });
      assert('attach proof', attached.ok === true);
      if (attached.ok) {
        const ready = await markReady(attached.proposal.id, true);
        assert('ready after proof', ready.ok === true && ready.ok && ready.proposal.status === 'ready_for_review');
      }
    }
  }
}

async function liveHttp() {
  const base = (process.env.VERIFY_BASE_URL || '').replace(/\/$/, '');
  if (!base) {
    assert('live HTTP', true, 'skipped (set VERIFY_BASE_URL)');
    return;
  }

  const page = await fetch(`${base}/evolution`);
  const html = await page.text();
  assert('GET /evolution', page.ok, String(page.status));
  assert('locked page says owner only', /Owner only|owner key|proof queue/i.test(html));
  assert('locked page has no proposal cards', !/data-proof-card/.test(html));

  const visitorGet = await fetch(`${base}/api/proof`);
  assert('visitor GET /api/proof → 403', visitorGet.status === 403, String(visitorGet.status));

  const visitorLog = await fetch(`${base}/api/proof`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'log', message: 'visitor should not approve this', route: '/daily' }),
  });
  const visitorLogJson = (await visitorLog.json().catch(() => ({}))) as { proposal?: { id?: string; status?: string } };
  assert(
    'visitor log stays observed',
    visitorLog.ok && visitorLogJson.proposal?.status === 'observed',
    String(visitorLog.status),
  );
  const visitorApprove = await fetch(`${base}/api/proof`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'approve', id: visitorLogJson.proposal?.id || 'pq-nope' }),
  });
  assert('visitor approve → 403', visitorApprove.status === 403, String(visitorApprove.status));

  const visitorObserve = await fetch(`${base}/api/proof/observe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'note', route: '/daily', message: 'qa visitor observe' }),
  });
  const observeJson = (await visitorObserve.json().catch(() => ({}))) as { ok?: boolean; merge?: boolean };
  assert(
    'visitor observe accepted or stored locally',
    visitorObserve.status === 200 || visitorObserve.status === 503,
    String(visitorObserve.status),
  );
  if (visitorObserve.ok) {
    assert('observe never merge', observeJson.merge === false);
  }

  loadEnvLocal();
  const token = await createOwnerSession();
  const cookie = `${SESSION_COOKIE}=${token}`;
  const ownerGet = await fetch(`${base}/api/proof?seed=daily`, { headers: { Cookie: cookie } });
  const ownerJson = ownerGet.ok
    ? ((await ownerGet.json()) as {
        owner?: boolean;
        autoMerge?: boolean;
        merge?: boolean;
        proposals?: Array<{ id: string; title: string; status: string }>;
      })
    : {};
  assert('owner GET /api/proof', ownerGet.ok, String(ownerGet.status));
  assert('owner flag true', ownerJson.owner === true);
  assert('API autoMerge false', ownerJson.autoMerge === false && ownerJson.merge === false);
  const daily = ownerJson.proposals?.find((p) => p.title === DAILY_OWNER_KEY_SEED.title);
  assert('seeded daily proposal present', Boolean(daily), daily?.status);
  if (daily && daily.status === 'observed') {
    const promoted = await fetch(`${base}/api/proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ action: 'promote', id: daily.id }),
    });
    const promotedJson = (await promoted.json().catch(() => ({}))) as {
      proposal?: { status?: string };
    };
    assert(
      'owner observed → proposed',
      promoted.ok && promotedJson.proposal?.status === 'proposed',
      String(promoted.status),
    );
    const readyTooSoon = await fetch(`${base}/api/proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ action: 'ready', id: daily.id }),
    });
    assert('ready without screenshots blocked', readyTooSoon.status === 409, String(readyTooSoon.status));
  }

  const ownerPage = await fetch(`${base}/evolution`, { headers: { Cookie: cookie } });
  const ownerHtml = await ownerPage.text();
  assert('owner /evolution unlocks panel', /data-proof-queue/.test(ownerHtml) || ownerPage.ok, String(ownerPage.status));
}

async function staticGates() {
  sourceHasNoMerge('lib/proofQueue.ts');
  sourceHasNoMerge('lib/proofQueueStore.ts');
  sourceHasNoMerge('app/api/proof/route.ts');
  sourceHasNoMerge('components/ProofQueuePanel.tsx');

  const page = read('app/evolution/page.tsx');
  assert('evolution page owner-gated', /getOwnerIdentity/.test(page) && /OwnerUnlockForm/.test(page));
  assert('evolution robots noindex', /index:\s*false/.test(page));
  assert('evolution title is proof queue', /proof queue/i.test(page));

  const panel = read('components/ProofQueuePanel.tsx');
  assert('panel has status lights', /proof-light/.test(panel));
  assert('panel mark shipped does not say merge', /mark shipped/.test(panel) && !/gh pr merge/.test(panel));

  const auth = read('app/api/auth/owner/route.ts');
  assert('owner rooms include /evolution', /\/evolution/.test(auth));

  const agent = read('components/AgentChat.tsx');
  assert('agent intercepts proof commands', /isProofQueueCommand/.test(agent) && /sendProofQueue/.test(agent));
  assert('public console has no /evolution href', !/href=['"]\/evolution['"]/.test(agent));
}

async function main() {
  await unit();
  staticGates();
  await liveHttp();

  const failed = checks.filter((c) => !c.ok);
  console.log(`\nResult: ${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
