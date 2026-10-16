/**
 * Inference bench: N owner turns against a target, then TTFT / latency /
 * decode speed / prefix-cache hits. Results land on the owner dashboard
 * (/agent-analytics/performance → Bench).
 *
 * Site mode (default): owner turns through /api/chat, so the full stack is
 * measured (routing, prompt build, guard) and the server records each turn
 * tagged src=bench.
 *   AILEENA_OWNER_COOKIE=<value of the __aileena_pass cookie> \
 *     pnpm bench:inference --base https://www.aileena.xyz --tier deepseek --n 5 --run flash-1
 *   (locally, AUTH_SECRET in the environment mints an owner session instead)
 *
 * Direct mode: raw OpenAI-compatible endpoint (DeepSeek API or the GPU base
 * URL), same prompt shape. --report posts the results to the dashboard.
 *   pnpm bench:inference --target openai --base-url https://api.deepseek.com \
 *     --model deepseek-flash --key-env DEEPSEEK_API_KEY --n 5 --report
 *
 * Every turn costs money (and a site turn is an owner turn: no visitor quota).
 * Keys are read from the env var you name and never printed.
 */
import { estimateTurnCostUsd } from '../lib/agentRuntime/pricing';

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export const BENCH_QUESTIONS = [
  'What does Aileen work on, in two sentences?',
  'What is this site, and where should I start?',
  'Summarize her PCB article in two lines.',
  'Give me one link to start with.',
  'What is DeepSeek Harness, briefly?',
  'What kind of music does she like?',
];

export type BenchTurn = {
  i: number;
  ok: boolean;
  status: number;
  provider: string | null;
  ttftMs: number | null;
  latencyMs: number;
  chars: number;
  inTok?: number;
  outTok?: number;
  cacheHit?: number | null;
  cacheMiss?: number | null;
  costUsd?: number | null;
  error?: string;
};

function pctl(v: number[], q: number): number | null {
  const s = v.filter(Number.isFinite).sort((a, b) => a - b);
  return s.length ? s[Math.min(s.length - 1, Math.max(0, Math.ceil(q * s.length) - 1))] : null;
}

export function benchReport(turns: BenchTurn[]) {
  const ok = turns.filter((t) => t.ok);
  const ttft = ok.map((t) => t.ttftMs).filter((x): x is number => x !== null);
  const lat = ok.map((t) => t.latencyMs);
  const decode = ok
    .map((t) => (t.outTok && t.ttftMs !== null && t.latencyMs > t.ttftMs ? t.outTok / ((t.latencyMs - t.ttftMs) / 1000) : null))
    .filter((x): x is number => x !== null);
  let hit = 0;
  let all = 0;
  for (const t of ok) {
    if (t.cacheHit === null || t.cacheHit === undefined) continue;
    hit += t.cacheHit;
    all += t.cacheHit + (t.cacheMiss ?? Math.max(0, (t.inTok ?? 0) - t.cacheHit));
  }
  return {
    n: turns.length,
    ok: ok.length,
    ttftP50: pctl(ttft, 0.5),
    ttftP95: pctl(ttft, 0.95),
    latencyP50: pctl(lat, 0.5),
    latencyP95: pctl(lat, 0.95),
    decodeTokS: pctl(decode, 0.5),
    cacheHitRate: all ? hit / all : null,
    providers: [...new Set(ok.map((t) => t.provider).filter(Boolean))],
  };
}

/** Read a UI-message SSE stream; return time of first visible text and char count. */
async function readUiStream(res: Response, t0: number): Promise<{ ttftMs: number | null; chars: number; error?: string }> {
  if (!res.body) return { ttftMs: null, chars: 0 };
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let ttftMs: number | null = null;
  let chars = 0;
  let error: string | undefined;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line.startsWith('data: {')) continue;
      try {
        const p = JSON.parse(line.slice(6)) as { type: string; delta?: string; errorText?: string };
        if (p.type === 'text-delta' && p.delta) {
          if (ttftMs === null && p.delta.trim()) ttftMs = Date.now() - t0;
          chars += p.delta.length;
        }
        if (p.type === 'error') error = 'error_part';
      } catch {
        /* partial line */
      }
    }
  }
  return { ttftMs, chars, error };
}

