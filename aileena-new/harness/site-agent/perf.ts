/**
 * Offline gate for the inference performance dashboard: per-turn records from
 * /api/chat (via a local mock DeepSeek/GPU), pricing, aggregations, breaker /
 * GPU events, the owner-only API and the bench script. No network, no keys.
 *
 * Run: npx -y tsx harness/site-agent/perf.ts
 */
process.env.RUNTIME_KV = 'memory';
process.env.AUTH_SECRET ||= 'harness-offline-secret-0123456789abcdef0123456789';
for (const k of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN', 'AGENT_FALLBACK_BASE_URL', 'AGENT_FALLBACK_API_KEY', 'AGENT_API_KEY', 'DEEPSEEK_MODEL', 'AGENT_GPU_VARIANT', 'AGENT_GPU_USD_PER_HOUR', 'AGENT_GPU_TYPE']) {
  delete process.env[k];
}
import { createServer, type IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import { resetRuntimeKvForTests, runtimeKv } from '../../lib/agentRuntime/kv';
import { breakerFailure, breakerGate, breakerPeek, breakerSuccess, BREAKER_THRESHOLD, BREAKER_COOLDOWN_MS } from '../../lib/agentRuntime/breaker';
import { markGpuWarm, readGpuConfig, wakeGpu } from '../../lib/agentRuntime/gpu';
import { readPerfDays, readPerfEvents, readPerfTurns, sanitizeBenchTurn, type PerfTurn } from '../../lib/agentRuntime/perf';
import { compareKey, decodeTokPerSec, percentile, summarize, timeSeries } from '../../lib/agentRuntime/perfStats';
import { deepSeekPrice, estimateTurnCostUsd, isDeepSeekPeak, tokenCostUsd } from '../../lib/agentRuntime/pricing';
import { createOwnerSession, SESSION_COOKIE } from '../../lib/auth';
import { benchReport, runSiteBench } from '../../scripts/bench-inference';

type Row = { name: string; ok: boolean; detail?: string };
const rows: Row[] = [];
const check = (name: string, ok: boolean, detail = '') => rows.push({ name, ok, detail });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const near = (a: number | null | undefined, b: number, eps = 1e-9) => typeof a === 'number' && Math.abs(a - b) < eps;

// ── Mock OpenAI-compatible server ──
const mock = { ds: [] as Array<'ok' | 'empty' | 'mid'>, gpuModels: ['open-8b', 'open-8b.fp8-ngram'] };
const chunk = (d: Record<string, unknown>, finish: string | null = null) => ({ id: 'c', object: 'chat.completion.chunk', created: 0, model: 'm', choices: [{ index: 0, delta: d, finish_reason: finish }] });
const usage = { id: 'c', object: 'chat.completion.chunk', created: 0, model: 'm', choices: [], usage: { prompt_tokens: 900, completion_tokens: 6, total_tokens: 906, prompt_cache_hit_tokens: 640, prompt_cache_miss_tokens: 260, prompt_tokens_details: { cached_tokens: 640 } } };
async function drain(req: IncomingMessage) {
  for await (const _ of req) void _;
}
const server = createServer(async (req, res) => {
  const url = req.url ?? '';
  await drain(req);
  if (url.startsWith('/gpu/health')) return void res.writeHead(200).end('ok');
  if (url.startsWith('/gpu/v1/models')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    return void res.end(JSON.stringify({ data: mock.gpuModels.map((id) => ({ id, root: 'Qwen/Qwen3-8B' })) }));
  }
  const mode = url.startsWith('/ds/') ? (mock.ds.shift() ?? 'ok') : 'ok';
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  const w = (c: unknown) => res.write(`data: ${JSON.stringify(c)}\n\n`);
  w(chunk({ role: 'assistant', content: '' }));
  if (mode === 'mid') {
    w(chunk({ content: 'Half an answer. ' }));
    return void setTimeout(() => res.destroy(), 30);
  }
  if (mode === 'ok') w(chunk({ content: url.startsWith('/gpu/') ? 'Hello from the GPU.' : 'Hello from the primary model.' }));
  w(chunk({}, 'stop'));
  w(usage);
  res.write('data: [DONE]\n\n');
  res.end();
});

let base = '';
let owner = '';
const QUESTION = 'zxqv perf probe: what is on this site';

async function chat(payload: Record<string, unknown>, o: { owner?: boolean; headers?: Record<string, string> } = {}) {
  const { POST } = await import('../../app/api/chat/route');
  const res = await POST(
    new Request('https://aileena.xyz/api/chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.9',
        'x-trace-id': `harness-perf-${Math.random().toString(36).slice(2, 8)}`,
        cookie: [`__aileena_vid=harness-perf-visitor`, o.owner ? `${SESSION_COOKIE}=${encodeURIComponent(owner)}` : ''].filter(Boolean).join('; '),
        ...(o.headers ?? {}),
      },
      body: JSON.stringify({ agentMode: 'public', messages: [{ id: 'm1', role: 'user', parts: [{ type: 'text', text: QUESTION }] }], ...payload }),
    }),
  );
  const text = await res.text().catch(() => '');
  await sleep(60); // perf writes are fire-and-forget
  return { res, text };
}

