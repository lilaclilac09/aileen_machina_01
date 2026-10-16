/**
 * Offline gate for the model router + GPU tier (no network beyond 127.0.0.1,
 * no secrets, no Redis). A tiny mock OpenAI-compatible server plays both
 * DeepSeek and the self-hosted GPU, so /api/chat runs end to end.
 *
 * Run: npx -y tsx harness/site-agent/gpuRouter.ts
 */
process.env.RUNTIME_KV = 'memory';
process.env.AUTH_SECRET ||= 'harness-offline-secret-0123456789abcdef0123456789';
for (const k of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN', 'AGENT_FALLBACK_BASE_URL', 'AGENT_FALLBACK_API_KEY', 'AGENT_API_KEY', 'DEEPSEEK_MODEL']) {
  delete process.env[k];
}
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { resetRuntimeKvForTests } from '../../lib/agentRuntime/kv';
import { breakerFailure, breakerGate, BREAKER_THRESHOLD } from '../../lib/agentRuntime/breaker';
import { readRedisQuota, quotaKeyFor } from '../../lib/agentRuntime/quota';
import {
  drainGpu,
  markGpuWarm,
  probeGpu,
  readGpuConfig,
  readGpuState,
  sanitizeGpuProviderId,
  wakeGpu,
} from '../../lib/agentRuntime/gpu';
import { canaryBucket, chooseProvider, estimateTokens, peekFirstToken } from '../../lib/agentRuntime/router';
import { estimateTurnMicroUsd } from '../../lib/agentRuntime/load';
import {
  buildFallback,
  buildGpu,
  buildPrimary,
  deepSeekRequestBody,
  gpuRequestBody,
  isCircuitOpen,
  isModelMissingError,
  recordModelFailure,
  recordModelSuccess,
  resetDeepSeekModelLatchForTests,
  DEEPSEEK_DEFAULT_MODEL,
  DEEPSEEK_LEGACY_MODEL,
} from '../../lib/modelRouter';
import { classifyRootProvider, frozenRootIdentity, machinaRootSpoken } from '../../lib/consolePrefixCopy';
import { createOwnerSession, SESSION_COOKIE } from '../../lib/auth';

type Row = { name: string; ok: boolean; detail?: string };
const rows: Row[] = [];
const check = (name: string, ok: boolean, detail = '') => rows.push({ name, ok, detail });

// ── Mock OpenAI-compatible server ──────────────────────────────────────────
type GpuBehavior = 'ok' | 'empty' | 'error503' | 'silent' | 'midstream' | 'slowstream' | 'tool-always' | 'tool-once';
const mock = {
  gpu: 'ok' as GpuBehavior,
  health: 200,
  healthHits: 0,
  dsMissingFlash: false,
  dsMidstream: false,
  dsQueue: [] as Array<'empty' | 'ws' | 'ok'>,
  fb: 0,
  ds: [] as Record<string, unknown>[],
  gpuReqs: [] as Record<string, unknown>[],
  gpuClosedEarly: 0,
};

