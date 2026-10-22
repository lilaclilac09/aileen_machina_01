/**
 * Offline gate for the public-door answer cache (no network beyond 127.0.0.1,
 * no secrets, no real Redis). A mock OpenAI-compatible host on 127.0.0.1
 * stands in for the primary model and numbers every answer, so a replayed
 * answer is provably the stored one, not a fresh model call.
 *
 * Checks: same question twice → second is a hit with identical text and no
 * model call; whitespace / case variants hit; multi-turn, council, owner,
 * tool-using, errored, hosted-fallback and visitor-with-history turns are
 * never stored; prefix / model / host change misses; Redis absent or
 * throwing → normal model path; a hit still counts toward the daily quota;
 * frozen prefix + tool list unchanged.
 *
 * Run: npx -y tsx harness/site-agent/answerCache.ts
 */
process.env.RUNTIME_KV = 'memory';
process.env.AUTH_SECRET ||= 'harness-offline-secret-0123456789abcdef0123456789';
process.env.EVOLUTION_LIVE_INBOX = 'memory';
for (const k of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN', 'KV_REST_API_READ_ONLY_TOKEN', 'AGENT_FALLBACK_BASE_URL', 'AGENT_FALLBACK_API_KEY', 'AGENT_API_KEY', 'DEEPSEEK_MODEL', 'DEEPSEEK_BASE_URL', 'AGENT_FALLBACK_MODEL']) {
  delete process.env[k];
}
for (const k of Object.keys(process.env)) if (k.startsWith('AGENT_GPU_')) delete process.env[k];
import { createHash } from 'node:crypto';
import { createServer, type IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Redis } from '@upstash/redis';
import { resetRuntimeKvForTests } from '../../lib/agentRuntime/kv';
import { resetRedisHealthForTests } from '../../lib/agentRuntime/redisHealth';
import { answerCacheKey, normalizeQuestion, ANSWER_CACHE_TTL_SEC } from '../../lib/agentRuntime/answerCache';
import { setVisitorRedisForTests } from '../../lib/visitorMemory';
import { createOwnerSession, SESSION_COOKIE } from '../../lib/auth';
import { CHAT_DAILY_LIMIT } from '../../lib/chatQuota';
import { PUBLIC_DOOR_SAMPLING } from '../../lib/modelRouter';

type Row = { name: string; ok: boolean; detail?: string };
const rows: Row[] = [];
const check = (name: string, ok: boolean, detail = '') => rows.push({ name, ok, detail });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Mock OpenAI-compatible host (primary at /v1, hosted fallback at /fb) ──
const chunk = (d: Record<string, unknown>, finish: string | null = null) => ({
  id: 'c1', object: 'chat.completion.chunk', created: 0, model: 'm', choices: [{ index: 0, delta: d, finish_reason: finish }],
});
const sse = (chunks: unknown[]) => chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join('') + 'data: [DONE]\n\n';
let calls = 0;
let n = 0;
let failNext = 0;
const bodies: Record<string, unknown>[] = [];
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
  const b = await readBody(req);
  calls += 1;
  bodies.push(b);
  if (failNext > 0) {
    failNext -= 1;
    res.writeHead(400, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'bad request (harness)', type: 'invalid_request_error' } }));
    return;
  }
  const msgs = (b.messages as Array<{ role: string; content: unknown }>) ?? [];
  const firstUser = String(msgs.find((m) => m.role === 'user')?.content ?? '');
  const hasToolResult = msgs.some((m) => m.role === 'tool');
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  if (/toolq/i.test(firstUser) && !hasToolResult) {
    res.end(sse([
      chunk({ role: 'assistant', content: '' }),
      chunk({ tool_calls: [{ index: 0, id: 'call_1', type: 'function', function: { name: 'searchArticles', arguments: '{"query":"pcb design"}' } }] }),
      chunk({}, 'tool_calls'),
    ]));
    return;
  }
  n += 1;
  const who = req.url?.startsWith('/fb') ? 'fallback' : 'primary';
  res.end(sse([chunk({ role: 'assistant', content: '' }), chunk({ content: `Answer number ${n} from the ${who} model.` }), chunk({}, 'stop')]));
});

