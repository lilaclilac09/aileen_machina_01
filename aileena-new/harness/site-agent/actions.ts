/**
 * Offline gate for the action ledger (lib/agentRuntime/actions.ts): duplicate
 * delivery → one side effect, mid-run failure → resume skips completed steps,
 * concurrent duplicates, and the long-context guard that compacts then checks
 * again (never fails open). Covers chat turn commit/charge, chat forward and
 * lead emails (Resend mocked), the evolve drain checkpoint, bench ingest and
 * the evolve workflow's Action-Id rules. No network, no keys.
 *
 * Run: npx -y tsx harness/site-agent/actions.ts
 */
process.env.RUNTIME_KV = 'memory';
process.env.EVOLUTION_LIVE_INBOX = 'memory';
process.env.AUTH_SECRET ||= 'harness-offline-secret-0123456789abcdef0123456789';
for (const k of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN', 'AGENT_FALLBACK_BASE_URL', 'AGENT_FALLBACK_API_KEY', 'AGENT_API_KEY', 'DEEPSEEK_MODEL']) {
  delete process.env[k];
}
import { readFileSync } from 'node:fs';
import { createServer, type IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import { actionId, readAction, runOnce, runSteps, validActionId } from '../../lib/agentRuntime/actions';
import { resetRuntimeKvForTests } from '../../lib/agentRuntime/kv';
import { breakerFailure, BREAKER_THRESHOLD } from '../../lib/agentRuntime/breaker';
import { markGpuWarm } from '../../lib/agentRuntime/gpu';
import { chooseProvider } from '../../lib/agentRuntime/router';
import { compactTranscript } from '../../lib/agentRuntime/summaryToken';
import { readPerfTurns } from '../../lib/agentRuntime/perf';
import { ackDrain, drainForRun } from '../../lib/evolution/drainHandler';
import { resetLiveInboxForTests, type LiveAsk } from '../../lib/evolution/liveInbox';
import { createOwnerSession, SESSION_COOKIE } from '../../lib/auth';
import { CHAT_DAILY_LIMIT } from '../../lib/chatQuota';

type Row = { name: string; ok: boolean; detail?: string };
const rows: Row[] = [];
const check = (name: string, ok: boolean, detail = '') => rows.push({ name, ok, detail });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Mock DeepSeek / GPU (OpenAI-compatible SSE) ──
const mock = { gpuReqs: 0, dsReqs: 0, delayMs: 0 };
const chunk = (d: Record<string, unknown>, finish: string | null = null) => ({ id: 'c', object: 'chat.completion.chunk', created: 0, model: 'm', choices: [{ index: 0, delta: d, finish_reason: finish }] });
async function drainReq(req: IncomingMessage) {
  for await (const _ of req) void _;
}
const server = createServer(async (req, res) => {
  const url = req.url ?? '';
  await drainReq(req);
  if (url.startsWith('/gpu/health')) return void res.writeHead(200).end('ok');
  if (url.startsWith('/gpu/v1/models')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    return void res.end(JSON.stringify({ data: [{ id: 'open-8b', root: 'Qwen/Qwen3-8B' }] }));
  }
  const gpu = url.startsWith('/gpu/');
  if (gpu) mock.gpuReqs++;
  else mock.dsReqs++;
  if (mock.delayMs) await sleep(mock.delayMs);
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  const w = (c: unknown) => res.write(`data: ${JSON.stringify(c)}\n\n`);
  w(chunk({ role: 'assistant', content: '' }));
  w(chunk({ content: gpu ? 'Hello from the GPU.' : 'Hello from the primary model.' }));
  w(chunk({}, 'stop'));
  w({ id: 'c', object: 'chat.completion.chunk', created: 0, model: 'm', choices: [], usage: { prompt_tokens: 50, completion_tokens: 5, total_tokens: 55 } });
  res.write('data: [DONE]\n\n');
  res.end();
});

// ── Resend mock: intercept api.resend.com, count sends and idempotency keys ──
const resend = { sends: 0, keys: [] as string[], fail: 0, delayMs: 0 };
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url.startsWith('https://api.resend.com/')) {
    const h = new Headers(init?.headers);
    resend.keys.push(h.get('idempotency-key') ?? '');
    if (resend.delayMs) await sleep(resend.delayMs);
    if (resend.fail > 0) {
      resend.fail--;
      return new Response(JSON.stringify({ statusCode: 500, name: 'internal_server_error', message: 'mock outage' }), { status: 500, headers: { 'content-type': 'application/json' } });
    }
    resend.sends++;
    return new Response(JSON.stringify({ id: `email_${resend.sends}` }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  return realFetch(input as RequestInfo, init);
}) as typeof fetch;

let base = '';
// One IP per request so the per-IP burst limit never masks what is under test.
let ipSeq = 0;
const msg = (role: 'user' | 'assistant', text: string, id: string) => ({ id, role, parts: [{ type: 'text', text }] });

async function chat(payload: Record<string, unknown>, cookie = '__aileena_vid=harness-actions-visitor') {
  const { POST } = await import('../../app/api/chat/route');
  const res = await POST(
    new Request('https://aileena.xyz/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.21', 'x-trace-id': `harness-actions-${Math.random().toString(36).slice(2, 8)}`, cookie },
      body: JSON.stringify({ agentMode: 'public', ...payload }),
    }),
  );
  const text = await res.text().catch(() => '');
  await sleep(40);
  return { res, text };
}