function turn(p: Partial<PerfTurn>): PerfTurn {
  return { v: 1, id: Math.random().toString(36).slice(2), at: Date.now(), src: 'site', provider: 'deepseek', tier: 'primary', rule: 'default', ttftMs: 500, prepMs: 50, latencyMs: 1500, modelMs: 1400, inTok: 1000, outTok: 100, cacheHit: 800, cacheMiss: 200, costUsd: 0.0001, steps: 1, tools: 0, finish: 'stop', outcome: 'ok', retries: 0, ...p };
}

async function main() {
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  process.env.DEEPSEEK_API_KEY = 'test-ds-key';
  process.env.DEEPSEEK_BASE_URL = `${base}/ds`;
  owner = await createOwnerSession();

  // ── Pricing (sources in lib/agentRuntime/pricing.ts) ──
  check('pricing: Fri 02:00 UTC is DeepSeek peak', isDeepSeekPeak(Date.parse('2026-10-16T02:00:00Z')));
  check('pricing: Fri 05:00 / 12:00 UTC off-peak', !isDeepSeekPeak(Date.parse('2026-10-16T05:00:00Z')) && !isDeepSeekPeak(Date.parse('2026-10-16T12:00:00Z')));
  check('pricing: weekend off-peak', !isDeepSeekPeak(Date.parse('2026-10-17T02:00:00Z')));
  const peak = deepSeekPrice('deepseek-flash', Date.parse('2026-10-16T02:00:00Z'))!;
  const off = deepSeekPrice('deepseek-flash', Date.parse('2026-10-16T12:00:00Z'))!;
  check('pricing: flash peak $0.006 / $0.30 / $1.20 per 1M', peak.inHit === 0.006 && peak.inMiss === 0.3 && peak.out === 1.2);
  check('pricing: off-peak is half', off.inHit === 0.003 && off.inMiss === 0.15 && off.out === 0.6);
  check('pricing: legacy deepseek-chat billed as flash', JSON.stringify(deepSeekPrice('deepseek-chat', 0)) === JSON.stringify(deepSeekPrice('deepseek-flash', 0)));
  check('pricing: token cost math', near(tokenCostUsd(peak, { inTok: 900, hit: 640, miss: 260, outTok: 6 }), (640 * 0.006 + 260 * 0.3 + 6 * 1.2) / 1e6));
  check('pricing: GPU time share (L40S $0.000542/s)', near(estimateTurnCostUsd({ provider: 'gpu:open-8b', at: 0, inTok: 0, outTok: 0, hit: null, miss: null, modelMs: 2000 }), 0.001084));
  process.env.AGENT_GPU_USD_PER_HOUR = '3.6';
  check('pricing: AGENT_GPU_USD_PER_HOUR override', near(estimateTurnCostUsd({ provider: 'gpu:x', at: 0, inTok: 0, outTok: 0, hit: null, miss: null, modelMs: 1000 }), 0.001));
  delete process.env.AGENT_GPU_USD_PER_HOUR;
  check('pricing: unknown provider → null cost', estimateTurnCostUsd({ provider: 'fallback:x', at: 0, inTok: 1, outTok: 1, hit: null, miss: null, modelMs: 1 }) === null);

  // ── Aggregations ──
  check('stats: percentile p50/p95', percentile([1, 2, 3, 4, 100], 0.5) === 3 && percentile([1, 2, 3, 4, 100], 0.95) === 100 && percentile([], 0.5) === null);
  const ts = [turn({ ttftMs: 400 }), turn({ ttftMs: 600, cacheHit: 0, cacheMiss: 1000 }), turn({ outcome: 'empty', retries: 0 }), turn({ outcome: 'ok', retries: 1 }), turn({ outcome: 'degrade', ttftMs: null })];
  const s = summarize(ts);
  check('stats: summary counts + rates', s.n === 5 && near(s.rates.empty, 0.2) && near(s.rates.retry, 0.2) && near(s.rates.degrade, 0.2));
  check('stats: cache hit rate over input tokens', near(s.cacheHitRate, (800 * 4) / (5000)), String(s.cacheHitRate));
  check('stats: decode tok/s', near(decodeTokPerSec(turn({ ttftMs: 500, latencyMs: 1500, outTok: 100 })), 100));
  const now = Date.parse('2026-10-16T12:30:00Z');
  const series = timeSeries([turn({ at: now - 10 * 60_000, ttftMs: 700 }), turn({ at: now - 3 * 3_600_000 })], { now });
  check('stats: 24 hourly buckets, turns land in the right hour', series.length === 24 && series[23].n === 1 && series[23].ttftP50 === 700 && series[20].n === 1);
  check('stats: compare key splits GPU variants', compareKey(turn({ provider: 'gpu:open-8b', variant: 'fp8-ngram' })) === 'gpu:open-8b · fp8-ngram' && compareKey(turn({ model: 'deepseek-flash' })) === 'deepseek · deepseek-flash');
  check('stats: bench record sanitized', (() => {
    const b = sanitizeBenchTurn({ provider: 'deepseek<script>', latencyMs: -5, ttftMs: 300, outcome: 'weird', text: 'secret' }, 'run 1!');
    return !!b && b.provider === 'deepseekscript' && b.latencyMs === 0 && b.outcome === 'ok' && b.run === 'run1' && !('text' in b);
  })());

  // ── KV list/hash (memory backend) ──
  resetRuntimeKvForTests();
  const kv = runtimeKv();
  await kv.listPush('t:l', [1], 3, 60);
  await kv.listPush('t:l', [2, 3], 3, 60);
  await kv.listPush('t:l', [4], 3, 60);
  check('kv: capped list, newest first', JSON.stringify(await kv.listRange('t:l', 10)) === '[4,3,2]');
  await kv.hashIncr('t:h', { a: 2, b: 0 }, 60);
  await kv.hashIncr('t:h', { a: 1, c: 5 }, 60);
  check('kv: hash increments', JSON.stringify(await kv.hashGetAll('t:h')) === '{"a":3,"c":5}');

  // ── /api/chat records one turn ──
  resetRuntimeKvForTests();
  for (const k of Object.keys(process.env)) if (k.startsWith('AGENT_GPU_')) delete process.env[k];
  const t1 = await chat({});
  const [r1] = await readPerfTurns(5);
  check('turn: answered on deepseek', t1.res.status === 200 && /Hello from the primary/.test(t1.text));
  check('turn: provider/model/rule recorded', r1?.provider === 'deepseek' && r1.model === 'deepseek-flash' && r1.rule === 'default' && r1.tier === 'primary', JSON.stringify(r1));
  check('turn: TTFT ≤ latency, prep ≤ TTFT', !!r1 && r1.ttftMs !== null && r1.ttftMs > 0 && r1.ttftMs <= r1.latencyMs && r1.prepMs <= r1.ttftMs);
  check('turn: tokens + DeepSeek cache fields', r1?.inTok === 900 && r1.outTok === 6 && r1.cacheHit === 640 && r1.cacheMiss === 260, JSON.stringify(r1 && { i: r1.inTok, o: r1.outTok, h: r1.cacheHit, m: r1.cacheMiss }));
  const p = deepSeekPrice('deepseek-flash', r1?.at ?? Date.now())!;
  check('turn: cost from list prices', near(r1?.costUsd, tokenCostUsd(p, { inTok: 900, hit: 640, miss: 260, outTok: 6 })));
  check('turn: outcome ok, no retries, src site', r1?.outcome === 'ok' && r1.retries === 0 && r1.src === 'site');
  const raw = JSON.stringify(await readPerfTurns(5));
  check('privacy: no question text, IP, visitor id or trace id stored', !raw.includes('zxqv') && !raw.includes('203.0.113') && !raw.includes('harness-perf') && !raw.includes('Hello from'));
  const [d1] = await readPerfDays(1);
  check('turn: per-day counters', d1.counters.turns === 1 && d1.counters['o:ok'] === 1 && d1.counters['p:deepseek'] === 1 && d1.counters.cacheHit === 640);

  // ── flags: empty retry, degrade, drop ──
  resetRuntimeKvForTests();
  mock.ds = ['empty'];
  await chat({});
  let list = await readPerfTurns(5);
  check('flags: empty attempt + retried answer', list.length === 2 && list.some((t) => t.outcome === 'empty') && list.some((t) => t.outcome === 'ok' && t.retries === 1), JSON.stringify(list.map((t) => [t.outcome, t.retries])));
  resetRuntimeKvForTests();
  mock.ds = ['empty', 'empty'];
  await chat({});
  list = await readPerfTurns(5);
  check('flags: empty twice → two empty + one degrade', list.filter((t) => t.outcome === 'empty').length === 2 && list.filter((t) => t.outcome === 'degrade' && t.rule === 'empty_answer').length === 1, JSON.stringify(list.map((t) => t.outcome)));
  resetRuntimeKvForTests();
  mock.ds = ['mid'];
  await chat({});
  await sleep(100);
  list = await readPerfTurns(5);
  check('flags: mid-stream drop recorded as drop', list.length === 1 && list[0].outcome === 'drop', JSON.stringify(list.map((t) => t.outcome)));
  resetRuntimeKvForTests();
  for (let i = 0; i < BREAKER_THRESHOLD; i++) await breakerFailure('deepseek');
  const t503 = await chat({});
  list = await readPerfTurns(5);
  check('flags: breaker open → degrade turn (circuit_open)', t503.res.status === 503 && list[0]?.outcome === 'degrade' && list[0].rule === 'circuit_open');

  // ── breaker + GPU events ──
  resetRuntimeKvForTests();
  const t0 = Date.now();
  for (let i = 0; i < BREAKER_THRESHOLD; i++) await breakerFailure('deepseek', t0);
  await breakerGate('deepseek', t0 + BREAKER_COOLDOWN_MS + 1);
  await breakerSuccess('deepseek');
  await breakerSuccess('deepseek');
  await sleep(20);
  const ev = (await readPerfEvents(10)).filter((e) => e.kind === 'breaker').map((e) => `${e.from}>${e.to}`).reverse();
  check('events: breaker closed>open>half-open>closed (once)', JSON.stringify(ev) === '["closed>open","open>half-open","half-open>closed"]', JSON.stringify(ev));
  check('events: breakerPeek is read-only', (await breakerPeek('deepseek')) === 'closed');
  resetRuntimeKvForTests();
  Object.assign(process.env, { AGENT_GPU_MODE: 'owner', AGENT_GPU_BASE_URL: `${base}/gpu/v1`, AGENT_GPU_API_KEY: 'test-gpu-key', AGENT_GPU_MODEL: 'open-8b', AGENT_GPU_TTFT_MS: '1500' });
  const cfg = readGpuConfig()!;
  const w = await wakeGpu(cfg);
  await w.done;
  await markGpuWarm();
  await sleep(20);
  const gev = (await readPerfEvents(10)).map((e) => `${e.kind}:${e.from}>${e.to}`).reverse();
  check('events: wake then WARMING>WARM once', gev[0] === 'wake:COLD>WARMING' && gev.filter((e) => e === 'gpu:WARMING>WARM').length === 1, JSON.stringify(gev));
  check('events: cold start duration recorded', (await readPerfEvents(10)).some((e) => e.to === 'WARM' && typeof e.ms === 'number'));

  // ── GPU turn tagged with the server-reported variant ──
  const tg = await chat({ modelTier: 'gpu' }, { owner: true });
  await sleep(100);
  const g = (await readPerfTurns(5)).find((t) => t.provider.startsWith('gpu'));
  check('gpu turn: answered on GPU', tg.res.headers.get('x-provider') === 'gpu:open-8b');
  check('gpu turn: variant from /v1/models alias', g?.variant === 'fp8-ngram' && g.rule === 'owner_gpu', JSON.stringify(g && { v: g.variant, r: g.rule }));
  check('gpu turn: vLLM cached_tokens + time-share cost', g?.cacheHit === 640 && typeof g.costUsd === 'number' && g.costUsd > 0);
  for (const k of Object.keys(process.env)) if (k.startsWith('AGENT_GPU_')) delete process.env[k];

  // ── bench tagging: owner only ──
  resetRuntimeKvForTests();
  await chat({}, { headers: { 'x-perf-source': 'bench', 'x-perf-run': 'evil run' } });
  await chat({}, { owner: true, headers: { 'x-perf-source': 'bench', 'x-perf-run': 'run-a' } });
  list = await readPerfTurns(5);
  check('bench: visitor cannot tag bench turns', list.some((t) => t.src === 'site' && !t.run));
  check('bench: owner bench turn tagged with run id', list.some((t) => t.src === 'bench' && t.run === 'run-a'));

  // ── owner-only API ──
  const api = await import('../../app/api/agent/perf/route');
  const anon = await api.GET(new Request('https://aileena.xyz/api/agent/perf'));
  const anonPost = await api.POST(new Request('https://aileena.xyz/api/agent/perf', { method: 'POST', body: '{}' }));
  check('api: non-owner GET 403', anon.status === 403);
  check('api: non-owner POST 403', anonPost.status === 403);
  const cookie = `${SESSION_COOKIE}=${encodeURIComponent(owner)}`;
  const own = await api.GET(new Request('https://aileena.xyz/api/agent/perf?src=all', { headers: { cookie } }));
  const body = (await own.json()) as { summary: { n: number }; backend: string; status: { breakers: Record<string, string> }; compare: unknown[] };
  check('api: owner GET 200 with summary/status/compare', own.status === 200 && body.summary.n === 2 && body.backend === 'memory' && body.status.breakers.deepseek === 'closed' && body.compare.length >= 1);
  const ingest = await api.POST(
    new Request('https://aileena.xyz/api/agent/perf', { method: 'POST', headers: { cookie }, body: JSON.stringify({ run: 'direct-1', turns: [{ provider: 'gpu', model: 'open-8b', variant: 'awq', ttftMs: 120, latencyMs: 900, outTok: 80 }] }) }),
  );
  const bench = (await (await api.GET(new Request('https://aileena.xyz/api/agent/perf?src=bench', { headers: { cookie } }))).json()) as { benchRuns: Array<{ key: string }> };
  check('api: owner POST ingests a direct bench run', ingest.status === 200 && bench.benchRuns.some((r) => r.key.startsWith('direct-1 · gpu')), JSON.stringify(bench.benchRuns.map((r) => r.key)));

  // ── bench script (site mode) through the real handlers ──
  resetRuntimeKvForTests();
  const chatMod = await import('../../app/api/chat/route');
  const fetchImpl = async (url: string, init?: RequestInit) => {
    const req = new Request(url, { ...init, headers: { 'x-forwarded-for': '203.0.113.9', ...(init?.headers as Record<string, string>) } });
    return new URL(url).pathname === '/api/chat' ? chatMod.POST(req) : api.GET(req);
  };
  const out = await runSiteBench({ base: 'https://aileena.xyz', cookie: owner, n: 3, tier: 'deepseek', run: 'offline-run', fetchImpl });
  const rep = benchReport(out.turns);
  check('bench: 3 owner turns ok with client TTFT', rep.ok === 3 && rep.ttftP50 !== null && rep.providers.join() === 'deepseek', JSON.stringify(rep));
  check('bench: server-side run row (tokens/cache) returned', Array.isArray(out.server) && (out.server as Array<{ s: { n: number; cacheHitRate: number } }>)[0]?.s.n === 3, JSON.stringify(out.server).slice(0, 200));

  server.close();
  const failed = rows.filter((r) => !r.ok);
  for (const r of rows) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.detail && !r.ok ? ` — ${r.detail}` : ''}`);
  console.log(`\nperf: ${rows.length - failed.length}/${rows.length}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
