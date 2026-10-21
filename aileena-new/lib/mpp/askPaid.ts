/**
 * Pay-per-question for Machina over MPP (Machine Payments Protocol, `mppx`).
 *
 * POST /api/ask-paid { "question": "..." } → { answer, traceId }. One-off
 * `charge` intent on Tempo (testnet unless MPP_NETWORK=mainnet). The answer
 * runs through the same in-process public door as /api/mcp (askChat): public
 * mode, propose-only, same guards, same frozen prefix, answer cache allowed.
 *
 * Env (read per request, nothing at import time):
 *   MPP_PAID_ENABLED=1        feature flag; off → 404
 *   MPP_RECIPIENT=0x…         address that receives payment (no server wallet)
 *   MPP_SECRET_KEY=…          ≥32 bytes, binds challenges (openssl rand -hex 32)
 *   MPP_PRICE_PER_QUESTION    USD, default "0.01"
 *   MPP_NETWORK               "testnet" (default) | "mainnet"
 * Flag on but recipient/secret missing or invalid → 503 JSON.
 */
import { Credential, Store } from 'mppx';
import { Mppx, tempo } from 'mppx/nextjs';
import type { Redis } from '@upstash/redis';
import { askChat } from '../agentMcp/askChat';
import { AGENT_LIMITS, takeAgentRate } from '../agentMcp/rateLimit';
import { MAX_QUESTION_CHARS } from '../agentMcp/server';
import { clientIpTransient, dailyVisitorHash } from '../agentEngage/visitorHash';
import { getVisitorRedis } from '../visitorMemory';

export type PaidConfig = {
  recipient: `0x${string}`;
  secretKey: string;
  price: string;
  testnet: boolean;
};

export function paidEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return /^(1|true|on|yes)$/i.test((env.MPP_PAID_ENABLED ?? '').trim());
}

/** Validated config, or the names of the env vars that are missing/invalid. */
export function readPaidConfig(env: NodeJS.ProcessEnv = process.env): { ok: true; cfg: PaidConfig } | { ok: false; missing: string[] } {
  const missing: string[] = [];
  const recipient = (env.MPP_RECIPIENT ?? '').trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(recipient)) missing.push('MPP_RECIPIENT');
  const secretKey = env.MPP_SECRET_KEY ?? '';
  if (new TextEncoder().encode(secretKey).byteLength < 32) missing.push('MPP_SECRET_KEY');
  const price = (env.MPP_PRICE_PER_QUESTION ?? '').trim() || '0.01';
  if (!/^\d+(\.\d{1,6})?$/.test(price) || Number(price) <= 0) missing.push('MPP_PRICE_PER_QUESTION');
  const network = ((env.MPP_NETWORK ?? '').trim() || 'testnet').toLowerCase();
  if (network !== 'testnet' && network !== 'mainnet') missing.push('MPP_NETWORK');
  if (missing.length) return { ok: false, missing };
  return { ok: true, cfg: { recipient: recipient as `0x${string}`, secretKey, price, testnet: network === 'testnet' } };
}

/**
 * Charge replay protection shared across instances when Redis is configured
 * (SET NX PXAT = atomic first use); otherwise mppx's per-instance memory store.
 */
function replayStore(redis: Redis): Store.AtomicStore {
  return Store.from(
    {
      get: async (k: string) => (await redis.get(k)) ?? null,
      put: async (k: string, v: unknown) => {
        await redis.set(k, v);
      },
      delete: async (k: string) => {
        await redis.del(k);
      },
      update: async () => {
        throw new Error('ask-paid replay store supports tryClaim only');
      },
      tryClaim: async (k: string, expires: number) =>
        (await redis.set(k, { expires, type: 'mppx:replay' }, { nx: true, pxat: Math.max(expires, Date.now() + 1000) })) === 'OK',
    } as Store.AtomicStore,
    { keyPrefix: 'mpp:ask-paid:' },
  );
}

let cached: { sig: string; mppx: ReturnType<typeof createMppx> } | null = null;
function createMppx(cfg: PaidConfig) {
  const redis = getVisitorRedis();
  return Mppx.create({
    methods: [tempo.charge({ recipient: cfg.recipient, testnet: cfg.testnet, ...(redis ? { store: replayStore(redis) } : {}) })],
    secretKey: cfg.secretKey,
  });
}
function mppxFor(cfg: PaidConfig) {
  const sig = `${cfg.recipient}|${cfg.testnet}|${cfg.secretKey}`;
  if (!cached || cached.sig !== sig) cached = { sig, mppx: createMppx(cfg) };
  return cached.mppx;
}

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extra } });
}

type Deps = { ask: typeof askChat };

export async function handleAskPaid(req: Request, deps: Deps = { ask: askChat }, env: NodeJS.ProcessEnv = process.env): Promise<Response> {
  if (!paidEnabled(env)) return json({ error: 'Not found.' }, 404);
  const conf = readPaidConfig(env);
  if (!conf.ok) {
    console.warn('[ask-paid] disabled: env missing or invalid', { missing: conf.missing });
    return json({ error: 'Paid questions are not configured.', missing: conf.missing }, 503);
  }

  let question = '';
  try {
    const body = (await req.clone().json()) as { question?: unknown };
    question = typeof body?.question === 'string' ? body.question.trim() : '';
  } catch {
    return json({ error: 'Invalid JSON. Send {"question":"..."}.' }, 400);
  }
  if (!question) return json({ error: 'question is required.' }, 400);
  if (question.length > MAX_QUESTION_CHARS) return json({ error: `question is longer than ${MAX_QUESTION_CHARS} characters.` }, 400);

  const traceId = `paid_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  // Same windows as an /api/mcp ask (per caller + all agent callers). Only a
  // request that carries a Payment credential is counted, and it is counted
  // before the credential is verified, so an over-limit caller is refused
  // before a pull-mode payment is broadcast. Challenges (402) are free.
  const auth = req.headers.get('authorization') ?? '';
  if (Credential.extractPaymentScheme(auth)) {
    const callerKey = await dailyVisitorHash({ ip: clientIpTransient(req), purpose: 'ask-paid-caller' });
    for (const [key, windows] of [[callerKey, AGENT_LIMITS.ask], ['all', AGENT_LIMITS.globalAsk]] as const) {
      const r = await takeAgentRate(key, windows);
      if (!r.ok) return json({ error: 'Rate limit reached. Try again later.', retryAfterSec: r.retryAfterSec }, 429, { 'Retry-After': String(r.retryAfterSec) });
    }
  }

  const { price, testnet } = conf.cfg;
  return mppxFor(conf.cfg).charge({ amount: price, description: 'One question to Machina (aileena.xyz)' })(async () => {
    const r = await deps.ask(question, traceId);
    if (!r.ok) return json({ error: r.error, traceId }, r.status >= 400 ? r.status : 502);
    const answerCache = 'answerCache' in r && typeof r.answerCache === 'string' ? r.answerCache : null;
    return json(
      { answer: r.text, traceId: r.traceId ?? traceId },
      200,
      { 'X-Trace-Id': r.traceId ?? traceId, 'X-Mpp-Network': testnet ? 'testnet' : 'mainnet', ...(answerCache ? { 'X-Answer-Cache': answerCache } : {}) },
    );
  })(req);
}
