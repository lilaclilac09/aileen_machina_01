/**
 * Offline gate for the pay-per-question route (/api/ask-paid, MPP `charge`).
 * No network beyond in-process stand-ins, no secrets, no Redis, no payment:
 * api.deepseek.com is intercepted in-process and every other non-local fetch
 * is refused and recorded (a 402 challenge must not need the chain).
 *
 * Checks: flag off → 404; flag on + env missing/invalid → 503 JSON naming the
 * vars; bad body → 400; unpaid → 402 with `WWW-Authenticate: Payment …`
 * (tempo / charge / price / recipient / testnet chain), no model call; a bad
 * credential never reaches the model; credentialed requests are rate limited
 * with the /api/mcp ask windows; importing the route with no env does not
 * throw; the shared askChat helper answers through the public door; the
 * frozen prefix is the same one /api/chat sends (prefix_sha256 printed in the
 * same format as sampling.ts, so main vs branch can be compared).
 *
 * Run: npx -y tsx harness/site-agent/askPaid.ts
 */
process.env.RUNTIME_KV = 'memory';
process.env.AUTH_SECRET ||= 'harness-offline-secret-0123456789abcdef0123456789';
process.env.EVOLUTION_LIVE_INBOX = 'memory';
for (const k of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN', 'KV_REST_API_READ_ONLY_TOKEN', 'AGENT_FALLBACK_BASE_URL', 'AGENT_FALLBACK_API_KEY', 'AGENT_API_KEY', 'DEEPSEEK_MODEL', 'DEEPSEEK_BASE_URL', 'AGENT_FALLBACK_MODEL', 'MPP_PAID_ENABLED', 'MPP_RECIPIENT', 'MPP_SECRET_KEY', 'MPP_PRICE_PER_QUESTION', 'MPP_NETWORK', 'MPP_REALM']) {
  delete process.env[k];
}
for (const k of Object.keys(process.env)) if (k.startsWith('AGENT_GPU_')) delete process.env[k];
import { createHash } from 'node:crypto';
import { resetRuntimeKvForTests } from '../../lib/agentRuntime/kv';
import { resetAgentRateForTests } from '../../lib/agentMcp/rateLimit';

type Row = { name: string; ok: boolean; detail?: string };
const rows: Row[] = [];
const check = (name: string, ok: boolean, detail = '') => rows.push({ name, ok, detail });
const sha = (s: string) => createHash('sha256').update(s).digest('hex');

const chunk = (d: Record<string, unknown>, finish: string | null = null) => ({
  id: 'c1', object: 'chat.completion.chunk', created: 0, model: 'm', choices: [{ index: 0, delta: d, finish_reason: finish }],
});
const sseBody = (text: string) =>
  [chunk({ role: 'assistant', content: '' }), chunk({ content: text }), chunk({}, 'stop')].map((c) => `data: ${JSON.stringify(c)}\n\n`).join('') + 'data: [DONE]\n\n';

// ── In-process stand-ins: api.deepseek.com answers; anything else non-local is refused ──
const dsSeen: Record<string, unknown>[] = [];
const outbound: string[] = [];
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const host = new URL(url).hostname;
  if (host === 'api.deepseek.com') {
    dsSeen.push(JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>);
    return new Response(sseBody('Hello from DeepSeek (intercepted).'), { status: 200, headers: { 'content-type': 'text/event-stream' } });
  }
  if (host !== '127.0.0.1' && host !== 'localhost') {
    outbound.push(host);
    throw new Error(`harness: outbound fetch refused (${host})`);
  }
  return realFetch(input, init);
}) as typeof fetch;

const RECIPIENT = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // well-known public test address (no key here)
const SECRET = 'harness-mpp-secret-0123456789abcdef0123456789abcdef';
const setEnv = (o: Record<string, string | undefined>) => {
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
};