export async function runSiteBench(o: {
  base: string;
  cookie: string;
  n: number;
  tier: 'deepseek' | 'gpu' | 'auto';
  run: string;
  fetchImpl?: FetchLike;
  log?: (s: string) => void;
}): Promise<{ run: string; turns: BenchTurn[]; server: unknown }> {
  const f = o.fetchImpl ?? (fetch as FetchLike);
  const turns: BenchTurn[] = [];
  for (let i = 0; i < o.n; i++) {
    const q = BENCH_QUESTIONS[i % BENCH_QUESTIONS.length];
    const t0 = Date.now();
    try {
      const res = await f(`${o.base}/api/chat`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: `__aileena_pass=${o.cookie}`,
          'x-perf-source': 'bench',
          'x-perf-run': o.run,
          'x-trace-id': `bench-${o.run}-${i}`,
        },
        body: JSON.stringify({
          agentMode: 'public',
          sessionId: `bench-${o.run}-${i}`,
          ...(o.tier === 'auto' ? {} : { modelTier: o.tier }),
          messages: [{ id: `b${i}`, role: 'user', parts: [{ type: 'text', text: q }] }],
        }),
      });
      const read = res.ok ? await readUiStream(res, t0) : { ttftMs: null, chars: 0, error: `http_${res.status}` };
      turns.push({
        i,
        ok: res.ok && read.chars > 0 && !read.error,
        status: res.status,
        provider: res.headers.get('x-provider'),
        ttftMs: read.ttftMs,
        latencyMs: Date.now() - t0,
        chars: read.chars,
        error: read.error,
      });
    } catch (err) {
      turns.push({ i, ok: false, status: 0, provider: null, ttftMs: null, latencyMs: Date.now() - t0, chars: 0, error: String(err).slice(0, 80) });
    }
    o.log?.(`turn ${i + 1}/${o.n} ${turns[i].status} ${turns[i].provider ?? '-'} ttft=${turns[i].ttftMs ?? '-'}ms total=${turns[i].latencyMs}ms`);
  }
  // Server-side view of this run (tokens, cache hits, cost) from the owner API.
  let server: unknown = null;
  try {
    await new Promise((r) => setTimeout(r, 300));
    const res = await f(`${o.base}/api/agent/perf?src=bench`, { headers: { cookie: `__aileena_pass=${o.cookie}` } });
    if (res.ok) {
      const d = (await res.json()) as { benchRuns?: Array<{ key: string; s: unknown }> };
      server = (d.benchRuns ?? []).filter((r) => r.key.startsWith(`${o.run} · `));
    }
  } catch {
    /* optional */
  }
  return { run: o.run, turns, server };
}

const SYSTEM = `You are the console on Aileen's site. Answer in at most three sentences. ${Array.from(
  { length: 120 },
  (_, i) => `Note ${i}: keep answers grounded in her own writing.`,
).join(' ')}`;

