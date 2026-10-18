/**
 * Offline gate: console opening (starters, personalization, privacy), engagement
 * events + owner-only analytics, and the public agent-to-agent MCP endpoint.
 *
 *   pnpm exec tsx harness/site-agent/engage.ts
 */
process.env.AUTH_SECRET ||= 'harness-offline-secret-0123456789abcdef0123456789';
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;

import {
  classifySource,
  localeFromLanguages,
  pickOpening,
  regionFromCountry,
  topicFromPages,
  type VisitorContext,
} from '../../lib/agentEngage/opening';
import { parseEngageBody } from '../../lib/agentEngage/events';
import { readEngageStats, recordEngageEvent, resetEngageStoreForTests } from '../../lib/agentEngage/store';
import { dailyVisitorHash, countryFromRequest } from '../../lib/agentEngage/visitorHash';
import { handleMcpMessage, MCP_TOOLS, collectUiStreamText, type McpDeps } from '../../lib/agentMcp/server';
import { lookupProjects, publicProjects } from '../../lib/agentMcp/projects';
import { takeAgentRate, resetAgentRateForTests, AGENT_LIMITS } from '../../lib/agentMcp/rateLimit';
import { isAgentCaller, markAgentCaller } from '../../lib/agentCaller';
import { answerSiteLane } from '../../lib/siteLanes';
import { createOwnerSession, createSession, SESSION_COOKIE } from '../../lib/auth';

type Case = { id: string; ok: boolean; detail?: string };
const results: Case[] = [];
function check(id: string, ok: boolean, detail?: string) {
  results.push({ id, ok, detail });
}

const base: VisitorContext = { source: 'direct', landing: '/', pages: ['/'], locale: 'en', device: 'desktop' };