function sse(res: ServerResponse, chunks: unknown[], end = true) {
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
  for (const c of chunks) res.write(`data: ${JSON.stringify(c)}\n\n`);
  if (end) {
    res.write('data: [DONE]\n\n');
    res.end();
  }
}
const delta = (d: Record<string, unknown>, finish: string | null = null) => ({
  id: 'c1',
  object: 'chat.completion.chunk',
  created: 0,
  model: 'm',
  choices: [{ index: 0, delta: d, finish_reason: finish }],
});
const usage = (prompt: number, cached: number) => ({
  id: 'c1',
  object: 'chat.completion.chunk',
  created: 0,
  model: 'm',
  choices: [],
  usage: { prompt_tokens: prompt, completion_tokens: 6, total_tokens: prompt + 6, prompt_tokens_details: { cached_tokens: cached }, prompt_cache_hit_tokens: cached, prompt_cache_miss_tokens: prompt - cached },
});
const textAnswer = (text: string) => [delta({ role: 'assistant', content: '' }), delta({ content: text }), delta({}, 'stop'), usage(900, 640)];
const emptyAnswer = (ws = false) => [delta({ role: 'assistant', content: '' }), ...(ws ? [delta({ content: '  \n ' })] : []), delta({}, 'stop'), usage(900, 640)];
const toolCall = (id: string) => [
  delta({ role: 'assistant', content: null, tool_calls: [{ index: 0, id, type: 'function', function: { name: 'searchArticles', arguments: '{"query":"pcb article"}' } }] }),
  delta({}, 'tool_calls'),
  usage(900, 640),
];

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const parts: Buffer[] = [];
  for await (const c of req) parts.push(c as Buffer);
  try {
    return JSON.parse(Buffer.concat(parts).toString('utf8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

const server = createServer(async (req, res) => {
  const url = req.url ?? '';
  if (url.startsWith('/gpu/health')) {
    mock.healthHits++;
    res.writeHead(mock.health);
    res.end(mock.health === 200 ? 'ok' : 'no replica');
    return;
  }
  const body = await readBody(req);
  if (url.startsWith('/ds/')) {
    mock.ds.push(body);
    if (mock.dsMissingFlash && body.model !== DEEPSEEK_LEGACY_MODEL) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'Model Not Exist', type: 'invalid_request_error' } }));
      return;
    }
    const queued = mock.dsQueue.shift();
    if (queued === 'empty' || queued === 'ws') {
      sse(res, emptyAnswer(queued === 'ws'));
      return;
    }
    if (mock.dsMidstream) {
      sse(res, [delta({ role: 'assistant', content: '' }), delta({ content: 'Hello from the primary. ' })], false);
      setTimeout(() => res.destroy(), 50);
      return;
    }
    sse(res, textAnswer('Hello from the primary model.'));
    return;
  }
  if (url.startsWith('/fb/')) {
    mock.fb++;
    sse(res, textAnswer('Hello from the fallback.'));
    return;
  }
  if (url.startsWith('/gpu/v1/models')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ data: [{ id: 'open-8b', root: 'Qwen/Qwen3-8B' }] }));
    return;
  }
  if (url.startsWith('/gpu/v1/')) {
    mock.gpuReqs.push(body);
    res.on('close', () => {
      if (!res.writableFinished) mock.gpuClosedEarly++;
    });
    const b = mock.gpu;
    if (b === 'error503') {
      res.writeHead(503);
      res.end('cold');
      return;
    }
    if (b === 'empty') {
      sse(res, emptyAnswer());
      return;
    }
    if (b === 'silent') {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      return; // never sends a token
    }
    if (b === 'midstream') {
      sse(res, [delta({ role: 'assistant', content: '' }), delta({ content: 'Hello from the GPU. ' })], false);
      setTimeout(() => res.destroy(), 50);
      return;
    }
    if (b === 'slowstream') {
      sse(res, [delta({ role: 'assistant', content: '' }), delta({ content: 'Hello from the GPU. ' })], false);
      const t = setInterval(() => {
        if (res.writableEnded || res.destroyed) return clearInterval(t);
        res.write(`data: ${JSON.stringify(delta({ content: 'more words here. ' }))}\n\n`);
      }, 100);
      return;
    }
    if (b === 'tool-always') {
      sse(res, toolCall(`call_${mock.gpuReqs.length}`));
      return;
    }
    if (b === 'tool-once') {
      const first = !(body.messages as Array<{ role: string }>).some((m) => m.role === 'tool');
      sse(res, first ? toolCall('call_1') : textAnswer('Her PCB article covers board layout.'));
      return;
    }
    sse(res, textAnswer('Hello from the GPU.'));
    return;
  }
  res.writeHead(404);
  res.end();
});

let base = '';
let ownerCookie = '';
const msg = (text: string, id = 'm1') => ({ id, role: 'user', parts: [{ type: 'text', text }] });

function setGpuEnv(extra: Record<string, string> = {}) {
  for (const k of Object.keys(process.env)) if (k.startsWith('AGENT_GPU_')) delete process.env[k];
  Object.assign(process.env, {
    AGENT_GPU_BASE_URL: `${base}/gpu/v1`,
    AGENT_GPU_API_KEY: 'test-gpu-key',
    AGENT_GPU_MODEL: 'open-8b',
    AGENT_GPU_TTFT_MS: '400',
    ...extra,
  });
}

function reset() {
  resetRuntimeKvForTests();
  resetDeepSeekModelLatchForTests();
  recordModelSuccess();
  mock.gpu = 'ok';
  mock.health = 200;
  mock.healthHits = 0;
  mock.dsMissingFlash = false;
  mock.dsMidstream = false;
  mock.dsQueue = [];
  mock.fb = 0;
  delete process.env.AGENT_FALLBACK_BASE_URL;
  delete process.env.AGENT_FALLBACK_API_KEY;
  mock.ds = [];
  mock.gpuReqs = [];
  mock.gpuClosedEarly = 0;
}

async function chat(
  payload: Record<string, unknown>,
  opts: { owner?: boolean; signal?: AbortSignal; cookie?: string } = {},
): Promise<{ res: Response; text: string }> {
  const { POST } = await import('../../app/api/chat/route');
  const cookies = [opts.owner ? `${SESSION_COOKIE}=${encodeURIComponent(ownerCookie)}` : '', opts.cookie ?? ''].filter(Boolean).join('; ');
  const res = await POST(
    new Request('https://aileena.xyz/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-trace-id': `harness-gpu-${Math.random().toString(36).slice(2, 10)}`, 'x-forwarded-for': '203.0.113.7', ...(cookies ? { cookie: cookies } : {}) },
      body: JSON.stringify({ agentMode: 'public', ...payload }),
      signal: opts.signal,
    }),
  );
  let text = '';
  try {
    text = await res.text();
  } catch (e) {
    if (process.env.GPU_HARNESS_DEBUG) console.log('BODYERR', e);
  }
  return { res, text };
}

const systemOf = (b: Record<string, unknown> | undefined) =>
  String(((b?.messages as Array<{ role: string; content: unknown }>) ?? []).find((m) => m.role === 'system')?.content ?? '');