function setGpuEnv(extra: Record<string, string> = {}) {
  for (const k of Object.keys(process.env)) if (k.startsWith('AGENT_GPU_')) delete process.env[k];
  Object.assign(process.env, { AGENT_GPU_BASE_URL: `${base}/gpu/v1`, AGENT_GPU_API_KEY: 'test-gpu-key', AGENT_GPU_MODEL: 'open-8b', AGENT_GPU_TTFT_MS: '400', ...extra });
}

async function main() {
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  process.env.DEEPSEEK_API_KEY = 'test-ds-key';
  process.env.DEEPSEEK_BASE_URL = `${base}/ds`;

  // ── Action ids ──
  const a1 = await actionId('email.forward', { b: 2, a: 1 }, 'x');
  const a2 = await actionId('email.forward', { a: 1, b: 2 }, 'x');
  check('id: deterministic, key order ignored', a1 === a2 && validActionId(a1), a1);
  check('id: differs per step and per kind', a1 !== (await actionId('email.forward', { a: 1, b: 2 }, 'y')) && a1 !== (await actionId('email.lead', { a: 1, b: 2 }, 'x')));

  // ── Duplicate delivery → one side effect ──
  resetRuntimeKvForTests();
  let effects = 0;
  const id = await actionId('test.effect', 'turn-1');
  const r1 = await runOnce(id, async () => ++effects);
  const r2 = await runOnce(id, async () => ++effects);
  check('dup: second delivery replays the stored result', effects === 1 && r1.state === 'done' && r2.state === 'replay' && r2.result === 1);
  const rec = await readAction(id);
  check('dup: record says succeeded with result', rec?.status === 'succeeded' && rec.result === 1 && rec.attempts === 1);

  // ── Failure → retry runs again (status per attempt) ──
  let tries = 0;
  const fid = await actionId('test.flaky', 'run-1');
  const f1 = await runOnce(fid, async () => {
    tries++;
    throw new Error('boom');
  });
  check('fail: failed is recorded with the error', f1.state === 'failed' && (await readAction(fid))?.status === 'failed' && (await readAction(fid))?.error === 'boom');
  const f2 = await runOnce(fid, async () => ++tries);
  check('fail: retry runs again and then succeeds (attempt 2)', f2.state === 'done' && f2.attempts === 2 && tries === 2);

  // ── Concurrent duplicates ──
  let conc = 0;
  const cid = await actionId('test.concurrent', 'x');
  const all = await Promise.all(Array.from({ length: 6 }, () => runOnce(cid, async () => { conc++; await sleep(30); return 'r'; })));
  check('concurrent: 6 duplicates → 1 execution', conc === 1 && all.filter((r) => r.state === 'done').length === 1 && all.filter((r) => r.state === 'running').length === 5, JSON.stringify(all.map((r) => r.state)));
  check('concurrent: a later duplicate replays', (await runOnce(cid, async () => { conc++; return 'r2'; })).state === 'replay' && conc === 1);

  // ── Mid-run failure → resume from the first non-succeeded step ──
  const calls: string[] = [];
  let failStep2 = true;
  const steps = [
    { name: 'drain', run: async () => { calls.push('drain'); return ['ask-a']; } },
    { name: 'ratchet', run: async () => { calls.push('ratchet'); if (failStep2) throw new Error('ratchet crashed'); return 'tree-1'; } },
    { name: 'open-pr', run: async (c: { results: Record<string, unknown> }) => { calls.push('open-pr'); return `pr for ${String(c.results.ratchet)}`; } },
  ];
  const run1 = await runSteps('evolve-run-42', steps, { results: {} });
  failStep2 = false;
  const run2 = await runSteps('evolve-run-42', steps, { results: {} });
  check('resume: first run stops at the failing step', !run1.ok && run1.failedAt === 'ratchet' && run1.ran.join() === 'drain,ratchet');
  check('resume: retry skips drain, resumes at ratchet', run2.ok && run2.skipped.join() === 'drain' && run2.ran.join() === 'ratchet,open-pr' && calls.filter((c) => c === 'drain').length === 1, JSON.stringify(run2));
  check('resume: earlier results are passed on', run2.results['open-pr'] === 'pr for tree-1' && JSON.stringify(run2.results.drain) === '["ask-a"]');
  const run3 = await runSteps('evolve-run-42', steps, { results: {} });
  check('resume: a third delivery runs nothing', run3.ok && run3.ran.length === 0 && run3.skipped.length === 3 && calls.length === 4);

  // ── Chat: concurrent duplicates of one turnId charge + commit once ──
  resetRuntimeKvForTests();
  setGpuEnv({});
  delete process.env.AGENT_GPU_BASE_URL;
  mock.delayMs = 40;
  const turn = { sessionId: 'sess_actions_01', turnId: 'turn_actions_01', messages: [msg('user', 'What does she write about chips?', 'm1')] };
  const [d1, d2] = await Promise.all([chat(turn), chat(turn)]);
  mock.delayMs = 0;
  check('chat: both duplicates answered', d1.res.status === 200 && d2.res.status === 200, `${d1.res.status} ${d2.res.status}`);
  const after = await chat({ sessionId: 'sess_actions_01', turnId: 'turn_actions_02', messages: [msg('user', 'What does she write about chips?', 'm1'), msg('assistant', 'x', 'a1'), msg('user', 'And about memory?', 'm2')] });
  check('chat: duplicate turn charged once (next turn sees 1 used)', after.res.headers.get('x-daily-remaining') === String(CHAT_DAILY_LIMIT - 2), String(after.res.headers.get('x-daily-remaining')));
  const replay = await chat(turn);
  check('chat: a later retry of the turnId is replayed', replay.res.headers.get('x-turn-replay') === '1');
  const route = readFileSync('app/api/chat/route.ts', 'utf8');
  check('chat: callMcp runs through the action ledger', /actionId\('mcp\.call'/.test(route) && /runOnce\(id, \(\) => callMcpApp/.test(route));

  // ── Chat forward email: duplicate + concurrent → one send ──
  resetRuntimeKvForTests();
  Object.assign(process.env, { RESEND_API_KEY: 're_test_mock', CONTACT_TO: 'inbox@example.com', RESEND_FROM: 'Site <agent@example.com>' });
  const { POST: forward } = await import('../../app/api/chat/forward/route');
  const { NextRequest } = await import('next/server');
  const fwd = (sid: string) =>
    forward(new NextRequest('https://aileena.xyz/api/chat/forward', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': `198.51.100.${++ipSeq}` },
      body: JSON.stringify({ sessionId: sid, transcript: [{ role: 'user', text: 'Please pass this on to her.' }, { role: 'assistant', text: 'Sent.' }] }),
    }));
  const fa = await fwd('fwdsession01');
  const fb = await fwd('fwdsession01');
  const fbj = (await fb.json()) as { replay?: boolean };
  check('forward: duplicate POST → one email', resend.sends === 1 && fa.status === 200 && fb.status === 200 && fbj.replay === true, `sends=${resend.sends}`);
  check('forward: Resend gets the action id as Idempotency-Key', validActionId(resend.keys[0]) && resend.keys[0].startsWith('email.forward:'), resend.keys[0]);
  resend.delayMs = 40;
  const conc2 = await Promise.all([fwd('fwdsession02'), fwd('fwdsession02'), fwd('fwdsession02')]);
  resend.delayMs = 0;
  check('forward: 3 concurrent duplicates → one email', resend.sends === 2 && conc2.every((r) => r.status === 200 || r.status === 202), conc2.map((r) => r.status).join());
  resend.fail = 1;
  const ff = await fwd('fwdsession03');
  const fr = await fwd('fwdsession03');
  check('forward: failed send is retried (not replayed as failure)', ff.status === 502 && fr.status === 200 && resend.sends === 3, `${ff.status} ${fr.status}`);

  // ── Lead email: double submit → one email ──
  const { POST: lead } = await import('../../app/api/lead/route');
  const leadReq = () =>
    lead(new NextRequest('https://aileena.xyz/api/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': `198.51.100.${++ipSeq}` },
      body: JSON.stringify({ email: 'visitor@example.com', note: 'Building a validator dashboard', transcript: [{ role: 'user', text: 'Can she help?' }] }),
    }));
  const before = resend.sends;
  const l1 = await leadReq();
  const l2 = await leadReq();
  check('lead: double submit → one email', l1.status === 200 && l2.status === 200 && resend.sends === before + 1, `${l1.status} ${l2.status} sends=${resend.sends - before}`);

  // ── Evolve drain checkpoint ──
  resetRuntimeKvForTests();
  resetLiveInboxForTests();
  const box = (globalThis as { __aileenaLiveInbox?: { items: LiveAsk[] } }).__aileenaLiveInbox!;
  const ask = (p: string): LiveAsk => ({ at: new Date().toISOString(), prompt: p, source: 'chat' });
  box.items.push(ask('ask one about kilns'), ask('ask two about gates'));
  const dA = await drainForRun('run-100');
  box.items.push(ask('ask three about relays'));
  const dA2 = await drainForRun('run-100');
  check('drain: re-run of the same run gets the same asks back', dA2.replay === true && JSON.stringify(dA2.asks) === JSON.stringify(dA.asks) && dA.asks.length === 2 && box.items.length === 1);
  const dB = await drainForRun('run-101');
  check('drain: next run adopts the unacked (failed) run and pops fresh', dB.adopted === 2 && dB.asks.length === 3 && box.items.length === 0, JSON.stringify(dB));
  await ackDrain('run-101');
  box.items.push(ask('ask four about fans'));
  const dC = await drainForRun('run-102');
  check('drain: acked or adopted runs are not adopted again', dC.adopted === 0 && dC.asks.length === 1, JSON.stringify(dC));

  // ── Bench ingest: same report twice → stored once ──
  resetRuntimeKvForTests();
  const owner = await createOwnerSession();
  const { POST: perfPost } = await import('../../app/api/agent/perf/route');
  const report = { run: 'bench-dup', turns: Array.from({ length: 30 }, (_, i) => ({ provider: 'deepseek', model: 'deepseek-flash', ttftMs: 300 + i, latencyMs: 900, inTok: 100, outTok: 10 })) };
  const post = () => perfPost(new Request('https://aileena.xyz/api/agent/perf', { method: 'POST', headers: { 'content-type': 'application/json', cookie: `${SESSION_COOKIE}=${encodeURIComponent(owner)}` }, body: JSON.stringify(report) }));
  const p1 = (await (await post()).json()) as { stored: number };
  const p2 = (await (await post()).json()) as { stored: number; replayed: boolean };
  const stored = (await readPerfTurns(500)).filter((t) => t.run === 'bench-dup').length;
  check('bench: duplicate report stored once', p1.stored === 30 && p2.stored === 0 && p2.replayed && stored === 30, `${p1.stored} ${p2.stored} ${stored}`);

  // ── Long context: compact, check again, never fail open ──
  const long = (n: number) => 'She writes about chips, memory and the physics of fast systems. '.repeat(Math.ceil(n / 64)).slice(0, n);
  const conv = [] as ReturnType<typeof msg>[];
  for (let i = 0; i < 5; i++) conv.push(msg('user', `Question ${i}: ${long(12_000)}`, `u${i}`), msg('assistant', long(12_000), `a${i}`));
  conv.push(msg('user', 'Short last question about her latest article?', 'u9'));
  const c = compactTranscript(conv as never, 2);
  check('compact: keeps the newest turn, folds older questions into the summary', !!c && c.messages.length === 1 && c.messages[0].id === 'u9' && c.summary.turns === 5 && c.summary.questions.length === 5);
  check('compact: nothing to fold → null (caller keeps its deny)', compactTranscript([msg('user', 'hi', 'x')] as never, 2) === null);

  resetRuntimeKvForTests();
  setGpuEnv({ AGENT_GPU_MODE: 'public', AGENT_GPU_FAILOVER: '1' });
  for (let i = 0; i < BREAKER_THRESHOLD; i++) await breakerFailure('deepseek');
  await markGpuWarm();
  const pick = { provider: 'deepseek', tier: 'primary', model: 'deepseek-flash' } as never;
  const gpuPick = { provider: 'gpu:open-8b', tier: 'gpu', model: 'open-8b' } as never;
  const { readGpuConfig } = await import('../../lib/agentRuntime/gpu');
  const dec = await chooseProvider({ primary: pick, gpu: gpuPick, fallback: null, cfg: readGpuConfig(), isOwner: false, estTokens: 40_000, toolRoute: 'default', rootKey: 'r', shanghaiVoice: false });
  check('router: over-context prompt never fails open to the GPU', !dec.ok && dec.contextTooLong === true, JSON.stringify(dec));

  mock.gpuReqs = 0;
  const lc = await chat({ messages: conv });
  check('chat: long context + only GPU usable → compacted, answered by GPU', lc.res.status === 200 && lc.res.headers.get('x-provider') === 'gpu:open-8b' && /Hello from the GPU/.test(lc.text) && mock.gpuReqs >= 1, `${lc.res.status} ${lc.res.headers.get('x-provider')} gpu=${mock.gpuReqs}`);
  resetRuntimeKvForTests();
  for (let i = 0; i < BREAKER_THRESHOLD; i++) await breakerFailure('deepseek');
  await markGpuWarm();
  mock.gpuReqs = 0;
  const huge = await chat({ messages: [msg('user', `Question: ${long(140_000)}`, 'u1')] });
  check('chat: still too long after compaction → 503, GPU never called', huge.res.status === 503 && mock.gpuReqs === 0, `${huge.res.status} gpu=${mock.gpuReqs}`);

  // ── Evolve workflow: Action-Id rules ──
  const wf = readFileSync('../.github/workflows/site-agent-evolve.yml', 'utf8');
  check('workflow: concurrency group, no cancel', /concurrency:\s*\n\s*group: site-agent-live-evolve\s*\n\s*cancel-in-progress: false/.test(wf));
  check('workflow: Action-Id from stable inputs, not time / run id', /ACTION_ID="evolve-\$\(/.test(wf) && /BRANCH="self-improve\/\$\{ACTION_ID\}"/.test(wf) && !/BRANCH=.*GITHUB_RUN_ID/.test(wf));
  check('workflow: commit carries the Action-Id trailer', /-m "Action-Id: \$\{ACTION_ID\}"/.test(wf));
  check('workflow: pushed branch / existing PR are checkpoints (no duplicates)', /ls-remote --exit-code --heads origin "\$BRANCH"/.test(wf) && /gh pr list --head "\$BRANCH" --state all/.test(wf));
  check('workflow: drain is acked only after the PR step', /Ack drain checkpoint/.test(wf) && wf.indexOf('Ack drain checkpoint') > wf.indexOf('Open self-improve PR'));
  for (const f of ['../.github/workflows/github-profile-readme-sync.yml', '../.github/workflows/social-rss-sync.yml', '../.github/scripts/push-generated-memory.sh']) {
    check(`automation commit has Action-Id trailer: ${f.split('/').pop()}`, /-m "Action-Id: \$\(bash \.github\/scripts\/action-id\.sh /.test(readFileSync(f, 'utf8')));
  }

  server.close();
  const failed = rows.filter((r) => !r.ok);
  for (const r of rows) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name}${r.ok || !r.detail ? '' : ` — ${r.detail}`}`);
  console.log(`\nactions: ${rows.length - failed.length}/${rows.length}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