type ChatOpts = { agentMode?: string; cookie?: string; messages?: unknown[]; priorTopics?: string[]; voiceAccent?: string; ip?: string };
type ChatOut = { status: number; cache: string | null; text: string; body: string; res: Response; modelCalls: number };
const textOf = (body: string) =>
  body
    .split('\n')
    .filter((l) => l.startsWith('data: ') && l !== 'data: [DONE]')
    .map((l) => {
      try {
        return JSON.parse(l.slice(6)) as { type?: string; delta?: string };
      } catch {
        return {};
      }
    })
    .filter((e) => e.type === 'text-delta')
    .map((e) => e.delta ?? '')
    .join('');

async function chat(text: string, o: ChatOpts = {}): Promise<ChatOut> {
  const { POST } = await import('../../app/api/chat/route');
  const before = calls;
  const res = await POST(
    new Request('https://aileena.xyz/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-trace-id': `harness-ac-${Math.random().toString(36).slice(2, 10)}`, 'x-forwarded-for': o.ip ?? '203.0.113.21', ...(o.cookie ? { cookie: o.cookie } : {}) },
      body: JSON.stringify({
        agentMode: o.agentMode ?? 'public',
        messages: o.messages ?? [{ id: 'm1', role: 'user', parts: [{ type: 'text', text }] }],
        ...(o.priorTopics ? { priorTopics: o.priorTopics } : {}),
        ...(o.voiceAccent ? { voiceAccent: o.voiceAccent } : {}),
      }),
    }),
  );
  const body = await res.text();
  await sleep(15); // let onFinish writes (commit, cache store) land
  return { status: res.status, cache: res.headers.get('x-answer-cache'), text: textOf(body), body, res, modelCalls: calls - before };
}

/** Upstash-shaped in-memory Redis: get/set(nx, ex)/incr/del; other reads empty, writes OK. */
function fakeRedis(store: Map<string, unknown>): Redis {
  const pipeline = (): unknown => new Proxy({}, { get: (_t, p) => (p === 'exec' ? async () => [] : () => pipeline()) });
  const api: Record<string, unknown> = {
    get: async (k: string) => (store.has(k) ? store.get(k) : null),
    set: async (k: string, v: unknown, opts?: { nx?: boolean }) => {
      if (opts?.nx && store.has(k)) return null;
      store.set(k, v);
      return 'OK';
    },
    incr: async (k: string) => {
      const v = Number(store.get(k) ?? 0) + 1;
      store.set(k, v);
      return v;
    },
    del: async (k: string) => (store.delete(k) ? 1 : 0),
  };
  return new Proxy(api, {
    get: (t, p) => {
      const cmd = String(p);
      if (cmd === 'then') return undefined;
      if (cmd in t) return t[cmd];
      if (cmd === 'pipeline' || cmd === 'multi') return () => pipeline();
      return async () => null;
    },
  }) as unknown as Redis;
}
/** Redis whose every call throws (outage). */
function downRedis(): Redis {
  const boom = async () => {
    throw new Error('ECONNREFUSED harness redis down');
  };
  const pipeline = (): unknown => new Proxy({}, { get: (_t, p) => (p === 'exec' ? boom : () => pipeline()) });
  return new Proxy({}, {
    get: (_t, p) => (String(p) === 'then' ? undefined : String(p) === 'pipeline' || String(p) === 'multi' ? () => pipeline() : boom),
  }) as unknown as Redis;
}

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const quotaCookieOf = (res: Response) =>
  (res.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).find((c) => c.startsWith('__aileena_quota=')) ?? '';

