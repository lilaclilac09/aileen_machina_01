#!/usr/bin/env tsx
/**
 * Computer workspace prototype — static + live HTTP owner/public gates.
 *
 *   pnpm verify:computer-prototype
 *   VERIFY_BASE_URL=http://127.0.0.1:3000 pnpm verify:computer-prototype
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createOwnerSession, SESSION_COOKIE } from '../lib/auth';
import { inspectRouteFiles, analyzeDailyFixPlan } from '../lib/computer/inspect';
import { parseOwnerComputerCommand } from '../lib/computer/parseOwnerCommand';
import { redactSecrets } from '../lib/computer/redact';
import { isComputerPrototypeEnabled } from '../lib/computer/flag';
import { workspaceReadFile, workspaceRuntimeProbe, workspaceWriteFile } from '../lib/computer/workspace';

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

function sourceChecks() {
  const chat = readFileSync(join(process.cwd(), 'app/api/chat/route.ts'), 'utf8');
  const tasks = readFileSync(join(process.cwd(), 'app/api/agent/computer/tasks/route.ts'), 'utf8');
  const flag = readFileSync(join(process.cwd(), 'lib/computer/flag.ts'), 'utf8');
  const runner = readFileSync(join(process.cwd(), 'lib/computer/runner.ts'), 'utf8');
  assert('chat stays edge', /export const runtime = 'edge'/.test(chat));
  assert('chat does not import computer runner', !/from ['"].*computer\/runner['"]/.test(chat));
  assert('tasks route is nodejs', /export const runtime = 'nodejs'/.test(tasks));
  assert('tasks route owner-gated', /requireOwnerFromRequest/.test(tasks));
  assert('no arbitrary shell field', /forbiddenShellFields/.test(tasks));
  assert('production hard-off', /VERCEL_ENV === 'production'/.test(flag));
  assert('runner does not merge', /not performed/.test(runner) || /owner approval/.test(runner));
  assert('runner backend is local-shim', /local-shim/.test(runner));
  assert('does not import @cloudflare/computer', !existsSync(join(process.cwd(), 'node_modules/@cloudflare/computer')));
}

function unitChecks() {
  assert('hi is not a computer command', parseOwnerComputerCommand('hi') === null);
  assert('what did she write is not a computer command', parseOwnerComputerCommand('what did she write about solana?') === null);
  const daily = parseOwnerComputerCommand('prepare fix for /daily owner key UI');
  assert(
    'prepare fix /daily queues draft_daily_fix_plan',
    daily?.kind === 'queue_task' && daily.taskType === 'draft_daily_fix_plan' && daily.route === '/daily',
  );
  assert('show proof queue is fast', parseOwnerComputerCommand('show proof queue')?.kind === 'show_queue');
  assert('redact OWNER_KEY', redactSecrets('set OWNER_KEY=secret') === 'set [redacted]=secret');
  assert('prototype enabled in this verify process', isComputerPrototypeEnabled() === true, String(isComputerPrototypeEnabled()));

  const inspected = inspectRouteFiles('/daily');
  assert(
    'inspects daily files',
    inspected.some((f) => f.path.endsWith('DailyBoard.tsx') && f.exists),
    inspected.filter((f) => !f.exists).map((f) => f.path).join(',') || 'all exist',
  );
  const plan = analyzeDailyFixPlan(inspected);
  assert('finds owner key UI problem', plan.problemsFound.some((p) => /owner key/i.test(p)));
  assert('finds note path', plan.problemsFound.some((p) => /note/i.test(p)));
  assert('finds comment path', plan.problemsFound.some((p) => /comment/i.test(p)));
  assert('does not list merge as a step', !plan.implementationPlan.some((p) => /merge this/i.test(p)));
}

async function workspaceUnit() {
  await workspaceWriteFile('owner', '/scratch/hello.txt', 'hello');
  const back = await workspaceReadFile('owner', '/scratch/hello.txt');
  assert('workspace write/read', back === 'hello');
  const probe = await workspaceRuntimeProbe();
  assert('workspace runtime probe', probe.exitCode === 0 && probe.stdout === 'ok');
  let denied = false;
  try {
    await workspaceWriteFile('owner', '/etc/passwd', 'nope');
  } catch {
    denied = true;
  }
  assert('workspace rejects non-allowlisted path', denied);
}

async function pollTask(base: string, cookie: string, id: string) {
  const started = Date.now();
  while (Date.now() - started < 20_000) {
    const res = await fetch(`${base}/api/agent/computer/tasks/${id}`, { headers: { Cookie: cookie } });
    if (!res.ok) return { ok: false as const, status: res.status };
    const body = (await res.json()) as {
      status?: string;
      task?: { status?: string; filesInspected?: string[]; artifacts?: unknown[]; proofItemId?: string };
      proofItem?: { status?: string; computerTaskIds?: string[] };
    };
    const st = body.task?.status || body.status;
    if (st === 'completed' || st === 'failed') return { ok: true as const, body, st };
    await new Promise((r) => setTimeout(r, 250));
  }
  return { ok: false as const, status: 'timeout' };
}

async function liveHttp() {
  const base = (process.env.VERIFY_BASE_URL || '').replace(/\/$/, '');
  if (!base) {
    assert('live HTTP', true, 'skipped (set VERIFY_BASE_URL)');
    return;
  }

  const page = await fetch(`${base}/proof`);
  const html = page.ok ? await page.text() : '';
  assert('GET /proof', page.ok, String(page.status));
  assert('visitor /proof shows owner door', html.includes('OwnerUnlockForm') || html.includes('owner key') || html.includes('enter proof'));
  assert('visitor /proof hides queue panel', !html.includes('proof-queue-daily'));

  const forbidden = await fetch(`${base}/api/agent/computer/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskType: 'draft_daily_fix_plan', route: '/daily' }),
  });
  assert('visitor POST computer tasks → 403', forbidden.status === 403, String(forbidden.status));

  const visitorGet = await fetch(`${base}/api/agent/computer/tasks`);
  assert('visitor GET computer tasks → 403', visitorGet.status === 403, String(visitorGet.status));

  const shell = await fetch(`${base}/api/agent/computer/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskType: 'draft_daily_fix_plan', command: 'rm -rf /' }),
  });
  assert(
    'shell field rejected (visitor or 400/403)',
    shell.status === 403 || shell.status === 400,
    String(shell.status),
  );

  const token = await createOwnerSession();
  const cookie = `${SESSION_COOKIE}=${token}`;

  const ownerShell = await fetch(`${base}/api/agent/computer/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ taskType: 'draft_daily_fix_plan', command: 'ls', exec: 'whoami' }),
  });
  assert('owner arbitrary shell → 400', ownerShell.status === 400, String(ownerShell.status));

  const created = await fetch(`${base}/api/agent/computer/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      taskType: 'draft_daily_fix_plan',
      route: '/daily',
      instructions: 'prepare fix for /daily owner key UI',
    }),
  });
  assert('owner POST queues 202', created.status === 202, String(created.status));
  const createdJson = created.ok || created.status === 202 ? ((await created.json()) as {
    message?: string;
    task?: { id?: string };
    proofItem?: { id?: string; status?: string };
  }) : {};
  assert('immediate ⚡ queued.', createdJson.message === '⚡ queued.', createdJson.message);
  const taskId = createdJson.task?.id || '';
  assert('task id returned', Boolean(taskId), taskId);

  const polled = await pollTask(base, cookie, taskId);
  assert('task completed', polled.ok && polled.st === 'completed', String(polled.ok ? polled.st : polled.status));
  if (polled.ok) {
    const files = polled.body.task?.filesInspected ?? [];
    assert('inspected DailyBoard', files.some((f) => f.includes('DailyBoard.tsx')));
    assert('has artifact report', Array.isArray(polled.body.task?.artifacts) && (polled.body.task?.artifacts?.length ?? 0) > 0);
    assert(
      'proof attached',
      Boolean(polled.body.proofItem?.computerTaskIds?.includes(taskId)),
    );
    assert(
      'proof needs_screenshots or ready_for_review',
      polled.body.proofItem?.status === 'needs_screenshots' || polled.body.proofItem?.status === 'ready_for_review',
      polled.body.proofItem?.status,
    );
  }

  const scratch = await fetch(`${base}/api/agent/computer/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ taskType: 'write_scratch_file', route: '/proof' }),
  });
  const scratchJson = scratch.status === 202 ? ((await scratch.json()) as { task?: { id?: string } }) : {};
  const scratchId = scratchJson.task?.id || '';
  const scratchDone = scratchId ? await pollTask(base, cookie, scratchId) : { ok: false as const, status: scratch.status };
  assert('scratch task completed', scratchDone.ok && scratchDone.st === 'completed', String(scratchDone.ok ? scratchDone.st : scratchDone.status));

  const chat = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      agentMode: 'public',
      messages: [
        {
          id: 'u1',
          role: 'user',
          parts: [{ type: 'text', text: 'prepare fix for /daily owner key UI' }],
        },
      ],
    }),
  });
  assert('owner chat fast path 200', chat.ok, String(chat.status));
  assert(
    'owner chat X-Computer-Fast-Path',
    chat.headers.get('x-computer-fast-path') === '1',
    chat.headers.get('x-computer-fast-path') ?? 'missing',
  );
  const chatText = await chat.text();
  assert('owner chat says queued', /queued/i.test(chatText), chatText.slice(0, 180));

  const visitorChat = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentMode: 'public',
      messages: [
        {
          id: 'u2',
          role: 'user',
          parts: [{ type: 'text', text: 'prepare fix for /daily owner key UI' }],
        },
      ],
    }),
  });
  assert(
    'visitor chat is not computer fast path',
    visitorChat.headers.get('x-computer-fast-path') !== '1',
    visitorChat.headers.get('x-computer-fast-path') ?? 'none',
  );
}

async function main() {
  loadEnvLocal();
  if (!process.env.COMPUTER_PROTOTYPE) process.env.COMPUTER_PROTOTYPE = '1';
  sourceChecks();
  unitChecks();
  await workspaceUnit();
  await liveHttp();
  const failed = checks.filter((c) => !c.ok);
  console.log(`\nResult: ${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