async function ask(body: unknown, headers: Record<string, string> = {}): Promise<{ status: number; res: Response; json: Record<string, unknown> }> {
  const { POST } = await import('../../app/api/ask-paid/route');
  const res = await POST(
    new Request('https://aileena.xyz/api/ask-paid', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.77', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
  let json: Record<string, unknown> = {};
  try {
    json = (await res.clone().json()) as Record<string, unknown>;
  } catch {
    /* non-JSON body */
  }
  return { status: res.status, res, json };
}

/** Parse `Payment k="v", …` and decode the base64url `request` param. */
function parseChallenge(h: string): { params: Record<string, string>; request: Record<string, unknown> } {
  const params: Record<string, string> = {};
  for (const m of h.replace(/^Payment\s+/i, '').matchAll(/([a-zA-Z_]+)="([^"]*)"/g)) params[m[1]] = m[2];
  let request: Record<string, unknown> = {};
  try {
    request = JSON.parse(Buffer.from(params.request ?? '', 'base64url').toString('utf8')) as Record<string, unknown>;
  } catch {
    /* leave empty */
  }
  return { params, request };
}

async function main() {
  process.env.DEEPSEEK_API_KEY = 'test-ds-key';
  resetRuntimeKvForTests();
  resetAgentRateForTests();

  // ── import with no env never throws ──
  let importOk = true;
  try {
    await import('../../app/api/ask-paid/route');
  } catch (e) {
    importOk = false;
    console.error(e);
  }
  check('import: route module loads with no MPP env', importOk);

  // ── flag off → 404 ──
  const before = dsSeen.length;
  const off = await ask({ question: 'who are you?' });
  check('flag off → 404 JSON', off.status === 404 && off.res.headers.get('content-type')?.includes('application/json') === true, String(off.status));
  setEnv({ MPP_PAID_ENABLED: '0', MPP_RECIPIENT: RECIPIENT, MPP_SECRET_KEY: SECRET });
  check('flag "0" with full env → still 404', (await ask({ question: 'who are you?' })).status === 404);

  // ── flag on + env missing/invalid → 503 naming the vars ──
  setEnv({ MPP_PAID_ENABLED: '1', MPP_RECIPIENT: undefined, MPP_SECRET_KEY: undefined });
  const m1 = await ask({ question: 'who are you?' });
  check('flag on, recipient + secret missing → 503 JSON', m1.status === 503 && JSON.stringify(m1.json.missing) === '["MPP_RECIPIENT","MPP_SECRET_KEY"]', `${m1.status} ${JSON.stringify(m1.json)}`);
  setEnv({ MPP_RECIPIENT: RECIPIENT });
  const m2 = await ask({ question: 'who are you?' });
  check('flag on, secret missing → 503 MPP_SECRET_KEY', m2.status === 503 && JSON.stringify(m2.json.missing) === '["MPP_SECRET_KEY"]', JSON.stringify(m2.json));
  setEnv({ MPP_SECRET_KEY: 'too-short' });
  check('secret < 32 bytes → 503', (await ask({ question: 'q' })).status === 503);
  setEnv({ MPP_SECRET_KEY: SECRET, MPP_RECIPIENT: 'not-an-address' });
  check('invalid recipient → 503', (await ask({ question: 'q' })).status === 503);
  setEnv({ MPP_RECIPIENT: RECIPIENT, MPP_NETWORK: 'devnet' });
  check('unknown MPP_NETWORK → 503', (await ask({ question: 'q' })).status === 503);
  setEnv({ MPP_NETWORK: undefined, MPP_PRICE_PER_QUESTION: '-1' });
  check('invalid price → 503', (await ask({ question: 'q' })).status === 503);
  setEnv({ MPP_PRICE_PER_QUESTION: undefined });
  check('secrets never echoed in 503 body', !JSON.stringify(m2.json).includes(SECRET));

  // ── bad body → 400 ──
  check('invalid JSON → 400', (await ask('{not json')).status === 400);
  check('missing question → 400', (await ask({})).status === 400);
  check('non-string question → 400', (await ask({ question: 42 })).status === 400);
  check('blank question → 400', (await ask({ question: '   ' })).status === 400);
  check('question > 1500 chars → 400', (await ask({ question: 'x'.repeat(1501) })).status === 400);

  // ── unpaid → 402 challenge, testnet by default, no model call ──
  const u = await ask({ question: 'In one sentence, who are you?' });
  const www = u.res.headers.get('www-authenticate') ?? '';
  const ch = parseChallenge(www);
  check('unpaid → 402', u.status === 402, String(u.status));
  check('402 has WWW-Authenticate: Payment …', /^Payment\s/i.test(www), www.slice(0, 80));
  check('challenge: method tempo, intent charge', ch.params.method === 'tempo' && ch.params.intent === 'charge', JSON.stringify(ch.params));
  check('challenge: default price 0.01 USD (10000 base units, 6 decimals)', String(ch.request.amount) === '10000', JSON.stringify(ch.request));
  check('challenge: recipient = MPP_RECIPIENT', String(ch.request.recipient ?? '').toLowerCase() === RECIPIENT.toLowerCase(), JSON.stringify(ch.request));
  const chainOf = (r: Record<string, unknown>) => Number((r.methodDetails as { chainId?: number } | undefined)?.chainId ?? r.chainId ?? NaN);
  check('challenge: testnet chain (Tempo Moderato 42431) by default', chainOf(ch.request) === 42431, JSON.stringify(ch.request));
  setEnv({ MPP_PRICE_PER_QUESTION: '0.25' });
  const p = parseChallenge((await ask({ question: 'q?' })).res.headers.get('www-authenticate') ?? '');
  check('MPP_PRICE_PER_QUESTION=0.25 → 250000 base units', String(p.request.amount) === '250000', JSON.stringify(p.request));
  setEnv({ MPP_PRICE_PER_QUESTION: undefined, MPP_NETWORK: 'mainnet' });
  const mn = parseChallenge((await ask({ question: 'q?' })).res.headers.get('www-authenticate') ?? '');
  check('MPP_NETWORK=mainnet → chain 4217 (explicit opt-in only)', chainOf(mn.request) === 4217, JSON.stringify(mn.request));
  setEnv({ MPP_NETWORK: undefined });
  check('no model call on 400/402/404/503', dsSeen.length === before, `${dsSeen.length - before} calls`);
  check('402 challenge needs no outbound network', outbound.length === 0, outbound.join(','));

  // ── bad credential never reaches the model; credentialed requests are rate limited ──
  resetAgentRateForTests();
  const badCred = 'Payment eyJub3QiOiJhIHJlYWwgY3JlZGVudGlhbCJ9';
  const b1 = await ask({ question: 'who are you?' }, { authorization: badCred });
  check('bad credential → 402 (not answered)', b1.status === 402, `${b1.status} ${JSON.stringify(b1.json).slice(0, 120)}`);
  const statuses: number[] = [b1.status];
  for (let i = 0; i < 5; i++) statuses.push((await ask({ question: 'who are you?' }, { authorization: badCred })).status);
  const limited = await ask({ question: 'who are you?' }, { authorization: badCred });
  check('6th credentialed request in a minute → 429 with Retry-After (same window as /api/mcp ask)', statuses.slice(0, 5).every((s) => s === 402) && statuses[5] === 429 && limited.status === 429 && !!limited.res.headers.get('retry-after'), statuses.join(','));
  const free = await ask({ question: 'who are you?' });
  check('challenge requests are not counted (still 402 after limit)', free.status === 402, String(free.status));
  check('no model call for bad credentials', dsSeen.length === before, `${dsSeen.length - before} calls`);

  // ── handler body: the shared public-door helper (paid path runs exactly this) ──
  resetRuntimeKvForTests();
  const { askChat } = await import('../../lib/agentMcp/askChat');
  const a = await askChat('hi, what does she work on?', 'harness-askpaid-1');
  const d1 = dsSeen[dsSeen.length - 1];
  check('askChat answers via the public door (deepseek, 200)', a.ok && /intercepted/.test(a.text), JSON.stringify(a));
  check('askChat: public sampling pinned (temp 0, top_p 1, max_tokens 200)', d1?.temperature === 0 && d1?.top_p === 1 && d1?.max_tokens === 200);
  const sys = String(((d1?.messages as Array<{ role: string; content: unknown }>) ?? []).find((m) => m.role === 'system')?.content ?? '');
  const tools = JSON.stringify(d1?.tools ?? null);
  const toolNames = ((d1?.tools as Array<{ function?: { name?: string } }>) ?? []).map((t) => t.function?.name ?? '').sort().join(',');
  const { POST: chatPOST } = await import('../../app/api/chat/route');
  resetRuntimeKvForTests();
  const direct = await chatPOST(
    new Request('https://aileena.xyz/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.9' },
      body: JSON.stringify({ agentMode: 'public', messages: [{ id: 'm1', role: 'user', parts: [{ type: 'text', text: 'hi, what does she work on?' }] }] }),
    }),
  );
  await direct.text();
  const d2 = dsSeen[dsSeen.length - 1];
  const sys2 = String(((d2?.messages as Array<{ role: string; content: unknown }>) ?? []).find((m) => m.role === 'system')?.content ?? '');
  check('paid path frozen prefix byte-identical to /api/chat public', sys.length > 0 && sys === sys2 && tools === JSON.stringify(d2?.tools ?? null));
  check('paid path exposes no owner tools (no callMcp/listMcpApps)', !/callMcp|listMcpApps/.test(toolNames), toolNames);
  const prefixSha = sha(`${sys}\n\u0000\n${tools}`);
  const expect = (process.env.MACHINA_EXPECT_PREFIX_SHA ?? '').trim();
  if (expect) check('prefix sha matches MACHINA_EXPECT_PREFIX_SHA', prefixSha === expect, prefixSha);
  console.log(`PREFIX system_sha256=${sha(sys)} tools_sha256=${sha(tools)} prefix_sha256=${prefixSha} x-prefix-hash=${direct.headers.get('x-prefix-hash')}`);
  console.log(`TOOLS ${toolNames}`);

  const failed = rows.filter((r) => !r.ok);
  for (const r of rows) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.detail && !r.ok ? ` — ${r.detail}` : ''}`);
  console.log(`\nask-paid: ${rows.length - failed.length}/${rows.length}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
