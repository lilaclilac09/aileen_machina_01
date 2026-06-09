import { streamText, convertToModelMessages, type UIMessage, type LanguageModel } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { SYSTEM_PROMPT } from '../../../lib/agentContext';

export const runtime = 'edge';
export const maxDuration = 30;

// Haiku is materially faster (TTFT + tokens/sec) than Sonnet, and this is a
// FAQ-style portfolio agent — depth of reasoning matters far less than how
// quickly the first words show up on screen. Switch back to Sonnet if answer
// quality regresses.
const ANTHROPIC_MODEL = 'claude-haiku-4-5';

/**
 * Pick the model. Tiered fallback:
 *   Tier 1 (primary)   — AGENT_BASE_URL (any OpenAI-compatible endpoint,
 *                        typically Gemini 2.5 Flash). Optional AGENT_API_KEY,
 *                        AGENT_MODEL.
 *   Tier 2 (fallback)  — DEEPSEEK_API_KEY — drops in DeepSeek-chat.
 *   Tier 3 (last resort) — ANTHROPIC_API_KEY — Claude Haiku 4.5.
 *
 * If the primary returns a rate-limit / quota / 5xx / timeout error, it gets
 * marked unhealthy for PRIMARY_UNHEALTHY_MS, during which selectModel will
 * skip Tier 1 and route directly to Tier 2. The next request after the
 * window will probe Tier 1 again.
 *
 * NOTE: AGENT_BASE_URL must be reachable from Vercel — a PUBLIC url, not
 * localhost.
 */

const PRIMARY_UNHEALTHY_MS = 60_000;
let primaryUnhealthyUntil = 0;

function markPrimaryUnhealthy() {
  primaryUnhealthyUntil = Date.now() + PRIMARY_UNHEALTHY_MS;
}
function primaryIsHealthy() {
  return Date.now() >= primaryUnhealthyUntil;
}

type Pick = {
  model: LanguageModel;
  isAnthropic: boolean;
  tier: 'primary' | 'fallback' | 'last-resort';
  provider: string;
};

function selectModel(): Pick | null {
  // Tier 1 — primary OpenAI-compatible endpoint (Gemini Flash, etc.).
  if (process.env.AGENT_BASE_URL && primaryIsHealthy()) {
    const local = createOpenAICompatible({
      name: 'aileena-primary',
      baseURL: process.env.AGENT_BASE_URL,
      apiKey: process.env.AGENT_API_KEY || 'local',
    });
    const modelId = process.env.AGENT_MODEL || 'local';
    return {
      model: local.chatModel(modelId),
      isAnthropic: false,
      tier: 'primary',
      provider: process.env.AGENT_BASE_URL,
    };
  }

  // Tier 2 — DeepSeek fallback.
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (deepseekKey) {
    const ds = createOpenAICompatible({
      name: 'aileena-deepseek',
      baseURL: 'https://api.deepseek.com',
      apiKey: deepseekKey,
    });
    return {
      model: ds.chatModel('deepseek-chat'),
      isAnthropic: false,
      tier: process.env.AGENT_BASE_URL ? 'fallback' : 'primary',
      provider: 'deepseek',
    };
  }

  // Tier 3 — Anthropic last resort.
  if (process.env.ANTHROPIC_API_KEY) {
    return {
      model: anthropic(ANTHROPIC_MODEL),
      isAnthropic: true,
      tier: 'last-resort',
      provider: 'anthropic',
    };
  }

  return null;
}
const DAILY_LIMIT = 20;
const QUOTA_COOKIE = '__aileena_quota';

