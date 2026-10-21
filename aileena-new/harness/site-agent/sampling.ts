/**
 * Offline gate for public-door sampling + primary model config (no network
 * beyond 127.0.0.1, no secrets, no Redis). Requests to https://api.deepseek.com
 * are intercepted in-process by a patched fetch and never leave the box.
 *
 * Checks: (a) the request sent to the model carries the pinned params (seed
 * only where the host accepts one); (b) the frozen prefix is byte-identical
 * turn to turn and prints a hash to compare against main
 * (MACHINA_EXPECT_PREFIX_SHA=<sha> pins it); (c) defaults = today's provider,
 * base URL and model.
 *
 * Run: npx -y tsx harness/site-agent/sampling.ts
 */
process.env.RUNTIME_KV = 'memory';
process.env.AUTH_SECRET ||= 'harness-offline-secret-0123456789abcdef0123456789';
for (const k of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN', 'AGENT_FALLBACK_BASE_URL', 'AGENT_FALLBACK_API_KEY', 'AGENT_API_KEY', 'DEEPSEEK_MODEL', 'DEEPSEEK_BASE_URL']) {
  delete process.env[k];
}
for (const k of Object.keys(process.env)) if (k.startsWith('AGENT_GPU_')) delete process.env[k];
import { createHash } from 'node:crypto';
import { createServer, type IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import { resetRuntimeKvForTests } from '../../lib/agentRuntime/kv';
import {
  buildPrimary,
  primaryModelConfig,
  primaryRequestBody,
  providerAcceptsSeed,
  resetDeepSeekModelLatchForTests,
  PUBLIC_DOOR_SAMPLING,
} from '../../lib/modelRouter';
import { createOwnerSession, SESSION_COOKIE } from '../../lib/auth';

type Row = { name: string; ok: boolean; detail?: string };
const rows: Row[] = [];
const check = (name: string, ok: boolean, detail = '') => rows.push({ name, ok, detail });

const chunk = (d: Record<string, unknown>, finish: string | null = null) => ({
  id: 'c1', object: 'chat.completion.chunk', created: 0, model: 'm', choices: [{ index: 0, delta: d, finish_reason: finish }],
});
const sseBody = (text: string) =>
  [chunk({ role: 'assistant', content: '' }), chunk({ content: text }), chunk({}, 'stop')].map((c) => `data: ${JSON.stringify(c)}\n\n`).join('') + 'data: [DONE]\n\n';

// ── Mock OpenAI-compatible host on 127.0.0.1 (stands in for DeepInfra/vLLM/…) ──
const seen: Record<string, unknown>[] = [];
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
  seen.push(await readBody(req));
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  res.end(sseBody('Hello from the mock host.'));
});

// ── In-process stand-in for api.deepseek.com: never reaches the network ──
const dsSeen: Record<string, unknown>[] = [];
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (new URL(url).hostname === 'api.deepseek.com') {
    dsSeen.push(JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>);
    return new Response(sseBody('Hello from DeepSeek (intercepted).'), { status: 200, headers: { 'content-type': 'text/event-stream' } });
  }
  return realFetch(input, init);
}) as typeof fetch;

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const systemOf = (b: Record<string, unknown> | undefined) =>
  String(((b?.messages as Array<{ role: string; content: unknown }>) ?? []).find((m) => m.role === 'system')?.content ?? '');
const toolsOf = (b: Record<string, unknown> | undefined) => JSON.stringify(b?.tools ?? null);
const toolNames = (b: Record<string, unknown> | undefined) =>
  ((b?.tools as Array<{ function?: { name?: string } }>) ?? []).map((t) => t.function?.name ?? '').sort().join(',');

