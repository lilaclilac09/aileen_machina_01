/**
 * Offline gate for Redis degradation: a Redis that reads but cannot write
 * (read-only token, outage mid-turn) must not unlock the daily chat limit,
 * must be reported (degraded flag, first error logged once), and the owner
 * diagnostic must name the failing write. Also checks after() tracking and
 * that the diagnostic never echoes env values. No network, no keys.
 *
 * Run: npx -y tsx harness/site-agent/redis.ts
 */
process.env.AUTH_SECRET ||= 'harness-offline-secret-0123456789abcdef0123456789';
process.env.EVOLUTION_LIVE_INBOX = 'memory';
delete process.env.RUNTIME_KV;
for (const k of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN', 'KV_REST_API_READ_ONLY_TOKEN', 'AGENT_FALLBACK_BASE_URL', 'AGENT_FALLBACK_API_KEY', 'AGENT_API_KEY', 'DEEPSEEK_MODEL']) {
  delete process.env[k];
}
import { readFileSync } from 'node:fs';
import { createServer, type IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Redis } from '@upstash/redis';
import { setVisitorRedisForTests, redisEnvNames } from '../../lib/visitorMemory';
import { redisHealth, resetRedisHealthForTests, sanitizeRedisError } from '../../lib/agentRuntime/redisHealth';
import { redisDiagnostic } from '../../lib/agentRuntime/redisDiag';
import { postResponseWork } from '../../lib/agentRuntime/afterResponse';
import { runtimeKv } from '../../lib/agentRuntime/kv';
import { createOwnerSession, SESSION_COOKIE } from '../../lib/auth';
import { CHAT_DAILY_LIMIT } from '../../lib/chatQuota';

type Row = { name: string; ok: boolean; detail?: string };
const rows: Row[] = [];
const check = (name: string, ok: boolean, detail = '') => rows.push({ name, ok, detail });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Upstash-shaped fake: reads return empty, every write throws NOPERM (read-only token). */
const READS = new Set(['get', 'mget', 'lrange', 'hgetall', 'hget', 'exists', 'ttl', 'smembers', 'zrange', 'scard', 'llen', 'keys', 'scan']);
const nope = (cmd: string) => new Error(`NOPERM this user has no permissions to run the '${cmd}' command`);
function readOnlyRedis(): Redis {
  const readValue = (cmd: string) => (cmd === 'lrange' || cmd === 'smembers' || cmd === 'zrange' || cmd === 'keys' ? [] : cmd === 'hgetall' ? null : cmd === 'exists' || cmd === 'scard' || cmd === 'llen' ? 0 : null);
  const pipeline = (): unknown =>
    new Proxy({}, { get: (_t, p) => (p === 'exec' ? async () => { throw nope('pipeline'); } : () => pipeline()) });
  return new Proxy({}, {
    get: (_t, p) => {
      const cmd = String(p);
      if (cmd === 'then') return undefined;
      if (cmd === 'pipeline' || cmd === 'multi') return () => pipeline();
      if (READS.has(cmd)) return async () => readValue(cmd);
      return async () => { throw nope(cmd); };
    },
  }) as unknown as Redis;
}

// ── Mock DeepSeek (OpenAI-compatible SSE) ──
const chunk = (d: Record<string, unknown>, finish: string | null = null) => ({ id: 'c', object: 'chat.completion.chunk', created: 0, model: 'm', choices: [{ index: 0, delta: d, finish_reason: finish }] });
async function drainReq(req: IncomingMessage) {
  for await (const _ of req) void _;
}
const server = createServer(async (req, res) => {
  await drainReq(req);
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  const w = (c: unknown) => res.write(`data: ${JSON.stringify(c)}\n\n`);
  w(chunk({ role: 'assistant', content: '' }));
  w(chunk({ content: 'Hello from the primary model.' }));
  w(chunk({}, 'stop'));
  w({ id: 'c', object: 'chat.completion.chunk', created: 0, model: 'm', choices: [], usage: { prompt_tokens: 50, completion_tokens: 5, total_tokens: 55 } });
  res.write('data: [DONE]\n\n');
  res.end();
});

const quotaCookieOf = (res: Response) =>
  (res.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).find((c) => c.startsWith('__aileena_quota=')) ?? '';