/**
 * Per-visitor daily rate limiting via a signed cookie.
 *
 * Counter is stored in the visitor's own cookie. We sign it with HMAC so
 * the client can't trivially fake a lower count. Bypassable by clearing
 * cookies / using incognito, but that's a known and accepted trade-off for
 * a portfolio site — the alternative was provisioning a Vercel KV store.
 *
 * If CHAT_QUOTA_SECRET is unset we skip signature verification but still
 * use the counter (so the limit works, just isn't tamper-proof).
 */

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function b64urlEncode(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(value: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return b64urlEncode(new Uint8Array(sig));
}

type QuotaState = { date: string; count: number };

async function readQuota(req: Request): Promise<QuotaState> {
  const today = todayUTC();
  const cookieHeader = req.headers.get('cookie') ?? '';
  const match = cookieHeader.match(new RegExp(`${QUOTA_COOKIE}=([^;]+)`));
  if (!match) return { date: today, count: 0 };

  try {
    const raw = decodeURIComponent(match[1]);
    const dot = raw.indexOf('.');
    const encoded = dot === -1 ? raw : raw.slice(0, dot);
    const sig = dot === -1 ? '' : raw.slice(dot + 1);

    const secret = process.env.CHAT_QUOTA_SECRET ?? '';
    if (secret) {
      if (!sig) return { date: today, count: 0 };
      const expected = await hmac(encoded, secret);
      if (expected !== sig) return { date: today, count: 0 };
    }

    const decoded = JSON.parse(atob(encoded)) as Partial<QuotaState>;
    if (decoded.date !== today || typeof decoded.count !== 'number') {
      return { date: today, count: 0 };
    }
    return { date: decoded.date, count: decoded.count };
  } catch {
    return { date: today, count: 0 };
  }
}

async function buildQuotaCookie(state: QuotaState): Promise<string> {
  const encoded = btoa(JSON.stringify(state));
  const secret = process.env.CHAT_QUOTA_SECRET ?? '';
  const sig = secret ? await hmac(encoded, secret) : '';
  const value = sig ? `${encoded}.${sig}` : encoded;
  // 25 hours so the cookie naturally expires across the day boundary.
  return `${QUOTA_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=90000; HttpOnly; Secure; SameSite=Strict`;
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: Request) {
  if (!process.env.AGENT_BASE_URL && !process.env.DEEPSEEK_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    return jsonError(
      'No model configured. Set DEEPSEEK_API_KEY (easiest), AGENT_BASE_URL (any OpenAI-compatible endpoint), or ANTHROPIC_API_KEY in Vercel, then redeploy.',
      500,
    );
  }

  let body: { messages?: UIMessage[] };
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON.', 400);
  }

  const messages = body.messages ?? [];
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonError('No messages provided.', 400);
  }

  // Daily quota
  const quota = await readQuota(req);
  if (quota.count >= DAILY_LIMIT) {
    return jsonError(
      `Aileen stopped DJing for today — ${DAILY_LIMIT}-message daily limit. Back tomorrow.`,
      429,
    );
  }

  const trimmed = messages.slice(-20);
  const modelMessages = await convertToModelMessages(trimmed);

  const picked = selectModel();
  if (!picked) {
    return jsonError(
      'No model configured. Set AGENT_BASE_URL (preferred), DEEPSEEK_API_KEY, or ANTHROPIC_API_KEY in Vercel, then redeploy.',
      500,
    );
  }
  const result = streamText({
    model: picked.model,
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    temperature: 0.4,
    // Cap response length — a portfolio agent doesn't need essays. Shorter
    // generations finish noticeably faster end-to-end on slower providers
    // (DeepSeek in particular). 200 tokens ≈ 4–5 short sentences, which is
    // already at the upper bound of what the system prompt asks for.
    maxOutputTokens: 200,
    // Prompt caching on the static system block is Anthropic-specific — only
    // send it when we're actually on Anthropic.
    ...(picked.isAnthropic
      ? { providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' as const } } } }
      : {}),
  });

  const setCookie = await buildQuotaCookie({ date: quota.date, count: quota.count + 1 });

  const stream = result.toUIMessageStreamResponse({
    // Map provider errors before they reach the browser. We never leak the raw
    // "credit balance is too low / Plans & Billing" text — this agent is a
    // personal demo, not a free public API.
    onError: (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      // Log the REAL provider error server-side (visible in Vercel logs) while
      // still showing visitors a clean message.
      console.error('[chat] provider=%s tier=%s error: %s', picked.provider, picked.tier, msg);
      // If the PRIMARY tier choked on rate-limit / quota / 5xx / timeout,
      // mark it unhealthy so the next request automatically routes to the
      // fallback tier (DeepSeek) without trying the primary again.
      if (picked.tier === 'primary' && /429|rate.?limit|quota|insufficient|too many|503|502|504|timeout|gateway/i.test(msg)) {
        markPrimaryUnhealthy();
        console.warn('[chat] primary marked unhealthy for %ds', PRIMARY_UNHEALTHY_MS / 1000);
      }
      if (/credit balance|too low|insufficient|quota|billing|purchase credits|payment/i.test(msg)) {
        return "This agent isn't free to run — public access is off for now. Reach out through the contact form instead.";
      }
      return 'The agent hit a snag. Try again in a moment.';
    },
  });
  const headers = new Headers(stream.headers);
  headers.append('Set-Cookie', setCookie);
  // Surface the remaining-quota count to the client so the UI can hint at it
  // if it wants to. Not currently consumed but cheap to add.
  headers.set('X-Daily-Remaining', String(DAILY_LIMIT - (quota.count + 1)));
  // Diagnostic headers — visible in DevTools Network so it's obvious which
  // tier actually served the request and how big the system prompt was when
  // chat feels slow. Sanitise the provider URL so we never leak an api key.
  headers.set('X-Provider', picked.provider.replace(/^https?:\/\//, '').split(/[/?]/)[0]);
  headers.set('X-Tier', picked.tier);
  headers.set('X-System-Prompt-Chars', String(SYSTEM_PROMPT.length));

  return new Response(stream.body, { status: stream.status, headers });
}
