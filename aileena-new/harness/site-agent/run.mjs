#!/usr/bin/env node
// Site-agent harness runner. Zero dependencies (Node >= 20).
//
//   node harness/site-agent/run.mjs                 # local dev (http://localhost:3000)
//   node harness/site-agent/run.mjs --target live   # https://www.aileena.xyz, live-safe cases only
//   node harness/site-agent/run.mjs --target https://<preview>.vercel.app --only ground-keyshield
//
// Flags: --target local|live|<url>  --only id1,id2  --category security,persona
//        --delay <ms>  --max <n>  --plan (print what would run, send nothing)
//        --out <dir>  --include-side-effects (local only; never allowed on live)
//        --rescore <report.json>  re-run checks on captured replies, send nothing

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runChecks, passiveSecurityChecks } from './checks.mjs';
import { judge, judgeEnabled } from './judge.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const LIVE_URL = 'https://www.aileena.xyz';
const CHAT_PATH = '/api/chat'; // the ONLY path this runner ever POSTs to. Never /api/chat/forward, /api/lead, /api/send.

// Defense in depth: phrases that trigger server-side writes before the model runs
// (lib/siteLanes.ts forge lane, lib/computer/parseOwnerCommand.ts visitor scratch,
// lib/browserUse/parseBrowseCommand.ts). Matching turns are refused on live.
const SIDE_EFFECT_TRIGGERS = [
  /forge|open a pr|pull request|改代码/i,
  /^\s*(note:|learn:|find\b|list$|ls$|files$|peek|open last|read\b|clock$|time$|now$|git\b|run |\$)/i,
  /^\s*(browse|browser use)\b/i,
  /screenshot|take pictures of/i,
  /开电脑/,
];

function parseArgs(argv) {
  const a = { target: 'local', delay: undefined, max: undefined, only: null, category: null, plan: false, out: join(HERE, 'reports'), sideEffects: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = () => argv[++i];
    if (k === '--target') a.target = v();
    else if (k === '--delay') a.delay = Number(v());
    else if (k === '--max') a.max = Number(v());
    else if (k === '--only') a.only = v().split(',');
    else if (k === '--category') a.category = v().split(',');
    else if (k === '--plan') a.plan = true;
    else if (k === '--out') a.out = v();
    else if (k === '--include-side-effects') a.sideEffects = true;
    else if (k === '--rescore') a.rescore = v();
    else if (k === '-h' || k === '--help') {
      console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 12).join('\n'));
      process.exit(0);
    }
  }
  return a;
}

function resolveTarget(t) {
  if (t === 'live') return { name: 'live', base: LIVE_URL, live: true };
  if (t === 'local') return { name: 'local', base: process.env.HARNESS_LOCAL_URL || 'http://localhost:3000', live: false };
  const u = new URL(t);
  const live = !/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(u.hostname);
  return { name: live ? 'remote' : 'local', base: u.origin, live };
}

function toUIMessages(turns) {
  return turns.map((t, i) => ({ id: `h${i}`, role: t.role, parts: [{ type: 'text', text: t.text }] }));
}

/** Parse the AI SDK UI message stream (SSE `data: {json}` lines). */
function parseUIStream(raw) {
  let text = '';
  const tools = [];
  const toolResults = [];
  let streamError = '';
  for (const line of raw.split('\n')) {
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    let ev;
    try {
      ev = JSON.parse(payload);
    } catch {
      continue;
    }
    if (ev.type === 'text-delta') text += ev.delta ?? '';
    else if (ev.type === 'tool-input-start' || ev.type === 'tool-input-available') {
      if (ev.toolName && !tools.includes(ev.toolName)) tools.push(ev.toolName);
    } else if (ev.type === 'tool-output-available') toolResults.push({ id: ev.toolCallId, chars: JSON.stringify(ev.output ?? '').length });
    else if (ev.type === 'error') streamError = String(ev.errorText ?? 'stream error');
  }
  return { text, tools, toolResults, streamError };
}

class Jar {
  constructor() {
    this.c = new Map();
  }
  header(extra = {}) {
    const all = new Map([...this.c, ...Object.entries(extra)]);
    return [...all].map(([k, v]) => `${k}=${v}`).join('; ');
  }
  absorb(setCookies) {
    for (const sc of setCookies) {
      const [kv] = sc.split(';');
      const i = kv.indexOf('=');
      this.c.set(kv.slice(0, i), kv.slice(i + 1));
    }
  }
}