async function main() {
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  process.env.DEEPSEEK_API_KEY = 'test-ds-key';
  process.env.DEEPSEEK_BASE_URL = `${base}/ds`;

  // ── Redis write throws → the signed cookie still enforces the daily limit ──
  setVisitorRedisForTests(readOnlyRedis());
  resetRedisHealthForTests();
  const errLogs: string[] = [];
  const realError = console.error;
  console.error = (...a: unknown[]) => {
    if (String(a[0]).startsWith('[redis]')) errLogs.push(a.map(String).join(' '));
    else realError(...(a as []));
  };
  const { POST } = await import('../../app/api/chat/route');
  let cookie = '';
  const remaining: string[] = [];
  let lastStatus = 0;
  for (let i = 0; i <= CHAT_DAILY_LIMIT; i++) {
    const res = await POST(
      new Request('https://aileena.xyz/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.77', cookie: ['__aileena_vid=harness-redis-visitor', cookie].filter(Boolean).join('; ') },
        body: JSON.stringify({ agentMode: 'public', sessionId: 'sess_redis_ro', turnId: `turn-ro-${i}`, messages: [{ id: `u${i}`, role: 'user', parts: [{ type: 'text', text: `Question number ${i} about the site?` }] }] }),
      }),
    );
    await res.text().catch(() => '');
    await sleep(20);
    lastStatus = res.status;
    remaining.push(res.headers.get('x-daily-remaining') ?? '');
    cookie = quotaCookieOf(res) || cookie;
  }
  console.error = realError;
  check('read-only Redis: remaining decrements every turn', remaining[0] === String(CHAT_DAILY_LIMIT - 1) && remaining[1] === String(CHAT_DAILY_LIMIT - 2) && remaining[CHAT_DAILY_LIMIT - 1] === '0', remaining.join(','));
  check(`read-only Redis: turn ${CHAT_DAILY_LIMIT + 1} is refused (429)`, lastStatus === 429, String(lastStatus));
  const h = redisHealth();
  check('read-only Redis: degraded flag set, error recorded', h.degraded && h.errors > 0 && /NOPERM/.test(h.lastError ?? ''), JSON.stringify(h));
  check('read-only Redis: first error logged once per instance', errLogs.length === 1, String(errLogs.length));
  check('fallback still works: write lands in memory', (await runtimeKv().set('harness:ro:k', 1)) && (await runtimeKv().get<number>('harness:ro:k')) === 1);

  // ── Owner diagnostic ──
  process.env.KV_REST_API_URL = 'https://example-harness.upstash.io';
  process.env.KV_REST_API_TOKEN = 'harnessReadOnlyTokenValue0123456789abcdef';
  process.env.KV_REST_API_READ_ONLY_TOKEN = 'harnessReadOnlyTokenValue0123456789abcdef';
  process.env.UPSTASH_REDIS_REST_URL = '';
  const names = redisEnvNames();
  check('env names: KV_REST_API_* in use, read-only token detected by value match', names.url === 'KV_REST_API_URL' && names.token === 'KV_REST_API_TOKEN' && names.tokenIsReadOnly, JSON.stringify(names));
  const diag = await redisDiagnostic(readOnlyRedis());
  check('diagnostic: read ok, write fails, flagged read-only', diag.roundtrip?.read.ok === true && diag.roundtrip?.write.ok === false && diag.writable === false && diag.readOnlyToken === true, JSON.stringify(diag.roundtrip));
  const store = new Map<string, unknown>();
  const rw = { get: async (k: string) => store.get(k) ?? null, set: async (k: string, v: unknown) => (store.set(k, v), 'OK'), del: async (k: string) => (store.delete(k) ? 1 : 0) } as unknown as Redis;
  const ok = await redisDiagnostic(rw);
  check('diagnostic: RW client passes SET/GET/DEL, test key removed', ok.writable === true && ok.readOnlyToken === false && ok.roundtrip?.del.ok === true && store.size === 0, JSON.stringify(ok.roundtrip));

  const { GET } = await import('../../app/api/agent/health/route');
  setVisitorRedisForTests(readOnlyRedis());
  const anon = await GET(new Request('https://aileena.xyz/api/agent/health?redis=1'));
  check('health route: non-owner gets 403', anon.status === 403, String(anon.status));
  const ownerCookie = `${SESSION_COOKIE}=${await createOwnerSession()}`;
  const own = await GET(new Request('https://aileena.xyz/api/agent/health?redis=1', { headers: { cookie: ownerCookie } }));
  const ownText = await own.text();
  const ownJson = JSON.parse(ownText || '{}');
  check('health route: owner sees roundtrip, write failure, env names', own.status === 200 && ownJson.redis?.readOnlyToken === true && ownJson.redis?.env?.token === 'KV_REST_API_TOKEN', ownText.slice(0, 300));
  check('health route: never echoes env values', !ownText.includes('harnessReadOnlyTokenValue') && !ownText.includes('example-harness.upstash.io'));
  check('error sanitizer strips URLs and token-like strings', !/upstash\.io|abcdef0123456789abcdef/.test(sanitizeRedisError(new Error('fetch https://x.upstash.io failed token abcdef0123456789abcdef0123'))));

  // ── after() tracking ──
  let task: (() => Promise<unknown>) | null = null;
  const w = postResponseWork({ schedule: (t) => (task = t), capMs: 2000 });
  let wrote = false;
  w.track(sleep(30).then(() => (wrote = true)));
  w.release();
  const t0 = Date.now();
  await (task as unknown as () => Promise<unknown>)?.();
  check('after(): task waits for tracked writes after release', w.scheduled && wrote && Date.now() - t0 < 1500);
  let task2: (() => Promise<unknown>) | null = null;
  postResponseWork({ schedule: (t) => (task2 = t), capMs: 50 });
  const t1 = Date.now();
  await (task2 as unknown as () => Promise<unknown>)?.();
  check('after(): never-released work is capped', Date.now() - t1 < 500);
  check('after(): outside a request scope does not throw', postResponseWork().scheduled === false);

  const route = readFileSync('app/api/chat/route.ts', 'utf8');
  check('route: cookie always charged (+1), Redis or not', /buildQuotaCookie\(\{ date: quota\.date, count: quota\.count \+ 1 \}\)/.test(route) && /Math\.max\(cookieQuota\.count, redisCount\)/.test(route));
  check('route: commit + charge tracked by after()', /work\.track\(runOnce\(turnCommitId, commit/.test(route) && /work\.track\(perfWrite\)/.test(route));
  check('inkling jobs use the shared Redis client', /getVisitorRedis\(\)/.test(readFileSync('lib/inkling/jobs.ts', 'utf8')) && !/process\.env\.UPSTASH/.test(readFileSync('lib/inkling/jobs.ts', 'utf8')));

  server.close();
  const failed = rows.filter((r) => !r.ok);
  for (const r of rows) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name}${r.ok || !r.detail ? '' : ` — ${r.detail}`}`);
  console.log(`\nredis: ${rows.length - failed.length}/${rows.length}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
