import { streamText, convertToModelMessages, type UIMessage, type LanguageModel } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { SYSTEM_PROMPT } from '../../../lib/agentContext';

export const runtime = 'edge';
export const maxDuration = 30;

/**
 * DeepSeek-only. Tier abstraction + AGENT_BASE_URL (Gemini Flash) primary
 * branch were removed — Gemini Flash is set aside for now. To re-introduce
 * a primary tier, see git history before this commit for the two-tier
 * pattern with primary-unhealthy tracking.
 */

function selectModel(): { model: LanguageModel; provider: string } | null {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.AGENT_API_KEY;
  if (!apiKey) {
    console.error('[chat] selectModel: DEEPSEEK_API_KEY or AGENT_API_KEY is missing in process.env');
    return null;
  }

  try {
    const ds = createOpenAICompatible({
      name: 'aileena-deepseek',
      baseURL: 'https://api.deepseek.com',
      apiKey: apiKey,
    });
    return {
      model: ds.chatModel('deepseek-chat'),
      provider: 'deepseek',
    };
  } catch (err) {
    console.error('[chat] selectModel: failed to initialize DeepSeek client', err);
    return null;
  }
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
      if (!sig) {
        console.warn('[chat] readQuota: cookie signature missing but CHAT_QUOTA_SECRET is set');
        return { date: today, count: 0 };
      }
      const expected = await hmac(encoded, secret);
      if (expected !== sig) {
        console.warn('[chat] readQuota: cookie signature mismatch');
        return { date: today, count: 0 };
      }
    }

    const decoded = JSON.parse(atob(encoded)) as Partial<QuotaState>;
    if (decoded.date !== today || typeof decoded.count !== 'number') {
      return { date: today, count: 0 };
    }
    return { date: decoded.date, count: decoded.count };
  } catch (err) {
    console.error('[chat] readQuota: error parsing/verifying quota cookie', err);
    return { date: today, count: 0 };
  }
}

async function buildQuotaCookie(state: QuotaState): Promise<string> {
  try {
    const encoded = btoa(JSON.stringify(state));
    const secret = process.env.CHAT_QUOTA_SECRET ?? '';
    const sig = secret ? await hmac(encoded, secret) : '';
    const value = sig ? `${encoded}.${sig}` : encoded;
    // 25 hours so the cookie naturally expires across the day boundary.
    return `${QUOTA_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=90000; HttpOnly; Secure; SameSite=Strict`;
  } catch (err) {
    console.error('[chat] buildQuotaCookie: error building cookie', err);
    return '';
  }
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: Request) {
  console.log('[chat] POST request started');
  
  if (!process.env.DEEPSEEK_API_KEY && !process.env.AGENT_API_KEY) {
    console.error('[chat] POST: DEEPSEEK_API_KEY or AGENT_API_KEY is not configured');
    return jsonError(
      'No model configured. Set DEEPSEEK_API_KEY in Vercel, then redeploy.',
      500,
    );
  }

  let body: { messages?: UIMessage[] };
  try {
    body = await req.json();
  } catch (err) {
    console.error('[chat] POST: failed to parse JSON body', err);
    return jsonError('Invalid JSON.', 400);
  }

  const messages = body.messages ?? [];
  if (!Array.isArray(messages) || messages.length === 0) {
    console.error('[chat] POST: messages array is empty or missing');
    return jsonError('No messages provided.', 400);
  }

  // Daily quota
  const quota = await readQuota(req);
  if (quota.count >= DAILY_LIMIT) {
    console.warn('[chat] POST: daily limit reached for user', { count: quota.count });
    return jsonError(
      `Aileen stopped DJing for today — ${DAILY_LIMIT}-message daily limit. Back tomorrow.`,
      429,
    );
  }

  const trimmed = messages.slice(-20);
  const modelMessages = await convertToModelMessages(trimmed);

  const picked = selectModel();
  if (!picked) {
    console.error('[chat] POST: selectModel returned null');
    return jsonError(
      'No model configured. Set DEEPSEEK_API_KEY in Vercel, then redeploy.',
      500,
    );
  }

  console.log('[chat] POST: starting streamText', { provider: picked.provider });

  try {
    const result = streamText({
      model: picked.model,
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      temperature: 0.4,
      maxOutputTokens: 200,
    });

    const setCookie = await buildQuotaCookie({ date: quota.date, count: quota.count + 1 });

    const stream = result.toUIMessageStreamResponse({
      onError: (err) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[chat] streamText: provider=%s error: %s', picked.provider, msg);
        if (/credit balance|too low|insufficient|quota|billing|purchase credits|payment/i.test(msg)) {
          return "This agent isn't free to run — public access is off for now. Reach out through the contact form instead.";
        }
        return 'The agent hit a snag. Try again in a moment.';
      },
    });

    const headers = new Headers(stream.headers);
    if (setCookie) {
      headers.append('Set-Cookie', setCookie);
    }
    
    headers.set('X-Daily-Remaining', String(DAILY_LIMIT - (quota.count + 1)));
    headers.set('X-Provider', picked.provider);
    headers.set('X-System-Prompt-Chars', String(SYSTEM_PROMPT.length));

    console.log('[chat] POST: stream response initialized');
    return new Response(stream.body, { status: stream.status, headers });
  } catch (err) {
    console.error('[chat] POST: unexpected error during stream setup', err);
    return jsonError('The agent hit a snag. Try again in a moment.', 500);
  }
}