async function callOnce(target, c, jar) {
  const req = c.request || {};
  const body = {
    messages: toUIMessages(c.turns),
    agentMode: req.agentMode ?? 'public',
    sessionProvider: req.sessionProvider ?? '',
    ...(req.voiceAccent ? { voiceAccent: req.voiceAccent } : {}),
  };
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'aileena-site-agent-harness/0.1 (+harness/site-agent)',
    'X-Trace-Id': `harness-${c.id}`.slice(0, 40),
  };
  // Forged owner cookies go only on the case that tests them; never mixed into the shared jar.
  const cookie = jar.header(req.cookies || {});
  if (cookie) headers.Cookie = cookie;
  const t0 = Date.now();
  let res;
  try {
    res = await fetch(target.base + CHAT_PATH, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(45_000) });
  } catch (err) {
    return { status: 0, headers: {}, setCookies: [], text: '', tools: [], toolResults: [], rawBody: '', streamError: `fetch failed: ${err.message}`, ms: Date.now() - t0 };
  }
  let raw = '';
  let readError = '';
  try {
    raw = await res.text();
  } catch (err) {
    readError = `stream terminated: ${err.message}`;
  }
  const hdrs = Object.fromEntries([...res.headers].map(([k, v]) => [k.toLowerCase(), v]));
  const setCookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  if (!req.cookies) jar.absorb(setCookies.filter((s) => /^__aileena_(quota|vid)=/.test(s)));
  const parsed = (hdrs['content-type'] || '').includes('event-stream') ? parseUIStream(raw) : { text: '', tools: [], toolResults: [], streamError: '' };
  if (readError) parsed.streamError = readError;
  return { status: res.status, headers: hdrs, setCookies, rawBody: raw.slice(0, 4000), ...parsed, ms: Date.now() - t0 };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function mdEscape(s) {
  return String(s ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ');
}

function writeReports(outDir, report) {
  mkdirSync(outDir, { recursive: true });
  const stamp = report.startedAt.replace(/[:.]/g, '-');
  const base = join(outDir, `${report.target.name}-${stamp}`);
  writeFileSync(`${base}.json`, JSON.stringify(report, null, 2));
  const s = report.summary;
  const lines = [
    `# Site-agent harness — ${report.target.name}`,
    '',
    `- Target: ${report.target.base}${CHAT_PATH}`,
    `- Started: ${report.startedAt} · ${report.durationMs} ms`,
    `- Cases: ${s.total} run · **${s.pass} pass** · **${s.fail} fail** · ${s.warn} with warnings · ${s.skipped} skipped`,
    `- LLM judge: ${report.judge ? 'on' : 'off (set HARNESS_JUDGE_API_KEY to enable)'}`,
    '',
    '## Results',
    '',
    '| Case | Category | Result | HTTP | Route | Tools | ms | Failed checks |',
    '|---|---|---|---|---|---|---|---|',
    ...report.results.map((r) =>
      `| ${r.id} | ${r.category} | ${r.skipped ? 'SKIP' : r.pass ? (r.warnings ? 'PASS (warn)' : 'PASS') : '**FAIL**'} | ${r.status ?? ''} | ${r.route ?? ''} | ${(r.tools || []).join(', ')} | ${r.ms ?? ''} | ${mdEscape(r.skipped ? r.skipReason : r.checks.filter((c) => !c.ok).map((c) => `${c.name}: ${c.detail}`).join('; '))} |`,
    ),
    '',
    '## Passive security findings',
    '',
    ...(report.passive.length ? report.passive.map((f) => `- **${f.id}** (${f.severity}, ${f.ok ? 'ok' : 'flag'}): ${f.detail}`) : ['- none']),
    '',
    '## Replies',
    '',
    ...report.results.filter((r) => !r.skipped).flatMap((r) => [
      `### ${r.id}`,
      '',
      `> ${mdEscape(r.lastUser)}`,
      '',
      '```text',
      (r.text || r.rawBody || '').slice(0, 1200),
      '```',
      ...(r.judge ? ['', `Judge: ${JSON.stringify(r.judge)}`] : []),
      '',
    ]),
  ];
  writeFileSync(`${base}.md`, lines.join('\n'));
  writeFileSync(join(outDir, `${report.target.name}-latest.json`), JSON.stringify(report, null, 2));
  writeFileSync(join(outDir, `${report.target.name}-latest.md`), lines.join('\n'));
  return { json: `${base}.json`, md: `${base}.md` };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = resolveTarget(args.target);
  const suite = JSON.parse(readFileSync(join(HERE, 'cases', 'site-agent.json'), 'utf8'));
  const delay = args.delay ?? (target.live ? 2500 : 200);
  const max = args.max ?? (target.live ? 24 : Infinity);
  if (target.live && args.sideEffects) {
    console.error('--include-side-effects is local-only. Refusing.');
    process.exit(2);
  }

  if (args.rescore) return rescore(args, suite);

  const results = [];
  let sent = 0;
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const jar = new Jar();

  for (const c of suite.cases) {
    if (args.only && !args.only.includes(c.id)) continue;
    if (args.category && !args.category.includes(c.category)) continue;
    const lastUser = [...c.turns].reverse().find((t) => t.role === 'user')?.text ?? '';
    const base = { id: c.id, category: c.category, lastUser };
    const trigger = SIDE_EFFECT_TRIGGERS.find((re) => re.test(lastUser));
    let skipReason = '';
    if (target.live && c.live === false) skipReason = c.sideEffect ? `side effect on live: ${c.sideEffect}` : 'local-only case';
    else if (target.live && trigger) skipReason = `turn matches side-effect trigger ${trigger}`;
    else if (!target.live && (c.sideEffect || trigger) && !args.sideEffects) skipReason = 'side-effect case; pass --include-side-effects on local dev';
    else if (sent >= max) skipReason = `request cap ${max} reached`;
    if (skipReason) {
      results.push({ ...base, skipped: true, skipReason, checks: [] });
      continue;
    }
    if (args.plan) {
      results.push({ ...base, skipped: true, skipReason: 'plan only', checks: [] });
      continue;
    }
    if (sent > 0) await sleep(delay);
    sent++;
    const res = await callOnce(target, c, jar);
    const checks = runChecks(c, res, suite.canaries || []);
    let jv;
    if (judgeEnabled() && c.judge && res.text) {
      const transcript = c.turns.map((t) => `${t.role}: ${t.text}`).join('\n');
      jv = await judge(c, transcript, res.text).catch((e) => ({ error: e.message }));
      if (jv && typeof jv.pass === 'boolean') checks.push({ name: 'llm judge', ok: jv.pass, severity: 'warn', detail: `${jv.score}/5 ${jv.reason ?? ''}` });
    }
    const hard = checks.filter((k) => k.severity === 'fail');
    const r = {
      ...base,
      skipped: false,
      pass: hard.every((k) => k.ok),
      warnings: checks.filter((k) => k.severity === 'warn' && !k.ok).length,
      status: res.status,
      route: res.headers['x-tool-route'] ?? (res.headers['x-computer-fast-path'] ? 'lane' : ''),
      agentMode: res.headers['x-agent-mode'],
      provider: res.headers['x-provider'],
      traceId: res.headers['x-trace-id'],
      dailyRemaining: res.headers['x-daily-remaining'],
      tools: res.tools,
      ms: res.ms,
      text: res.text,
      rawBody: res.text ? undefined : res.rawBody,
      headers: Object.fromEntries(Object.entries(res.headers).filter(([k]) => k.startsWith('x-') && !k.startsWith('x-vercel'))),
      setCookies: res.setCookies.map((s) => s.split(';')[0]),
      checks,
      judge: jv,
    };
    results.push(r);
    console.log(`${r.pass ? 'PASS' : 'FAIL'}${r.warnings ? '*' : ' '} ${c.id.padEnd(36)} ${String(r.status).padEnd(4)} ${r.route.padEnd(15)} ${r.ms}ms`);
    if (!r.pass) for (const k of checks.filter((k) => !k.ok && k.severity === 'fail')) console.log(`      ✗ ${k.name}: ${k.detail}`);
  }

  const ran = results.filter((r) => !r.skipped);
  const report = {
    harness: 'aileena site-agent harness v0.1',
    target,
    startedAt,
    durationMs: Date.now() - t0,
    judge: judgeEnabled(),
    summary: {
      total: ran.length,
      pass: ran.filter((r) => r.pass).length,
      fail: ran.filter((r) => !r.pass).length,
      warn: ran.filter((r) => r.warnings).length,
      skipped: results.length - ran.length,
    },
    passive: passiveSecurityChecks(ran),
    results,
  };
  for (const r of results) delete r.setCookies; // keep visitor ids out of committed reports
  const paths = args.plan ? null : writeReports(args.out, report);
  const s = report.summary;
  console.log(`\n${s.pass}/${s.total} pass · ${s.fail} fail · ${s.warn} warn · ${s.skipped} skipped`);
  for (const f of report.passive) console.log(`passive: ${f.id} (${f.severity}) ${f.ok ? 'ok' : 'FLAG'}`);
  if (paths) console.log(`report: ${paths.md}\n        ${paths.json}`);
  if (args.plan) for (const r of results) console.log(`  ${r.id.padEnd(36)} ${r.skipReason}`);
  process.exit(s.fail ? 1 : 0);
}

/** Re-apply the current checks to replies captured in an earlier report. No network. */
function rescore(args, suite) {
  const prev = JSON.parse(readFileSync(args.rescore, 'utf8'));
  const byId = new Map(suite.cases.map((c) => [c.id, c]));
  for (const r of prev.results) {
    const c = byId.get(r.id);
    if (!c || r.skipped) continue;
    const res = { status: r.status, headers: r.headers || {}, text: r.text || '', rawBody: r.rawBody || '', tools: r.tools || [], streamError: '' };
    r.checks = runChecks(c, res, suite.canaries || []);
    r.pass = r.checks.filter((k) => k.severity === 'fail').every((k) => k.ok);
    r.warnings = r.checks.filter((k) => k.severity === 'warn' && !k.ok).length;
    console.log(`${r.pass ? 'PASS' : 'FAIL'}${r.warnings ? '*' : ' '} ${r.id}`);
  }
  const ran = prev.results.filter((r) => !r.skipped);
  prev.rescoredAt = new Date().toISOString();
  prev.summary = { total: ran.length, pass: ran.filter((r) => r.pass).length, fail: ran.filter((r) => !r.pass).length, warn: ran.filter((r) => r.warnings).length, skipped: prev.results.length - ran.length };
  prev.target = { ...prev.target, name: `${prev.target.name}-rescored` };
  const paths = writeReports(args.out, prev);
  console.log(`\n${prev.summary.pass}/${prev.summary.total} pass · ${prev.summary.fail} fail\nreport: ${paths.md}`);
}

main();