async function main() {
  resetAgentRateForTests();

  // ── Source classification ────────────────────────────────────────────────
  const src: Array<[string, string | undefined, string]> = [
    ['https://t.co/abc', undefined, 'x'],
    ['https://x.com/aileen', undefined, 'x'],
    ['https://github.com/lilaclilac09/tamper-check', undefined, 'github'],
    ['https://www.linkedin.com/in/x', undefined, 'linkedin'],
    ['https://lnkd.in/abc', undefined, 'linkedin'],
    ['https://www.google.com/', undefined, 'google'],
    ['https://www.google.co.uk/', undefined, 'google'],
    ['https://duckduckgo.com/', undefined, 'search'],
    ['', undefined, 'direct'],
    ['https://aileena.xyz/blog', undefined, 'internal'],
    ['', 'github', 'github'],
    ['', 'twitter', 'x'],
    ['https://news.ycombinator.com/', undefined, 'other'],
    ['not a url', undefined, 'direct'],
  ];
  for (const [ref, utm, want] of src) {
    const got = classifySource(ref, utm);
    check(`source:${ref || '(none)'}${utm ? `+utm=${utm}` : ''}`, got === want, `got ${got}`);
  }

  // ── Default opening: English, 4 one-tap starters on desktop ─────────────
  const def = pickOpening(base);
  check('opening:default-en-greeting', /^Hi — I'm Aileen's site agent\./.test(def.greeting), def.greeting);
  check(
    'opening:default-starters=tamper,keyshield,dj,infra',
    def.starters.map((s) => s.id).join(',') === 'tamper,keyshield,dj,infra',
    def.starters.map((s) => s.id).join(','),
  );
  check('opening:default-starters-english', def.starters.every((s) => /^[\x20-\x7E—’']+$/.test(s.text)));
  check('opening:mobile-3-starters', pickOpening({ ...base, device: 'mobile' }).starters.length === 3);
  check('opening:privacy-note', /No IPs/.test(def.privacyNote) && /\/privacy/.test(def.privacyNote));
  check('opening:placeholder-en', def.placeholder === 'Ask about her projects, writing or music…');

  // ── Personalization by source / landing / pages / locale / region ───────
  const gh = pickOpening({ ...base, source: 'github' });
  check('opening:github-code-greeting', /GitHub/.test(gh.greeting) && gh.topic === 'code', gh.greeting);
  const x = pickOpening({ ...base, source: 'x' });
  check('opening:x-prefix', x.greeting.startsWith('Coming from X? ') && !/Hi —/.test(x.greeting), x.greeting);
  const li = pickOpening({ ...base, source: 'linkedin' });
  check('opening:linkedin-work', li.topic === 'work' && li.starters[0].id === 'hire' && /LinkedIn/.test(li.greeting), li.greeting);
  const tamper = pickOpening({ ...base, source: 'github', landing: '/tools/tamper-check', pages: ['/tools/tamper-check'] });
  check('opening:tamper-landing-wins-over-source', tamper.topic === 'tamper' && tamper.starters[0].id === 'tamper');
  check('opening:pages-most-recent-first', topicFromPages(['/blog/x', '/sound'], '/') === 'dj');
  const zh = pickOpening({ ...base, locale: 'zh' });
  check('opening:zh', /Aileen 的站点助手/.test(zh.greeting) && zh.starters.every((s) => /[\u4e00-\u9fff]/.test(s.text)));
  const de = pickOpening({ ...base, locale: 'de' });
  check('opening:de', /Site-Agent/.test(de.greeting) && /Tamper Check/.test(de.starters[0].text));
  const dach = pickOpening({ ...base, region: 'dach' });
  check('opening:dach-region-only-nudges-4th', dach.starters[3].id === 'europe' && dach.starters[0].id === 'tamper');
  check('opening:never-names-region-or-city', !/Germany|Berlin|Shanghai|your city|your IP/i.test(JSON.stringify([def, gh, x, li, zh, de, dach])));

  // ── Locale: English primary ──────────────────────────────────────────────
  check('locale:en-US', localeFromLanguages(['en-US', 'zh-CN']) === 'en');
  check('locale:de-DE', localeFromLanguages(['de-DE', 'en']) === 'de');
  check('locale:zh-CN', localeFromLanguages(['zh-CN']) === 'zh');
  check('locale:fr→en', localeFromLanguages(['fr-FR']) === 'en');
  check('locale:empty→en', localeFromLanguages([]) === 'en');
  check('region:buckets', regionFromCountry('HK') === 'cn' && regionFromCountry('AT') === 'dach' && regionFromCountry('FR') === 'other');

  // ── Event validation ────────────────────────────────────────────────────
  check('events:rejects-unknown-type', parseEngageBody({ type: 'pageview', sid: 'abcdefgh12' }) === null);
  check('events:rejects-bad-sid', parseEngageBody({ type: 'open', sid: '../x' }) === null);
  check('events:rejects-agent_ask-from-browser', parseEngageBody({ type: 'agent_ask', sid: 'abcdefgh12' }) === null);
  const parsed = parseEngageBody({
    type: 'open',
    sid: 'abcdefgh12',
    source: 'github',
    landing: '/tools/tamper-check?utm_source=x&email=a@b.c',
    locale: 'zh',
    device: 'mobile',
    ip: '1.2.3.4',
    city: 'Berlin',
  });
  check('events:clamps-landing-drops-query', parsed?.dims.landing === '/tools/tamper-check', parsed?.dims.landing);
  check('events:ignores-ip-and-city', parsed !== null && !JSON.stringify(parsed).includes('1.2.3.4') && !JSON.stringify(parsed).includes('Berlin'));

  // ── Salted daily hash ────────────────────────────────────────────────────
  const day1 = Date.UTC(2026, 9, 16, 12);
  const h1 = await dailyVisitorHash({ ip: '203.0.113.7', purpose: 'engage' }, day1);
  const h1b = await dailyVisitorHash({ ip: '203.0.113.7', purpose: 'engage' }, day1 + 3600_000);
  const h2 = await dailyVisitorHash({ ip: '203.0.113.7', purpose: 'engage' }, day1 + 86_400_000);
  check('hash:stable-within-day', h1 === h1b);
  check('hash:rotates-daily', h1 !== h2);
  check('hash:no-raw-ip', !h1.includes('203') && /^[0-9a-f]{24}$/.test(h1), h1);
  check(
    'geo:country-only',
    countryFromRequest(new Request('https://x', { headers: { 'x-vercel-ip-country': 'de', 'x-vercel-ip-city': 'Berlin' } })) === 'DE',
  );

  // ── Store: funnel and breakdowns, no IPs ────────────────────────────────
  resetEngageStoreForTests();
  const dims = { source: 'github', landing: '/tools/tamper-check', country: 'DE', locale: 'en', device: 'desktop', caller: 'visitor' as const };
  const now = Date.now();
  await recordEngageEvent({ type: 'open', sid: 'sessaaaa01', dims, at: now, uniqHash: h1 });
  await recordEngageEvent({ type: 'starters_seen', sid: 'sessaaaa01', dims, at: now });
  await recordEngageEvent({ type: 'starter_tap', sid: 'sessaaaa01', starter: 'tamper', dims, at: now });
  await recordEngageEvent({ type: 'first_message', sid: 'sessaaaa01', dims, at: now });
  const dims2 = { ...dims, source: 'x', landing: '/', country: 'CN', locale: 'zh', device: 'mobile' };
  await recordEngageEvent({ type: 'open', sid: 'sessbbbb02', dims: dims2, at: now, uniqHash: h2 });
  await recordEngageEvent({ type: 'starters_seen', sid: 'sessbbbb02', dims: dims2, at: now });
  await recordEngageEvent({
    type: 'agent_ask',
    sid: 'agent-xyz',
    dims: { source: 'agent', landing: '/api/mcp', country: 'US', locale: 'unknown', device: 'curl', caller: 'agent' },
    at: now,
  });
  const stats = await readEngageStats(14);
  check('store:totals', stats.totals.opens === 2 && stats.totals.first_messages === 1 && stats.totals.starter_taps === 1, JSON.stringify(stats.totals));
  check('store:first-message-rate', Math.abs(stats.rates.firstMessageRate - 0.5) < 1e-9, String(stats.rates.firstMessageRate));
  check(
    'store:funnel',
    stats.funnel.opened === 2 && stats.funnel.sawStarters === 2 && stats.funnel.asked === 1,
    JSON.stringify(stats.funnel),
  );
  check('store:breakdown-source', stats.breakdown.source.github === 1 && stats.breakdown.source.x === 1, JSON.stringify(stats.breakdown.source));
  check('store:breakdown-country-lang', stats.breakdown.country.DE === 1 && stats.breakdown.locale.zh === 1);
  check('store:starter-breakdown', stats.breakdown.starter.tamper === 1);
  check('store:asked-by-source', stats.askedBy.source.github === 1 && !stats.askedBy.source.x);
  check('store:agent-traffic-tagged', stats.totals.agent_asks === 1 && stats.breakdown.caller.agent === 1);
  check('store:recent-has-no-ip-or-hash', !JSON.stringify(stats.recent).includes(h1) && !/\d+\.\d+\.\d+\.\d+/.test(JSON.stringify(stats.recent)));
  check('store:backend-reported', stats.backend === 'memory');

  // ── Analytics route: owner-only (same gate as council) ──────────────────
  const { GET: analyticsGET } = await import('../../app/api/agent/analytics/route');
  const anon = await analyticsGET(new Request('https://aileena.xyz/api/agent/analytics'));
  check('analytics:anonymous-403', anon.status === 403, String(anon.status));
  const visitorSess = await createSession('visitor@example.com', 'email');
  const vis = await analyticsGET(
    new Request('https://aileena.xyz/api/agent/analytics', { headers: { cookie: `${SESSION_COOKIE}=${encodeURIComponent(visitorSess)}` } }),
  );
  check('analytics:signed-in-visitor-403', vis.status === 403, String(vis.status));
  const forged = await analyticsGET(
    new Request('https://aileena.xyz/api/agent/analytics', { headers: { cookie: `${SESSION_COOKIE}=owner.forged.sig`, 'x-owner': '1' } }),
  );
  check('analytics:forged-cookie-403', forged.status === 403, String(forged.status));
  const ownerSess = await createOwnerSession();
  const own = await analyticsGET(
    new Request('https://aileena.xyz/api/agent/analytics', { headers: { cookie: `${SESSION_COOKIE}=${encodeURIComponent(ownerSess)}` } }),
  );
  const ownBody = (await own.json()) as { totals?: Record<string, number> };
  check('analytics:owner-200', own.status === 200 && ownBody.totals?.opens === 2, String(own.status));

  // ── Engage route ────────────────────────────────────────────────────────
  const { POST: engagePOST } = await import('../../app/api/agent/engage/route');
  const okRes = await engagePOST(
    new Request('https://aileena.xyz/api/agent/engage', {
      method: 'POST',
      headers: { 'x-vercel-ip-country': 'CN', 'x-forwarded-for': '198.51.100.9' },
      body: JSON.stringify({ type: 'open', sid: 'sesscccc03', source: 'google', landing: '/', locale: 'en', device: 'desktop' }),
    }),
  );
  const okBody = (await okRes.json()) as { ok: boolean; region: string };
  check('engage:post-200-region-bucket', okRes.status === 200 && okBody.region === 'cn', JSON.stringify(okBody));
  const badRes = await engagePOST(new Request('https://aileena.xyz/api/agent/engage', { method: 'POST', body: '{"type":"x"}' }));
  check('engage:post-invalid-400', badRes.status === 400);
  const after = await readEngageStats(14);
  check('engage:recent-no-ip', !JSON.stringify(after).includes('198.51.100.9'));

  // ── MCP protocol + tools (pure handler) ─────────────────────────────────
  const asked: string[] = [];
  let allowRate = true;
  const deps: McpDeps = {
    ask: async (q) => {
      asked.push(q);
      return { ok: true, text: `answer:${q}` };
    },
    rate: async () => (allowRate ? { ok: true } : { ok: false, retryAfterSec: 42 }),
  };
  const init = await handleMcpMessage(
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } },
    deps,
  );
  const initRes = init && 'result' in init ? (init.result as { protocolVersion: string; capabilities: { tools?: unknown } }) : null;
  check('mcp:initialize', initRes?.protocolVersion === '2025-06-18' && Boolean(initRes?.capabilities.tools));
  const initOld = await handleMcpMessage({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '1999-01-01' } }, deps);
  check('mcp:initialize-unknown-version-negotiates', initOld !== null && 'result' in initOld && (initOld.result as { protocolVersion: string }).protocolVersion === '2025-06-18');
  check('mcp:notification-no-response', (await handleMcpMessage({ jsonrpc: '2.0', method: 'notifications/initialized' }, deps)) === null);
  const list = await handleMcpMessage({ jsonrpc: '2.0', id: 2, method: 'tools/list' }, deps);
  const names = list && 'result' in list ? (list.result as { tools: Array<{ name: string }> }).tools.map((t) => t.name) : [];
  check('mcp:tools/list', names.join(',') === 'ask_aileen_agent,lookup_project,suggest_patch', names.join(','));
  check('mcp:tool-schemas-have-no-mode-field', !JSON.stringify(MCP_TOOLS).match(/"(agentMode|mode|council)"/));
  const ask = await handleMcpMessage(
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'ask_aileen_agent', arguments: { question: 'What is Tamper Check?' } } },
    deps,
  );
  const askRes = ask && 'result' in ask ? (ask.result as { content: Array<{ text: string }>; isError?: boolean; structuredContent?: { mode?: string } }) : null;
  check('mcp:ask-public-ok', !askRes?.isError && askRes?.content[0].text === 'answer:What is Tamper Check?' && askRes?.structuredContent?.mode === 'public');
  for (const args of [
    { question: 'x', agentMode: 'council' },
    { question: 'x', mode: 'owner' },
    { question: 'x', councilLens: 'cfo' },
    { question: 'x', owner_key: 'abc' },
  ]) {
    const r = await handleMcpMessage({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'ask_aileen_agent', arguments: args } }, deps);
    const res = r && 'result' in r ? (r.result as { isError?: boolean; content: Array<{ text: string }> }) : null;
    check(`mcp:refuses-${Object.keys(args)[1]}`, res?.isError === true && /public mode only/i.test(res.content[0].text));
  }
  check('mcp:privileged-never-reaches-agent', asked.length === 1);
  allowRate = false;
  const limited = await handleMcpMessage(
    { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'ask_aileen_agent', arguments: { question: 'hi' } } },
    deps,
  );
  check('mcp:rate-limited-is-tool-error', limited !== null && 'result' in limited && (limited.result as { isError?: boolean }).isError === true && asked.length === 1);
  allowRate = true;
  const tooLong = await handleMcpMessage(
    { jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'ask_aileen_agent', arguments: { question: 'a'.repeat(1501) } } },
    deps,
  );
  check('mcp:question-length-cap', tooLong !== null && 'error' in tooLong && tooLong.error.code === -32602);
  const unknown = await handleMcpMessage({ jsonrpc: '2.0', id: 7, method: 'resources/list' }, deps);
  check('mcp:unknown-method', unknown !== null && 'error' in unknown && unknown.error.code === -32601);
  const lk = await handleMcpMessage(
    { jsonrpc: '2.0', id: 8, method: 'tools/call', params: { name: 'lookup_project', arguments: { query: 'tamper check' } } },
    deps,
  );
  const lkRes = lk && 'result' in lk ? (lk.result as { structuredContent: { projects: Array<{ id: string; links: string[] }> } }) : null;
  check(
    'mcp:lookup-tamper',
    lkRes?.structuredContent.projects[0]?.id === 'tamper-check' &&
      lkRes.structuredContent.projects[0].links.includes('https://aileena.xyz/tools/tamper-check'),
    JSON.stringify(lkRes?.structuredContent.projects[0]),
  );
  check('projects:keyshield', lookupProjects('keyshield')[0]?.links.some((l) => l.includes('ks.aileena.xyz')) ?? false);
  check('projects:all', publicProjects().length >= 7);
  check('projects:no-private-copy', !/private|second brain|council|OWNER_KEY|\/workspace|lib\//i.test(JSON.stringify(publicProjects())));

  // ── Rate limiter ────────────────────────────────────────────────────────
  resetAgentRateForTests();
  let lastOk = true;
  for (let i = 0; i < 5; i++) lastOk = (await takeAgentRate('callerA', AGENT_LIMITS.ask)).ok;
  const sixth = await takeAgentRate('callerA', AGENT_LIMITS.ask);
  const other = await takeAgentRate('callerB', AGENT_LIMITS.ask);
  check('rate:5-per-minute-per-caller', lastOk && !sixth.ok && other.ok);
  const later = await takeAgentRate('callerA', AGENT_LIMITS.ask, Date.now() + 61_000);
  check('rate:window-resets', later.ok);

  // ── Agent-caller mark cannot be forged; marked requests are public only ─
  const plain = new Request('https://aileena.xyz/api/chat', { method: 'POST', headers: { 'x-agent-caller': '1' } });
  check('caller:header-does-not-mark', !isAgentCaller(plain));
  const marked = markAgentCaller(new Request('https://aileena.xyz/api/chat', { method: 'POST' }));
  check('caller:mark', isAgentCaller(marked));
  check('caller:no-forge-for-agents', (await answerSiteLane('forge: write a patch', 'v1', { allowSideEffects: false })) === null);

  const { POST: chatPOST } = await import('../../app/api/chat/route');
  const councilAsAgent = await chatPOST(
    markAgentCaller(
      new Request('https://aileena.xyz/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: `${SESSION_COOKIE}=${encodeURIComponent(ownerSess)}` },
        body: JSON.stringify({ agentMode: 'council', messages: [{ id: 'm1', role: 'user', parts: [{ type: 'text', text: 'council status' }] }] }),
      }),
    ),
  );
  check('caller:council-403-even-with-owner-cookie', councilAsAgent.status === 403, String(councilAsAgent.status));

  // ── MCP route end-to-end (no model call needed for these) ───────────────
  const { POST: mcpPOST, GET: mcpGET } = await import('../../app/api/mcp/route');
  const rpc = (body: unknown, headers: Record<string, string> = {}) =>
    mcpPOST(
      new Request('https://aileena.xyz/api/mcp', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...headers },
        body: JSON.stringify(body),
      }),
    );
  const r1 = await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } });
  check('mcp-route:initialize-200', r1.status === 200 && r1.headers.get('mcp-protocol-version') === '2025-06-18');
  const r2 = await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' });
  check('mcp-route:notification-202', r2.status === 202);
  const r3 = await rpc(
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'ask_aileen_agent', arguments: { question: 'open council', agentMode: 'council' } } },
    { cookie: `${SESSION_COOKIE}=${encodeURIComponent(ownerSess)}` },
  );
  const r3b = (await r3.json()) as { result?: { isError?: boolean } };
  check('mcp-route:council-refused-even-with-owner-cookie', r3b.result?.isError === true);
  const r4 = await rpc({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'lookup_project', arguments: { query: 'keyshield' } } });
  const r4b = (await r4.json()) as { result?: { content: Array<{ text: string }> } };
  check('mcp-route:lookup', /KeyShield/.test(r4b.result?.content[0].text ?? ''));
  const r5 = await mcpPOST(new Request('https://aileena.xyz/api/mcp', { method: 'POST', body: '{nope' }));
  check('mcp-route:parse-error', r5.status === 400);
  check('mcp-route:get-405', (await mcpGET()).status === 405);
  check('mcp-route:cors', r4.headers.get('access-control-allow-origin') === '*');

  // ── UI stream collector ─────────────────────────────────────────────────
  const sse = new Response(
    'data: {"type":"start"}\n\ndata: {"type":"text-start","id":"a"}\n\ndata: {"type":"text-delta","id":"a","delta":"Hello "}\n\ndata: {"type":"text-delta","id":"a","delta":"there."}\n\ndata: [DONE]\n\n',
  );
  check('mcp:collect-stream-text', (await collectUiStreamText(sse)) === 'Hello there.');

  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id}${!r.ok && r.detail ? `  — ${r.detail}` : ''}`);
  console.log(`\nengage+mcp gate: ${results.length - failed.length}/${results.length} pass`);
  if (failed.length) process.exit(1);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
