import { streamText, convertToModelMessages, tool, stepCountIs, type UIMessage, type LanguageModel } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';
import { SYSTEM_PROMPT } from '../../../lib/agentContext';
import { searchArticles } from '../../../lib/agentSearch';

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

  let body: { messages?: UIMessage[]; priorTopics?: string[] };
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

  // Cross-session topic memory — what this visitor cared about on previous
  // visits, sent fresh from the client's localStorage. Soft signal only:
  // the model is told to use it as background, not to repeat it back.
  const priorTopics = Array.isArray(body.priorTopics)
    ? body.priorTopics
        .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
        .slice(0, 5)
    : [];

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

  console.log('[chat] POST: starting streamText', {
    provider: picked.provider,
    priorTopicsCount: priorTopics.length,
  });

  // Augment SYSTEM_PROMPT with the agentic-loop instructions + visitor
  // memory. Kept here (not in agentContext.ts) so the static CV / hard
  // rules stay one source of truth and the dynamic per-request blocks
  // are visible right next to the streamText call.
  const augmentedSystem =
    SYSTEM_PROMPT +
    `

# Agent tools
You have one tool: searchArticles(query). It runs a TF-IDF keyword search over the FULL TEXT of every dispatch + perspective article on this site (~800 indexed chunks). Use it WHENEVER the visitor asks about article content — what an article actually argues, a number it cites, a passage, a concept inside it — not just whether an article exists. Do not use it for top-level questions about Aileen's experience or contact (those are in your static context above). After a tool call you receive snippets back; quote or paraphrase them inline, then optionally point to the article URL. Multiple tool calls per turn are allowed; stop calling once you have enough to answer in 2-3 sentences.` +
    (priorTopics.length > 0
      ? `

# Prior visits
This visitor has previously asked about: ${priorTopics
          .map((t) => `"${t.replace(/"/g, "'")}"`)
          .join('; ')}. Treat this as soft background context — what they probably care about. Do not reference it directly unless they explicitly ask "what did I ask before?".`
      : '');

  try {
    const result = streamText({
      model: picked.model,
      system: augmentedSystem,
      messages: modelMessages,
      temperature: 0.4,
      // Cap final ASSISTANT-text response at 200 tokens; tool calls
      // themselves don't count against this. The Helius-style 2-3
      // sentence answer is still the target.
      maxOutputTokens: 200,
      // Multi-step agentic loop: model can call searchArticles → read
      // results → call again → answer. Capped at 3 steps so a bad
      // query doesn't burn quota looping forever.
      stopWhen: stepCountIs(3),
      tools: {
        searchArticles: tool({
          description:
            'Keyword-search the full body text of every Research Dispatch and Woman-in-Tech article on aileena.xyz. Use when the visitor asks about article content — claims, numbers, specific passages, concepts inside an article. Returns up to k passages with their slug, section, snippet and a score. Do NOT call for greetings, contact info, or top-level CV questions.',
          inputSchema: z.object({
            query: z
              .string()
              .min(2)
              .describe(
                'Natural-language search query. Will be tokenised and scored against article chunks.',
              ),
            k: z
              .number()
              .int()
              .min(1)
              .max(5)
              .optional()
              .describe('Number of top passages to return. Defaults to 3.'),
          }),
          execute: async ({ query, k }) => {
            const hits = searchArticles(query, k ?? 3);
            return hits.map((h) => ({
              slug: h.slug,
              title: h.title,
              section: h.section,
              snippet: h.snippet,
              url: `https://aileena.xyz/blog/${h.slug}`,
            }));
          },
        }),
      },
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