async function main() {
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  process.env.DEEPSEEK_API_KEY = 'test-ds-key';
  process.env.DEEPSEEK_BASE_URL = `${base}/ds`;
  ownerCookie = await createOwnerSession();
  const q = 'hi, what does she work on?';

  // ── Units ──
  check('unit: gpu provider id never contains "qwen"', sanitizeGpuProviderId('gpu:qwen3-8b') === 'gpu:open3-8b' && sanitizeGpuProviderId('qwen3') === 'gpu:open3');
  check('unit: gpu:* root is gpu, not on-device', classifyRootProvider('gpu:qwen3-8b') === 'gpu' && classifyRootProvider('fallback:qwen-plus') === 'fallback');
  check('unit: plain on-device qwen still on-device', classifyRootProvider('qwen') === 'qwen');
  check('unit: gpu identity line', /self-hosts on a rented GPU/.test(frozenRootIdentity('gpu:open-8b')) && !/on-device/i.test(frozenRootIdentity('gpu:open-8b')));
  check('unit: gpu spoken line (en/zh)', /rented GPU/.test(machinaRootSpoken('gpu:open-8b')) && /GPU/.test(machinaRootSpoken('gpu:open-8b', 'zh')));
  check('unit: deepseek-flash gets thinking disabled', JSON.stringify(deepSeekRequestBody(DEEPSEEK_DEFAULT_MODEL, { a: 1 })) === '{"a":1,"thinking":{"type":"disabled"}}');
  check('unit: legacy deepseek-chat body untouched', JSON.stringify(deepSeekRequestBody(DEEPSEEK_LEGACY_MODEL, { a: 1 })) === '{"a":1}');
  check('unit: gpu body disables template thinking', (gpuRequestBody(true, {}) as { chat_template_kwargs?: { enable_thinking?: boolean } }).chat_template_kwargs?.enable_thinking === false);
  check('unit: model-missing error detected', isModelMissingError(new Error('Model Not Exist')) && !isModelMissingError(new Error('rate limit')));
  check('unit: canary bucket stable 0..99', canaryBucket('r_abc') === canaryBucket('r_abc') && canaryBucket('r_abc') >= 0 && canaryBucket('r_abc') < 100);
  check('unit: token estimate', estimateTokens(3500) === 1000);
  check('unit: spend estimate (peak $/MTok)', estimateTurnMicroUsd({ hit: 1_000_000, miss: 0, out: 0 }) === 6_000 && estimateTurnMicroUsd({ hit: 0, miss: 0, out: 1_000_000 }) === 1_200_000);
  setGpuEnv({ AGENT_GPU_MODE: 'off' });
  check('unit: AGENT_GPU_MODE=off → no GPU config', readGpuConfig() === null);
  setGpuEnv({});
  check('unit: unset mode → off', readGpuConfig() === null);
  setGpuEnv({ AGENT_GPU_MODE: 'owner', AGENT_GPU_API_KEY: '' });
  check('unit: mode without key → off', readGpuConfig() === null);

  // ── GPU lifecycle ──
  reset();
  setGpuEnv({ AGENT_GPU_MODE: 'owner' });
  const cfg = readGpuConfig()!;
  check('life: starts COLD', (await readGpuState()).state === 'COLD');
  mock.health = 503;
  const w1 = await wakeGpu(cfg);
  await w1.done;
  check('life: wake → WARMING (health 503)', w1.sent && (await readGpuState()).state === 'WARMING');
  mock.health = 200;
  const p1 = await probeGpu(cfg);
  check('life: probe 200 → WARM', p1.state === 'WARM' && (await readGpuState()).state === 'WARM');
  await drainGpu();
  check('life: drain → DRAINING, wake is a no-op', (await readGpuState()).state === 'DRAINING' && !(await wakeGpu(cfg)).sent);
  reset();
  mock.health = 503;
  const t0 = Date.now();
  await (await wakeGpu(cfg, { now: t0 })).done;
  await probeGpu(cfg, { now: t0 + cfg.startupTimeoutS * 1000 + 1 });
  check('life: WARMING past startup timeout → COLD', (await readGpuState()).state === 'COLD');

  // ── T1: GPU off → today's behavior, deepseek-flash, thinking off ──
  reset();
  setGpuEnv({});
  const off1 = await chat({ messages: [msg(q)] });
  const dsBody = mock.ds[0];
  check('T1 GPU off: 200 on deepseek', off1.res.status === 200 && off1.res.headers.get('x-provider') === 'deepseek', `${off1.res.status} ${off1.res.headers.get('x-provider')}`);
  check('T1 GPU off: model deepseek-flash, thinking disabled', dsBody?.model === 'deepseek-flash' && JSON.stringify(dsBody?.thinking) === '{"type":"disabled"}', JSON.stringify({ model: dsBody?.model, thinking: dsBody?.thinking }));
  check('T1 GPU off: GPU never contacted', mock.gpuReqs.length === 0 && mock.healthHits === 0);
  check('T1 GPU off: answer streamed', /Hello from the primary model/.test(off1.text));
  setGpuEnv({ AGENT_GPU_MODE: 'off' });
  const off2 = await chat({ messages: [msg(q)] });
  check('T1 GPU off: same prefix hash with mode=off vs unset', off1.res.headers.get('x-prefix-hash') === off2.res.headers.get('x-prefix-hash') && !!off1.res.headers.get('x-prefix-hash'));
  check('T1 GPU off: no tier debug leak to visitors', off1.res.headers.get('x-model-tier') === null);
  process.env.DEEPSEEK_MODEL = 'deepseek-v4-pro';
  await chat({ messages: [msg(q)] });
  check('T1 DEEPSEEK_MODEL overrides id', mock.ds[mock.ds.length - 1]?.model === 'deepseek-v4-pro');
  delete process.env.DEEPSEEK_MODEL;

  // ── T1b: flash id missing → legacy deepseek-chat latch ──
  reset();
  setGpuEnv({});
  mock.dsMissingFlash = true;
  await chat({ messages: [msg(q)] });
  const latched = await chat({ messages: [msg(q)] });
  check('T1b model missing → next turn uses deepseek-chat', mock.ds[mock.ds.length - 1]?.model === 'deepseek-chat' && /Hello from the primary model/.test(latched.text), String(mock.ds.map((b) => b.model)));
  check('T1b legacy request has no thinking field', mock.ds[mock.ds.length - 1]?.thinking === undefined);

  // ── T2: DeepSeek breaker open → GPU when WARM; COLD → 503 + one wake ──
  reset();
  setGpuEnv({ AGENT_GPU_MODE: 'public', AGENT_GPU_FAILOVER: '1' });
  for (let i = 0; i < BREAKER_THRESHOLD; i++) await breakerFailure('deepseek');
  await markGpuWarm();
  const t2 = await chat({ messages: [msg(q)] });
  check('T2 primary open + GPU warm → gpu', t2.res.headers.get('x-provider') === 'gpu:open-8b' && /Hello from the GPU/.test(t2.text), `${t2.res.status} ${t2.res.headers.get('x-provider')}`);
  reset();
  setGpuEnv({ AGENT_GPU_MODE: 'public', AGENT_GPU_FAILOVER: '1' });
  for (let i = 0; i < BREAKER_THRESHOLD; i++) await breakerFailure('deepseek');
  mock.health = 503;
  const t2b = await chat({ messages: [msg(q)] });
  await new Promise((r) => setTimeout(r, 50));
  check('T2 primary open + GPU cold → 503 circuit_open', t2b.res.status === 503 && t2b.res.headers.get('x-degrade-reason') === 'circuit_open', String(t2b.res.status));
  check('T2 cold → exactly one wake sent', mock.healthHits === 1 && mock.gpuReqs.length === 0, `health=${mock.healthHits}`);
  reset();
  setGpuEnv({ AGENT_GPU_MODE: 'public' });
  for (let i = 0; i < BREAKER_THRESHOLD; i++) await breakerFailure('deepseek');
  await markGpuWarm();
  const t2c = await chat({ messages: [msg(q)] });
  check('T2 failover flag off → no GPU for visitors', t2c.res.status === 503 && mock.gpuReqs.length === 0);

  // ── T3: sticky root ──
  reset();
  setGpuEnv({ AGENT_GPU_MODE: 'public', AGENT_GPU_CANARY_PCT: '100' });
  await markGpuWarm();
  const t3 = await chat({ messages: [msg(q)], sessionProvider: 'deepseek', sessionId: 'r_sticky0001' });
  check('T3 locked deepseek root stays deepseek under 100% canary', t3.res.headers.get('x-provider') === 'deepseek' && mock.gpuReqs.length === 0);
  const t3b = await chat({ messages: [msg(q)], sessionId: 'r_sticky0002' });
  check('T3 new root under 100% canary → gpu', t3b.res.headers.get('x-provider') === 'gpu:open-8b');
  const t3c = await chat({ messages: [msg(q)], sessionProvider: 'gpu:open-8b', sessionId: 'r_sticky0002' });
  check('T3 locked gpu root stays gpu', t3c.res.headers.get('x-provider') === 'gpu:open-8b');
  await drainGpu();
  const t3d = await chat({ messages: [msg(q)], sessionProvider: 'gpu:open-8b', sessionId: 'r_sticky0002' });
  check('T3 drained GPU + gpu lock → 409 model_swap (client resends on new root)', t3d.res.status === 409 && /model_swap/.test(t3d.text));

  // ── T4: owner override; visitors cannot pick a tier ──
  reset();
  setGpuEnv({ AGENT_GPU_MODE: 'owner' });
  await markGpuWarm();
  const t4 = await chat({ messages: [msg(q)], modelTier: 'gpu' });
  check('T4 visitor modelTier=gpu ignored', t4.res.headers.get('x-provider') === 'deepseek' && mock.gpuReqs.length === 0);
  const t4b = await chat({ messages: [msg(q)], modelTier: 'gpu' }, { owner: true });
  check('T4 owner modelTier=gpu + WARM → gpu', t4b.res.headers.get('x-provider') === 'gpu:open-8b' && t4b.res.headers.get('x-model-tier') === 'gpu', `${t4b.res.status} ${t4b.res.headers.get('x-provider')}`);
  reset();
  setGpuEnv({ AGENT_GPU_MODE: 'owner' });
  mock.health = 503;
  const t4c = await chat({ messages: [msg(q)], modelTier: 'gpu' }, { owner: true });
  await new Promise((r) => setTimeout(r, 50));
  check('T4 owner + COLD → answered by deepseek, wake sent', t4c.res.headers.get('x-provider') === 'deepseek' && mock.healthHits === 1 && (await readGpuState()).state === 'WARMING');
  reset();
  setGpuEnv({ AGENT_GPU_MODE: 'owner', AGENT_GPU_CANARY_PCT: '100' });
  await markGpuWarm();
  const t4d = await chat({ messages: [msg(q)], sessionId: 'r_ownermode01' });
  check('T4 mode=owner ignores visitor canary', t4d.res.headers.get('x-provider') === 'deepseek');

  // ── T5: context guard ──
  reset();
  setGpuEnv({ AGENT_GPU_MODE: 'public', AGENT_GPU_CANARY_PCT: '100', AGENT_GPU_MAX_CONTEXT: '4096' });
  await markGpuWarm();
  const t5 = await chat({ messages: [msg(`${'tell me about her writing on chips and memory. '.repeat(40)}`)], sessionId: 'r_context001' });
  check('T5 long prompt never goes to the GPU', t5.res.headers.get('x-provider') === 'deepseek' && mock.gpuReqs.length === 0);

  // ── T6: pre-first-token failover ──
  reset();
  setGpuEnv({ AGENT_GPU_MODE: 'public', AGENT_GPU_CANARY_PCT: '100' });
  await markGpuWarm();
  mock.gpu = 'silent';
  const t6start = Date.now();
  const t6 = await chat({ messages: [msg(q)], sessionId: 'r_failover01' });
  check('T6 silent GPU → answered by deepseek', t6.res.status === 200 && t6.res.headers.get('x-provider') === 'deepseek' && /Hello from the primary model/.test(t6.text), `${t6.res.status} ${t6.res.headers.get('x-provider')}`);
  check('T6 failover within TTFT + margin', Date.now() - t6start < 5_000, `${Date.now() - t6start}ms`);
  check('T6 deepseek root identity (not gpu) after failover', /speaking model is DeepSeek/.test(systemOf(mock.ds[0])) && !/rented GPU/.test(systemOf(mock.ds[0])));
  const gpuGate = await breakerGate('gpu:open-8b');
  check('T6 GPU failure counted, GPU marked COLD', gpuGate.allowed && (await readGpuState()).state !== 'WARM');
  reset();
  setGpuEnv({ AGENT_GPU_MODE: 'public', AGENT_GPU_CANARY_PCT: '100' });
  await markGpuWarm();
  mock.gpu = 'error503';
  const t6b = await chat({ messages: [msg(q)], sessionId: 'r_failover02' });
  check('T6 GPU 503 → deepseek', t6b.res.headers.get('x-provider') === 'deepseek' && /Hello from the primary model/.test(t6b.text));
  await markGpuWarm();
  mock.gpu = 'silent';
  const t6c = await chat({ messages: [msg(q)], sessionId: 'r_failover03', sessionProvider: 'gpu:open-8b' });
  check('T6 failover on a gpu-locked root → 409 model_swap', t6c.res.status === 409 && /model_swap/.test(t6c.text));

  // ── T7: mid-stream GPU error → degrade copy, no commit, no charge ──
  reset();
  setGpuEnv({ AGENT_GPU_MODE: 'public', AGENT_GPU_CANARY_PCT: '100' });
  await markGpuWarm();
  mock.gpu = 'midstream';
  const t7 = await chat({ messages: [msg(q)], sessionId: 'r_midstrm01', turnId: 'r_midstrm01-1' }, { cookie: '__aileena_vid=harness-mid-visitor' });
  const dayKey = new Date().toISOString().slice(0, 10);
  const ipReq = () => new Request('https://aileena.xyz', { headers: { 'x-forwarded-for': '203.0.113.7' } });
  check('T7 mid-stream error stays on gpu (bytes already sent, no switch)', t7.res.headers.get('x-provider') === 'gpu:open-8b');
  check('T7 mid-stream drop ends with the degrade copy (error part), not a broken body', /"type":"error","errorText":"[^"]*(quiet|again)/.test(t7.text) && /Hello from the GPU/.test(t7.text) && t7.text.trimEnd().endsWith('[DONE]'), JSON.stringify(t7.text.slice(-200)));
  check('T7 mid-stream error → turn not charged', (await readRedisQuota(await quotaKeyFor(ipReq(), 'harness-mid-visitor', dayKey))) === 0);
  check('T7 mid-stream error → GPU called once (no retry)', mock.gpuReqs.length === 1);
  // Parity: a socket reset mid-SSE terminates the body the same way on DeepSeek (pre-existing on main).
  reset();
  setGpuEnv({});
  mock.dsMidstream = true;
  const t7b = await chat({ messages: [msg(q)] }, { cookie: '__aileena_vid=harness-mid-visitor2' });
  mock.dsMidstream = false;
  await chat({ messages: [msg(q)] }, { cookie: '__aileena_vid=harness-mid-control' });
  await new Promise((r) => setTimeout(r, 50));
  check('T7 control: a completed turn IS charged', (await readRedisQuota(await quotaKeyFor(ipReq(), 'harness-mid-control', dayKey))) === 1);
  check('T7 deepseek mid-stream drop also ends with the degrade copy', /"type":"error","errorText"/.test(t7b.text), JSON.stringify(t7b.text.slice(-200)));
  check('T7 parity: deepseek mid-stream reset not charged either', t7b.res.status === 200 && (await readRedisQuota(await quotaKeyFor(ipReq(), 'harness-mid-visitor2', dayKey))) === 0);

  // ── E: empty-answer retry ──
  const textOf = (body: string) =>
    body
      .split('\n')
      .filter((l) => l.startsWith('data: {'))
      .map((l) => JSON.parse(l.slice(6)) as { type: string; delta?: string })
      .filter((p) => p.type === 'text-delta')
      .map((p) => p.delta ?? '')
      .join('');
  const charged = async (vid: string) => readRedisQuota(await quotaKeyFor(ipReq(), vid, dayKey));
  const odd = 'zxqv empty probe: tell me one thing about the site';
  reset();
  setGpuEnv({});
  mock.dsQueue = ['empty'];
  const e1 = await chat({ messages: [msg(odd)] }, { cookie: '__aileena_vid=harness-empty-1' });
  await new Promise((r) => setTimeout(r, 50));
  check('E1 empty stream → retried once on the same provider → answer', e1.res.status === 200 && textOf(e1.text) === 'Hello from the primary model.' && mock.ds.length === 2, `ds=${mock.ds.length} text=${JSON.stringify(textOf(e1.text))}`);
  check('E1 no degrade header on a recovered turn', e1.res.headers.get('x-degrade-reason') === null && e1.res.headers.get('x-provider') === 'deepseek');
  check('E1 charged exactly once', (await charged('harness-empty-1')) === 1);
  check('E1 retry keeps the same prefix (same root)', systemOf(mock.ds[0]) === systemOf(mock.ds[1]));

  reset();
  setGpuEnv({});
  mock.dsQueue = ['empty', 'ws'];
  const e2 = await chat({ messages: [msg(odd)] }, { cookie: '__aileena_vid=harness-empty-2' });
  await new Promise((r) => setTimeout(r, 50));
  check('E2 empty twice (2nd whitespace-only) → degrade copy, not an empty bubble', /Something went quiet/.test(textOf(e2.text)) && e2.res.headers.get('x-degrade-reason') === 'empty_answer', JSON.stringify(textOf(e2.text)));
  check('E2 exactly two upstream attempts', mock.ds.length === 2);
  check('E2 not charged (at most once)', (await charged('harness-empty-2')) === 0);
  check('E2 stream is a well-formed UI stream', /"type":"start"/.test(e2.text) && /"type":"finish"/.test(e2.text) && e2.text.trimEnd().endsWith('[DONE]'));

  reset();
  setGpuEnv({});
  process.env.AGENT_FALLBACK_BASE_URL = `${base}/fb`;
  process.env.AGENT_FALLBACK_API_KEY = 'test-fb-key';
  mock.dsQueue = ['empty', 'empty'];
  const e3 = await chat({ messages: [msg(odd)] }, { cookie: '__aileena_vid=harness-empty-3' });
  await new Promise((r) => setTimeout(r, 50));
  check('E3 empty twice + fallback configured (new root) → fallback answers', textOf(e3.text) === 'Hello from the fallback.' && (e3.res.headers.get('x-provider') ?? '').startsWith('fallback:') && mock.fb === 1, `${e3.res.headers.get('x-provider')} ${JSON.stringify(textOf(e3.text))}`);
  check('E3 charged exactly once', (await charged('harness-empty-3')) === 1);
  mock.dsQueue = ['empty', 'empty'];
  const e3b = await chat({ messages: [msg(odd)], sessionProvider: 'deepseek' }, { cookie: '__aileena_vid=harness-empty-3b' });
  await new Promise((r) => setTimeout(r, 50));
  check('E3 root locked to deepseek never switches speaker → degrade copy', /Something went quiet/.test(textOf(e3b.text)) && mock.fb === 1 && e3b.res.headers.get('x-provider') === 'deepseek');
  check('E3 locked-root degrade not charged', (await charged('harness-empty-3b')) === 0);

  reset();
  setGpuEnv({ AGENT_GPU_MODE: 'owner' });
  await markGpuWarm();
  mock.gpu = 'empty';
  const e4 = await chat({ messages: [msg(odd)], modelTier: 'gpu' }, { owner: true });
  check('E4 GPU empty twice → retried on GPU, then DeepSeek answers', textOf(e4.text) === 'Hello from the primary model.' && mock.gpuReqs.length === 2 && e4.res.headers.get('x-provider') === 'deepseek', `gpu=${mock.gpuReqs.length} ${e4.res.headers.get('x-provider')}`);
  const g4 = await breakerGate('gpu:open-8b');
  check('E4 empty answers are not breaker failures', g4.allowed && !g4.probe);

  reset();
  setGpuEnv({});
  const e5 = await chat({ messages: [msg('what does her PCB article say?')] }, { cookie: '__aileena_vid=harness-empty-5' });
  check('E5 normal turn: one upstream call, no retry', mock.ds.length === 1 && textOf(e5.text) === 'Hello from the primary model.');

  // ── T8: cancel on a GPU turn ──
  reset();
  setGpuEnv({ AGENT_GPU_MODE: 'public', AGENT_GPU_CANARY_PCT: '100' });
  await markGpuWarm();
  mock.gpu = 'slowstream';
  const ac = new AbortController();
  const vidCookie = '__aileena_vid=harness-cancel-visitor';
  const p8 = chat({ messages: [msg(q)], sessionId: 'r_cancel0001' }, { signal: ac.signal, cookie: vidCookie });
  await new Promise((r) => setTimeout(r, 600));
  ac.abort();
  await p8.catch(() => null);
  await new Promise((r) => setTimeout(r, 300));
  const g8 = await breakerGate('gpu:open-8b');
  check('T8 cancel is not a GPU breaker failure', g8.allowed);
  check('T8 upstream GPU connection closed on cancel', mock.gpuClosedEarly >= 1, `closedEarly=${mock.gpuClosedEarly}`);
  const day = new Date().toISOString().slice(0, 10);
  const key8 = await quotaKeyFor(new Request('https://aileena.xyz', { headers: { 'x-forwarded-for': '203.0.113.7' } }), 'harness-cancel-visitor', day);
  check('T8 cancelled turn not charged', (await readRedisQuota(key8)) === 0);

  // ── T9: tool loop on the GPU ──
  reset();
  setGpuEnv({ AGENT_GPU_MODE: 'public', AGENT_GPU_CANARY_PCT: '100' });
  await markGpuWarm();
  mock.gpu = 'tool-once';
  const t9 = await chat({ messages: [msg('what does her PCB article say?')], sessionId: 'r_tools00001' });
  check('T9 GPU tool call → tool result → answer', /PCB article covers board layout/.test(t9.text) && mock.gpuReqs.length === 2, `reqs=${mock.gpuReqs.length}`);
  check('T9 tool result sent back as role=tool', JSON.stringify(mock.gpuReqs[1]?.messages ?? []).includes('"role":"tool"'));
  reset();
  setGpuEnv({ AGENT_GPU_MODE: 'public', AGENT_GPU_CANARY_PCT: '100' });
  await markGpuWarm();
  mock.gpu = 'tool-always';
  await chat({ messages: [msg('what does her PCB article say?')], sessionId: 'r_tools00002' });
  const last = mock.gpuReqs[mock.gpuReqs.length - 1];
  check('T9 duplicate tool call blocked by reactGuard', JSON.stringify(mock.gpuReqs[2]?.messages ?? []).includes('duplicate_tool'));
  check('T9 step cap forces a final answer (tool_choice none)', mock.gpuReqs.length === 4 && last?.tool_choice === 'none', `reqs=${mock.gpuReqs.length} last=${JSON.stringify(last?.tool_choice)}`);
  check('T9 GPU request carries enable_thinking=false', JSON.stringify(mock.gpuReqs[0]?.chat_template_kwargs) === '{"enable_thinking":false}');
  check('T9 GPU request authenticates with the API key model id open-8b', mock.gpuReqs[0]?.model === 'open-8b');

  // ── T10: identity + stable prefix on a GPU root ──
  reset();
  setGpuEnv({ AGENT_GPU_MODE: 'public', AGENT_GPU_CANARY_PCT: '100' });
  await markGpuWarm();
  const a10 = await chat({ messages: [msg(q)], sessionId: 'r_ident00001' });
  const b10 = await chat({ messages: [msg(q), { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'Hello from the GPU.' }] }, msg('and music?', 'm2')], sessionId: 'r_ident00001', sessionProvider: 'gpu:open-8b' });
  const sys10 = systemOf(mock.gpuReqs[0]);
  check('T10 GPU root names itself self-hosted GPU, not on-device/DeepSeek', /self-hosts on a rented GPU/.test(sys10) && !/on-device/i.test(sys10) && !/speaking model is DeepSeek/.test(sys10));
  check('T10 prefix hash stable across GPU turns', !!a10.res.headers.get('x-prefix-hash') && a10.res.headers.get('x-prefix-hash') === b10.res.headers.get('x-prefix-hash'));
  check('T10 system prefix byte-identical across turns (prefix-cache friendly)', systemOf(mock.gpuReqs[0]) === systemOf(mock.gpuReqs[1]));

  // ── T11: legacy breaker decoupled ──
  reset();
  setGpuEnv({});
  for (let i = 0; i < 3; i++) recordModelFailure(new Error('voice-code boom'));
  check('T11 legacy circuit open (voice-code failures)', isCircuitOpen());
  const t11 = await chat({ messages: [msg(q)] });
  check('T11 /api/chat still answers on deepseek', t11.res.status === 200 && t11.res.headers.get('x-provider') === 'deepseek', String(t11.res.status));
  recordModelSuccess();

  // ── T12: wake de-duplication ──
  reset();
  setGpuEnv({ AGENT_GPU_MODE: 'owner' });
  mock.health = 503;
  const cfg12 = readGpuConfig()!;
  const primary = buildPrimary()!;
  const gpu = buildGpu(cfg12);
  const decisions = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      chooseProvider({ primary, gpu, fallback: buildFallback(), cfg: cfg12, isOwner: true, requestedTier: 'gpu', estTokens: 1000, toolRoute: 'default', rootKey: `r_${i}`, shanghaiVoice: false }),
    ),
  );
  await new Promise((r) => setTimeout(r, 100));
  check('T12 20 cold requests → all served by deepseek', decisions.every((d) => d.ok && d.pick.provider === 'deepseek'));
  check('T12 20 cold requests → one wake', decisions.filter((d) => d.wakeSent).length === 1 && mock.healthHits <= 2, `wakes=${decisions.filter((d) => d.wakeSent).length} health=${mock.healthHits}`);

  // ── Extra: spillover + budget rules ──
  reset();
  setGpuEnv({ AGENT_GPU_MODE: 'public', AGENT_GPU_SPILL_INFLIGHT: '2' });
  await markGpuWarm();
  const { noteTurnStart, addSpend } = await import('../../lib/agentRuntime/load');
  await noteTurnStart('deepseek');
  await noteTurnStart('deepseek');
  const sp = await chooseProvider({ primary, gpu: buildGpu(readGpuConfig()), fallback: null, cfg: readGpuConfig(), isOwner: false, estTokens: 1000, toolRoute: 'default', rootKey: 'r_sp', shanghaiVoice: false });
  check('rule: in-flight spillover → gpu', sp.ok && sp.rule === 'spill_inflight' && sp.pick.tier === 'gpu');
  const spSh = await chooseProvider({ primary, gpu: buildGpu(readGpuConfig()), fallback: null, cfg: readGpuConfig(), isOwner: false, estTokens: 1000, toolRoute: 'default', rootKey: 'r_sp', shanghaiVoice: true });
  check('rule: Shanghai voice stays on deepseek', spSh.ok && spSh.pick.provider === 'deepseek');
  reset();
  setGpuEnv({ AGENT_GPU_MODE: 'public', AGENT_GPU_DEEPSEEK_DAILY_BUDGET_USD: '0.5', AGENT_GPU_ROUTES: 'hire_cv' });
  await markGpuWarm();
  await addSpend('deepseek', 600_000);
  const bOther = await chooseProvider({ primary, gpu: buildGpu(readGpuConfig()), fallback: null, cfg: readGpuConfig(), isOwner: false, estTokens: 1000, toolRoute: 'tech', rootKey: 'r_b', shanghaiVoice: false });
  const bHire = await chooseProvider({ primary, gpu: buildGpu(readGpuConfig()), fallback: null, cfg: readGpuConfig(), isOwner: false, estTokens: 1000, toolRoute: 'hire_cv', rootKey: 'r_b', shanghaiVoice: false });
  check('rule: budget over + route allow-list', bOther.ok && bOther.pick.provider === 'deepseek' && bHire.ok && bHire.rule === 'budget');

  // ── peekFirstToken unit ──
  const mk = (parts: Array<{ type: string }>, delayMs = 0) =>
    new ReadableStream<{ type: string }>({
      async start(c) {
        for (const p of parts) {
          if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
          c.enqueue(p);
        }
        c.close();
      },
    }) as ReadableStream<{ type: string }> & AsyncIterable<{ type: string }>;
  check('peek: token', (await peekFirstToken(mk([{ type: 'start' }, { type: 'text-delta' }]), 200)).ok);
  check('peek: error', !(await peekFirstToken(mk([{ type: 'start' }, { type: 'error' }]), 200)).ok);
  const slow = await peekFirstToken(mk([{ type: 'start' }, { type: 'text-delta' }], 300), 100);
  check('peek: timeout', !slow.ok && slow.reason === 'timeout');
  const pe = await peekFirstToken(mk([{ type: 'start' }, { type: 'text-start' }, { type: 'text-end' }, { type: 'finish' }]), 0, { requireContent: true });
  check('peek(requireContent): empty finish → empty', !pe.ok && pe.reason === 'empty');
  const pw = await peekFirstToken(mk([{ type: 'text-start' }, { type: 'text-delta', text: ' \n' } as { type: string }, { type: 'finish' }]), 0, { requireContent: true });
  check('peek(requireContent): whitespace-only → empty', !pw.ok && pw.reason === 'empty');
  const pt = await peekFirstToken(mk([{ type: 'text-start' }, { type: 'text-delta', text: 'Hi' } as { type: string }]), 0, { requireContent: true });
  const pc = await peekFirstToken(mk([{ type: 'tool-call' }, { type: 'finish' }]), 0, { requireContent: true });
  check('peek(requireContent): text or tool call → ok', pt.ok && pc.ok);
  const pslow = await peekFirstToken(mk([{ type: 'text-start' }, { type: 'text-delta', text: 'Hi' } as { type: string }], 80), 120, { requireContent: true });
  check('peek(requireContent): timeout measures first token only', pslow.ok);

  server.close();
  const failed = rows.filter((r) => !r.ok);
  for (const r of rows) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  console.log(`\ngpu-router: ${rows.length - failed.length}/${rows.length}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