export async function runOpenAiBench(o: {
  baseUrl: string;
  apiKey: string;
  model: string;
  n: number;
  fetchImpl?: FetchLike;
  log?: (s: string) => void;
}): Promise<{ turns: BenchTurn[] }> {
  const f = o.fetchImpl ?? (fetch as FetchLike);
  const isDeepSeek = /deepseek/i.test(o.baseUrl) || o.model.startsWith('deepseek');
  const turns: BenchTurn[] = [];
  for (let i = 0; i < o.n; i++) {
    const t0 = Date.now();
    let ttftMs: number | null = null;
    let chars = 0;
    let usage: Record<string, unknown> | null = null;
    try {
      const res = await f(`${o.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${o.apiKey}` },
        body: JSON.stringify({
          model: o.model,
          stream: true,
          stream_options: { include_usage: true },
          max_tokens: 200,
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: BENCH_QUESTIONS[i % BENCH_QUESTIONS.length] },
          ],
          ...(isDeepSeek ? { thinking: { type: 'disabled' } } : { chat_template_kwargs: { enable_thinking: false } }),
        }),
      });
      if (!res.ok || !res.body) throw new Error(`http_${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line.startsWith('data: {')) continue;
          const c = JSON.parse(line.slice(6)) as { usage?: Record<string, unknown>; choices?: Array<{ delta?: { content?: string } }> };
          if (c.usage) usage = c.usage;
          const d = c.choices?.[0]?.delta?.content;
          if (d) {
            if (ttftMs === null && d.trim()) ttftMs = Date.now() - t0;
            chars += d.length;
          }
        }
      }
      const inTok = Number(usage?.prompt_tokens) || 0;
      const outTok = Number(usage?.completion_tokens) || 0;
      // DeepSeek: prompt_cache_hit_tokens / prompt_cache_miss_tokens; vLLM: prompt_tokens_details.cached_tokens.
      const dsHit = usage?.prompt_cache_hit_tokens;
      const vHit = (usage?.prompt_tokens_details as { cached_tokens?: unknown } | undefined)?.cached_tokens;
      const cacheHit = dsHit !== undefined ? Number(dsHit) : vHit !== undefined ? Number(vHit) : null;
      const cacheMiss = usage?.prompt_cache_miss_tokens !== undefined ? Number(usage.prompt_cache_miss_tokens) : cacheHit !== null ? Math.max(0, inTok - cacheHit) : null;
      const latencyMs = Date.now() - t0;
      turns.push({
        i,
        ok: chars > 0,
        status: res.status,
        provider: isDeepSeek ? 'deepseek' : 'gpu',
        ttftMs,
        latencyMs,
        chars,
        inTok,
        outTok,
        cacheHit,
        cacheMiss,
        costUsd: estimateTurnCostUsd({ provider: isDeepSeek ? 'deepseek' : 'gpu', model: o.model, at: t0, inTok, outTok, hit: cacheHit, miss: cacheMiss, modelMs: latencyMs }),
      });
    } catch (err) {
      turns.push({ i, ok: false, status: 0, provider: null, ttftMs: null, latencyMs: Date.now() - t0, chars: 0, error: String(err).slice(0, 80) });
    }
    o.log?.(`turn ${i + 1}/${o.n} ttft=${turns[i].ttftMs ?? '-'}ms total=${turns[i].latencyMs}ms cached=${turns[i].cacheHit ?? '-'}`);
  }
  return { turns };
}

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return fallback;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : 'true';
}

async function ownerCookie(): Promise<string> {
  if (process.env.AILEENA_OWNER_COOKIE) return process.env.AILEENA_OWNER_COOKIE;
  if (process.env.AUTH_SECRET) {
    const { createOwnerSession } = await import('../lib/auth');
    return createOwnerSession();
  }
  throw new Error('Set AILEENA_OWNER_COOKIE (value of the __aileena_pass cookie after unlocking) or AUTH_SECRET (local only).');
}

async function main() {
  const n = Math.max(1, Math.min(50, Number(arg('n', '5'))));
  const run = (arg('run') ?? `run-${new Date().toISOString().slice(5, 16).replace(/[-:T]/g, '')}`).slice(0, 40);
  const log = (s: string) => console.log(s);
  if (arg('target', 'site') === 'openai') {
    const baseUrl = arg('base-url') ?? process.env.AGENT_GPU_BASE_URL;
    const keyEnv = arg('key-env', 'AGENT_GPU_API_KEY')!;
    const apiKey = process.env[keyEnv];
    const model = arg('model', process.env.AGENT_GPU_MODEL || 'open-8b')!;
    if (!baseUrl || !apiKey) throw new Error(`Need --base-url and the key in $${keyEnv}.`);
    const { turns } = await runOpenAiBench({ baseUrl, apiKey, model, n, log });
    console.log(JSON.stringify({ run, target: 'openai', model, report: benchReport(turns) }, null, 2));
    if (arg('report')) {
      const base = arg('base', 'https://www.aileena.xyz')!;
      const variant = arg('variant');
      const res = await fetch(`${base}/api/agent/perf`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: `__aileena_pass=${await ownerCookie()}` },
        body: JSON.stringify({
          run,
          turns: turns.map((t) => ({ ...t, at: Date.now(), model, variant, tier: 'direct', outcome: t.ok ? 'ok' : 'error' })),
        }),
      });
      console.log(`reported to ${base}: ${res.status}`);
    }
    return;
  }
  const base = arg('base', 'http://localhost:3000')!;
  const tier = (arg('tier', 'auto') as 'deepseek' | 'gpu' | 'auto') ?? 'auto';
  const out = await runSiteBench({ base, cookie: await ownerCookie(), n, tier, run, log });
  console.log(JSON.stringify({ run, target: base, tier, report: benchReport(out.turns), server: out.server }, null, 2));
}

if (process.argv[1] && /bench-inference\.ts$/.test(process.argv[1])) {
  main().catch((e) => {
    console.error(String(e instanceof Error ? e.message : e));
    process.exit(1);
  });
}