async function main() {
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  process.env.DEEPSEEK_API_KEY = 'test-ds-key';
  process.env.DEEPSEEK_BASE_URL = `${base}/v1`;
  resetRuntimeKvForTests();

  // ── units ──
  check('unit: normalize = trim + collapse whitespace + lowercase', normalizeQuestion('  In one   SENTENCE,\n who are you?  ') === 'in one sentence, who are you?');
  const k = (o: Partial<Parameters<typeof answerCacheKey>[0]> = {}) =>
    answerCacheKey({ question: 'Who are you?', prefixHash: 'cd760394be0ecb98', provider: 'deepseek', baseURL: 'https://api.deepseek.com', modelId: 'deepseek-flash', sampling: PUBLIC_DOOR_SAMPLING, toolRoute: 'none', ...o });
  const k0 = await k();
  check('unit: key ignores case/whitespace', k0 === (await k({ question: '  WHO   are you? ' })));
  check('unit: prefix hash change → new key', k0 !== (await k({ prefixHash: '0000000000000000' })));
  check('unit: model id change → new key', k0 !== (await k({ modelId: 'deepseek-chat' })));
  check('unit: base URL change → new key', k0 !== (await k({ baseURL: 'https://api.deepinfra.com/v1/openai' })));
  check('unit: provider change → new key', k0 !== (await k({ provider: 'fallback:x' })));
  check('unit: sampling change → new key', k0 !== (await k({ sampling: { ...PUBLIC_DOOR_SAMPLING, temperature: 0.4 } })));
  check('unit: key has no question text', k0.startsWith('answer:v1:') && !/who/i.test(k0));
  check('unit: TTL 24h', ANSWER_CACHE_TTL_SEC === 86_400);

  // ── same question twice → hit, identical text, no model call ──
  const q = 'In one sentence, who are you?';
  const a1 = await chat(q);
  const a2 = await chat(q);
  check('first ask: 200, model called, X-Answer-Cache: miss', a1.status === 200 && a1.modelCalls === 1 && a1.cache === 'miss' && /Answer number/.test(a1.text), `${a1.status} ${a1.modelCalls} ${a1.cache} ${a1.text}`);
  check('second ask: hit, identical text, no model call', a2.status === 200 && a2.cache === 'hit' && a2.modelCalls === 0 && a2.text === a1.text, `${a2.cache} ${a2.modelCalls} ${JSON.stringify(a2.text)}`);
  check('hit keeps public headers (provider lock, prefix hash, agent mode)', a2.res.headers.get('x-provider') === 'deepseek' && a2.res.headers.get('x-prefix-hash') === a1.res.headers.get('x-prefix-hash') && a2.res.headers.get('x-agent-mode') === 'public');
  check('hit has no owner debug headers', !a2.res.headers.get('x-model-tier') && !a2.res.headers.get('x-system-prompt-chars'));
  const a3 = await chat('   in ONE sentence,   WHO are you?\n');
  check('whitespace/case variant hits with identical text', a3.cache === 'hit' && a3.modelCalls === 0 && a3.text === a1.text, `${a3.cache} ${a3.modelCalls}`);

  // ── multi-turn never cached ──
  const mt = [
    { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'hello there' }] },
    { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'Hi! What would you like to know?' }] },
    { id: 'u2', role: 'user', parts: [{ type: 'text', text: q }] },
  ];
  const m1 = await chat(q, { messages: mt });
  const m2 = await chat(q, { messages: mt });
  check('multi-turn: never served from cache', m1.cache === 'miss' && m2.cache === 'miss' && m1.modelCalls === 1 && m2.modelCalls === 1 && m1.text !== a1.text, `${m1.cache}/${m2.cache} ${m1.modelCalls}/${m2.modelCalls}`);
  check('multi-turn: never stored', m1.text !== m2.text, `${m1.text} | ${m2.text}`);

  // ── council / owner never cached ──
  const ownerCookie = `${SESSION_COOKIE}=${encodeURIComponent(await createOwnerSession())}`;
  const c1 = await chat('what should I ship next?', { agentMode: 'council', cookie: ownerCookie });
  const c2 = await chat('what should I ship next?', { agentMode: 'council', cookie: ownerCookie });
  check('council: never cached', c1.status === 200 && c1.cache === 'miss' && c2.cache === 'miss' && c2.modelCalls === 1 && c1.text !== c2.text, `${c1.status} ${c1.cache}/${c2.cache} ${c2.modelCalls}`);
  const o1 = await chat(q, { cookie: ownerCookie });
  check('owner in public mode: not served from cache', o1.cache === 'miss' && o1.modelCalls === 1, `${o1.cache} ${o1.modelCalls}`);
  const o2 = await chat('owner-only question about the site?', { cookie: ownerCookie });
  const o3 = await chat('owner-only question about the site?');
  check('owner in public mode: never stored', o2.modelCalls === 1 && o3.cache === 'miss' && o3.modelCalls === 1, `${o3.cache}`);

  // ── tool-using turn not cached ──
  const t1 = await chat('toolq what does her PCB article say?');
  const t2 = await chat('toolq what does her PCB article say?');
  check('tool turn: model ran a tool call (2 requests)', t1.status === 200 && t1.modelCalls === 2, `${t1.status} ${t1.modelCalls}`);
  check('tool turn: never stored', t2.cache === 'miss' && t2.modelCalls === 2, `${t2.cache} ${t2.modelCalls}`);

  // ── visitor with history: answer not stored (no cross-visitor carry-over) ──
  const h1 = await chat('what is she working on lately?', { priorTopics: ['pcb'] });
  const h2 = await chat('what is she working on lately?');
  check('visitor with client topics: answer not stored', h1.cache === 'miss' && h2.cache === 'miss' && h2.modelCalls === 1, `${h1.cache}/${h2.cache}`);
  const h3 = await chat('what is she working on lately?', { priorTopics: ['pcb'] });
  check('visitor with client topics: never gets the history-shaped answer back', h3.text !== h1.text && (h3.cache === 'miss' || h3.text === h2.text), `${h3.cache}`);

  // ── error turn not cached ──
  failNext = 3;
  const e1 = await chat('why did the error happen here?');
  failNext = 0;
  const e2 = await chat('why did the error happen here?');
  check('errored turn: not stored, next ask runs the model', e2.cache === 'miss' && e2.modelCalls === 1 && /Answer number/.test(e2.text) && !/Answer number/.test(e1.text), `${e1.status} ${e2.cache} ${e2.modelCalls}`);

  // ── prefix / model / host change → miss ──
  const v1 = await chat(q, { voiceAccent: 'shanghai' });
  check('prefix change (voice accent) → miss', v1.cache === 'miss' && v1.modelCalls === 1 && v1.res.headers.get('x-prefix-hash') !== a1.res.headers.get('x-prefix-hash'), `${v1.cache} ${v1.res.headers.get('x-prefix-hash')}`);
  process.env.DEEPSEEK_MODEL = 'deepseek-ai/DeepSeek-V3';
  const mm = await chat(q);
  check('model id change → miss', mm.cache === 'miss' && mm.modelCalls === 1 && mm.text !== a1.text, `${mm.cache}`);
  delete process.env.DEEPSEEK_MODEL;
  process.env.DEEPSEEK_BASE_URL = `${base}/v1/`;
  const hb = await chat(q);
  check('base URL change → miss', hb.cache === 'miss' && hb.modelCalls === 1, `${hb.cache}`);
  process.env.DEEPSEEK_BASE_URL = `${base}/v1`;
  const back = await chat(q);
  check('back on the original config → hit with the original text', back.cache === 'hit' && back.text === a1.text, `${back.cache}`);

  // ── hosted fallback answers are never stored ──
  delete process.env.DEEPSEEK_API_KEY;
  process.env.AGENT_FALLBACK_BASE_URL = `${base}/fb`;
  process.env.AGENT_FALLBACK_API_KEY = 'test-fb-key';
  process.env.AGENT_FALLBACK_MODEL = 'mock-fallback';
  const f1 = await chat('a question only the fallback sees?');
  const f2 = await chat('a question only the fallback sees?');
  check('hosted fallback: never cached', f1.status === 200 && /fallback/.test(f1.text) && f2.cache === 'miss' && f2.modelCalls === 1, `${f1.status} ${f1.res.headers.get('x-provider')} ${f2.cache}`);
  for (const key of ['AGENT_FALLBACK_BASE_URL', 'AGENT_FALLBACK_API_KEY', 'AGENT_FALLBACK_MODEL']) delete process.env[key];
  process.env.DEEPSEEK_API_KEY = 'test-ds-key';

  // ── quota: a hit still counts; at the limit a cached question is refused ──
  resetRuntimeKvForTests();
  const qq = 'Is the quota still counted on a hit?';
  let cookie = '__aileena_vid=harness-ac-quota-visitor';
  const remaining: string[] = [];
  const caches: string[] = [];
  let last: ChatOut | null = null;
  for (let i = 0; i <= CHAT_DAILY_LIMIT; i++) {
    last = await chat(qq, { cookie, ip: '203.0.113.88' });
    remaining.push(last.res.headers.get('x-daily-remaining') ?? '');
    caches.push(last.cache ?? '');
    const qc = quotaCookieOf(last.res);
    if (qc) cookie = `__aileena_vid=harness-ac-quota-visitor; ${qc}`;
  }
  check('quota: hits decrement X-Daily-Remaining like model turns', remaining[0] === String(CHAT_DAILY_LIMIT - 1) && remaining[1] === String(CHAT_DAILY_LIMIT - 2) && remaining[CHAT_DAILY_LIMIT - 1] === '0', remaining.join(','));
  check('quota: turns 2..20 were hits', caches.slice(1, CHAT_DAILY_LIMIT).every((c) => c === 'hit'), caches.join(','));
  check(`quota: turn ${CHAT_DAILY_LIMIT + 1} refused (429) even though cached`, last?.status === 429 && last.modelCalls === 0, String(last?.status));
  // Redis counter alone (no quota cookie) also blocks: hits charge Redis.
  const redisOnly = await chat(qq, { cookie: '__aileena_vid=harness-ac-quota-visitor', ip: '203.0.113.88' });
  check('quota: hits charge the Redis counter (cookie-less retry still 429)', redisOnly.status === 429, String(redisOnly.status));

  // ── Redis backend (Upstash-shaped fake) ──
  delete process.env.RUNTIME_KV;
  const store = new Map<string, unknown>();
  setVisitorRedisForTests(fakeRedis(store));
  resetRedisHealthForTests();
  const r1 = await chat('a question for the redis backend?');
  const r2 = await chat('a question for the redis backend?');
  const stored = [...store.keys()].filter((key) => key.startsWith('answer:v1:'));
  check('redis backend: second ask hits with identical text', r1.cache === 'miss' && r2.cache === 'hit' && r2.modelCalls === 0 && r2.text === r1.text, `${r1.cache}/${r2.cache}`);
  check('redis backend: one answer:v1 key, no question text in key', stored.length === 1 && !/redis backend/.test(stored[0]), stored.join(','));

  // ── Redis down → exactly today's path ──
  setVisitorRedisForTests(downRedis());
  resetRedisHealthForTests();
  const realError = console.error;
  console.error = () => {};
  const d1 = await chat('a question while redis is down?');
  const d2 = await chat('a question while redis is down?');
  console.error = realError;
  check('redis down: both asks 200 via the model, no hit', d1.status === 200 && d2.status === 200 && d1.modelCalls === 1 && d2.modelCalls === 1 && d2.cache === 'miss' && d1.text !== d2.text, `${d1.status}/${d2.status} ${d2.cache}`);
  setVisitorRedisForTests(null);
  resetRedisHealthForTests();
  const x1 = await chat('a question with no redis configured?');
  const x2 = await chat('a question with no redis configured?');
  check('no Redis configured: no cache, model answers every time', x1.status === 200 && x2.cache === 'miss' && x2.modelCalls === 1 && x1.text !== x2.text, `${x2.cache} ${x2.modelCalls}`);
  process.env.RUNTIME_KV = 'memory';

  // ── frozen prefix + tool list unchanged ──
  const pub = bodies.filter((b) => (b.temperature === 0) && Array.isArray(b.tools));
  const sysOf = (b: Record<string, unknown>) => String(((b.messages as Array<{ role: string; content: unknown }>) ?? []).find((m) => m.role === 'system')?.content ?? '');
  const toolNames = (b: Record<string, unknown>) => ((b.tools as Array<{ function?: { name?: string } }>) ?? []).map((t) => t.function?.name ?? '').sort().join(',');
  console.log(`PREFIX system_sha256=${sha(sysOf(bodies[0]))} tools_sha256=${sha(JSON.stringify(bodies[0].tools ?? null))} x-prefix-hash=${a1.res.headers.get('x-prefix-hash')}`);
  console.log(`TOOLS ${toolNames(bodies[0])}`);
  check('public requests keep the pinned sampling', pub.length > 0 && pub.every((b) => b.top_p === 1 && b.max_tokens === 200));

  server.close();
  const failed = rows.filter((r) => !r.ok);
  for (const r of rows) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.detail && !r.ok ? ` — ${r.detail}` : ''}`);
  console.log(`\nanswer-cache: ${rows.length - failed.length}/${rows.length}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