async function chat(text: string, opts: { agentMode?: string; cookie?: string } = {}): Promise<{ res: Response; body: string }> {
  const { POST } = await import('../../app/api/chat/route');
  const res = await POST(
    new Request('https://aileena.xyz/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-trace-id': `harness-sampling-${Math.random().toString(36).slice(2, 10)}`, 'x-forwarded-for': '203.0.113.9', ...(opts.cookie ? { cookie: opts.cookie } : {}) },
      body: JSON.stringify({ agentMode: opts.agentMode ?? 'public', messages: [{ id: 'm1', role: 'user', parts: [{ type: 'text', text }] }] }),
    }),
  );
  return { res, body: await res.text() };
}

async function main() {
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const q = 'hi, what does she work on?';

  // ── (c) defaults: today's provider, base URL, model ──
  resetDeepSeekModelLatchForTests();
  const def = primaryModelConfig();
  check('c: default provider = deepseek', def.provider === 'deepseek', def.provider);
  check('c: default base URL = https://api.deepseek.com', def.baseURL === 'https://api.deepseek.com', def.baseURL);
  check('c: default model = deepseek-flash', def.modelId === 'deepseek-flash', def.modelId);
  process.env.DEEPSEEK_API_KEY = 'test-ds-key';
  const pick = buildPrimary();
  check('c: buildPrimary() keeps provider/tier/model', pick?.provider === 'deepseek' && pick?.tier === 'primary' && pick?.modelId === 'deepseek-flash', JSON.stringify({ p: pick?.provider, t: pick?.tier, m: pick?.modelId }));
  process.env.DEEPSEEK_BASE_URL = 'https://api.deepinfra.com/v1/openai';
  process.env.DEEPSEEK_MODEL = 'deepseek-ai/DeepSeek-V3';
  const swapped = primaryModelConfig();
  check('c: DEEPSEEK_BASE_URL / DEEPSEEK_MODEL swap the host', swapped.baseURL === 'https://api.deepinfra.com/v1/openai' && swapped.modelId === 'deepseek-ai/DeepSeek-V3' && swapped.provider === 'deepseek');
  delete process.env.DEEPSEEK_BASE_URL;
  delete process.env.DEEPSEEK_MODEL;

  // ── units: seed gating ──
  check('unit: pinned values', JSON.stringify(PUBLIC_DOOR_SAMPLING) === '{"temperature":0,"topP":1,"maxOutputTokens":200,"seed":42}', JSON.stringify(PUBLIC_DOOR_SAMPLING));
  check('unit: api.deepseek.com takes no seed', !providerAcceptsSeed('https://api.deepseek.com') && !providerAcceptsSeed('https://api.deepseek.com/beta'));
  check('unit: other OpenAI-compatible hosts take seed', providerAcceptsSeed('https://api.deepinfra.com/v1/openai') && providerAcceptsSeed('https://api.together.ai/v1') && providerAcceptsSeed('http://127.0.0.1:8000/v1'));
  check('unit: bad URL → no seed', !providerAcceptsSeed('not a url'));
  check('unit: deepseek body drops seed, keeps thinking', JSON.stringify(primaryRequestBody({ baseURL: 'https://api.deepseek.com', modelId: 'deepseek-flash' }, { a: 1, seed: 42 })) === '{"a":1,"thinking":{"type":"disabled"}}');
  check('unit: other host keeps seed', JSON.stringify(primaryRequestBody({ baseURL: 'https://api.deepinfra.com/v1/openai', modelId: 'deepseek-chat' }, { a: 1, seed: 42 })) === '{"a":1,"seed":42}');

  // ── (a) real /api/chat → DeepSeek default host (intercepted) ──
  resetRuntimeKvForTests();
  const r1 = await chat(q);
  const d1 = dsSeen[dsSeen.length - 1];
  check('a: default host answers 200 on deepseek', r1.res.status === 200 && r1.res.headers.get('x-provider') === 'deepseek' && /intercepted/.test(r1.body), `${r1.res.status} ${r1.res.headers.get('x-provider')}`);
  check('a: deepseek request pinned (temp 0, top_p 1, max_tokens 200)', d1?.temperature === 0 && d1?.top_p === 1 && d1?.max_tokens === 200, JSON.stringify({ t: d1?.temperature, p: d1?.top_p, m: d1?.max_tokens }));
  check('a: deepseek request has no seed', d1 !== undefined && !('seed' in d1));
  check('a: deepseek request keeps model + thinking off', d1?.model === 'deepseek-flash' && JSON.stringify(d1?.thinking) === '{"type":"disabled"}');

  // ── (a) real /api/chat → OpenAI-compatible host (127.0.0.1 mock) ──
  process.env.DEEPSEEK_BASE_URL = `${base}/v1`;
  resetRuntimeKvForTests();
  const r2 = await chat(q);
  const m1 = seen[seen.length - 1];
  check('a: mock host answers 200', r2.res.status === 200 && /mock host/.test(r2.body), String(r2.res.status));
  check('a: mock host request pinned incl. seed 42', m1?.temperature === 0 && m1?.top_p === 1 && m1?.max_tokens === 200 && m1?.seed === 42, JSON.stringify({ t: m1?.temperature, p: m1?.top_p, m: m1?.max_tokens, s: m1?.seed }));
  resetRuntimeKvForTests();
  await chat(q);
  const m2 = seen[seen.length - 1];
  const pinned = (b: Record<string, unknown> | undefined) => JSON.stringify([b?.model, b?.temperature, b?.top_p, b?.max_tokens, b?.seed, b?.tool_choice]);
  check('a: same question → same pinned params', pinned(m1) === pinned(m2), pinned(m2));

  // ── (b) frozen prefix byte-identical ──
  const sys = systemOf(d1);
  check('b: system prompt byte-identical turn to turn', sys.length > 0 && sys === systemOf(m1) && sys === systemOf(m2));
  check('b: tool table byte-identical turn to turn', toolsOf(d1) === toolsOf(m1) && toolsOf(m1) === toolsOf(m2));
  check('b: x-prefix-hash stable', !!r1.res.headers.get('x-prefix-hash') && r1.res.headers.get('x-prefix-hash') === r2.res.headers.get('x-prefix-hash'));
  const prefixSha = sha(`${sys}\n\u0000\n${toolsOf(d1)}`);
  const expect = (process.env.MACHINA_EXPECT_PREFIX_SHA ?? '').trim();
  if (expect) check('b: prefix sha matches MACHINA_EXPECT_PREFIX_SHA', prefixSha === expect, prefixSha);
  console.log(`PREFIX system_sha256=${sha(sys)} tools_sha256=${sha(toolsOf(d1))} prefix_sha256=${prefixSha} x-prefix-hash=${r1.res.headers.get('x-prefix-hash')}`);
  console.log(`TOOLS ${toolNames(d1)}`);

  // ── council (owner) keeps its own settings: temperature 0.4, 900 tokens, no seed ──
  resetRuntimeKvForTests();
  const ownerCookie = `${SESSION_COOKIE}=${encodeURIComponent(await createOwnerSession())}`;
  const rc = await chat('what should I ship next?', { agentMode: 'council', cookie: ownerCookie });
  const c1 = seen[seen.length - 1];
  check('council: unchanged (temp 0.4, max_tokens 900, no top_p/seed)', rc.res.status === 200 && c1 !== m2 && c1?.temperature === 0.4 && c1?.max_tokens === 900 && !('top_p' in (c1 ?? {})) && !('seed' in (c1 ?? {})), JSON.stringify({ s: rc.res.status, t: c1?.temperature, m: c1?.max_tokens }));
  delete process.env.DEEPSEEK_BASE_URL;

  server.close();
  globalThis.fetch = realFetch;
  const failed = rows.filter((r) => !r.ok);
  for (const r of rows) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  console.log(`\nsampling: ${rows.length - failed.length}/${rows.length}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
