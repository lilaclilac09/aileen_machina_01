import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { SYSTEM_PROMPT } from '../../../lib/agentContext';

export const runtime = 'edge';
export const maxDuration = 30;

const MODEL = 'claude-sonnet-4-6';
const DAILY_LIMIT = 50;
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
  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError(
      'Server is missing ANTHROPIC_API_KEY. Set it in Vercel project settings (Production environment) and redeploy.',
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
      `Daily limit reached (${DAILY_LIMIT} messages). Try again tomorrow or use the contact form on the site.`,
      429,
    );
  }

  const trimmed = messages.slice(-20);
  const modelMessages = await convertToModelMessages(trimmed);

  const result = streamText({
    model: anthropic(MODEL),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    temperature: 0.4,
    providerOptions: {
      anthropic: {
        // Prompt caching on the static system block — repeat visitors only
        // pay for the new turn.
        cacheControl: { type: 'ephemeral' as const },
      },
    },
  });

  const setCookie = await buildQuotaCookie({ date: quota.date, count: quota.count + 1 });

  const stream = result.toUIMessageStreamResponse({
    // Map provider errors before they reach the browser. We never leak the raw
    // "credit balance is too low / Plans & Billing" text — this agent is a
    // personal demo, not a free public API.
    onError: (err) => {
      const msg = err instanceof Error ? err.message : String(err);
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

  return new Response(stream.body, { status: stream.status, headers });
}
