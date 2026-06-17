import { streamText, convertToModelMessages, tool, stepCountIs, type UIMessage, type LanguageModel } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';
import { SYSTEM_PROMPT } from '../../../lib/agentContext';
import { searchArticles } from '../../../lib/agentSearch';
import { agentDataTools, datasetSummary } from '../../../lib/data/tools';

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
  const ds = datasetSummary();
  const augmentedSystem =
    SYSTEM_PROMPT +
    `

# Agent tools

You have several tools. Choose the narrowest one for the question. Each turn you can call multiple tools (up to 4 steps total), then answer in 2-3 sentences. NEVER state a number you didn't see in a tool result or in the static prompt above.

## Articles (Aileen's own writing — ~800 chunks)
- searchArticles(query, k): TF-IDF over /blog/** full text. Use for "what does her PCB article say?", "her take on Solana validator clients", anything she has explicitly written about.

## Chip / accelerator / memory specs (${ds.skus.count} SKUs)
- queryChip(name): single SKU best-match (H100, MI300X, GB200, Rubin, etc.)
- listChips({ vendor?, category?, family?, limit? }): filter the catalogue
- compareChips(skuA, skuB): side-by-side

## Pricing time series (${ds.pricing.count} observations)
- latestPrice(sku, unit?): most recent observation. Unit ∈ per_chip|per_card|per_server|per_hour_cloud|per_month_cloud
- priceHistory(sku, from?, to?, unit?): chronological history

## News / tracking (${ds.news.count} items)
- latestNews({ vendor?, sinceDate?, limit? }): recent dated tracker entries
- searchNews(query, k): TF-IDF free-text search

## Documents (${ds.docs.totalChunks} chunks across ${ds.docs.earningsChunks} earnings + ${ds.docs.researchChunks} research)
- searchEarnings(query, k): keyword search over earnings-call transcripts Aileen tracks
- searchResearch(query, k): keyword search over broker / analyst notes
- searchDocs(query, k): both corpora together

# Tool-use rules
- For top-level CV / contact / availability questions, no tool — answer from the static prompt.
- For article content, use searchArticles.
- For chip specs / prices / news / earnings / research, use the matching tool above.
- If a tool returns no hits, say so plainly and offer the closest alternative — do not invent data.
- Quote retrieved snippets concisely. Always include the relevant url or date if returned.` +
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
      // Multi-step agentic loop: model can chain a couple of tool calls
      // (e.g. queryChip("H100") → priceHistory("H100")) before answering.
      // Cap at 4 so a confused model can't burn quota looping forever.
      stopWhen: stepCountIs(4),
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
        // Aileen's tracked-data tools: chip specs, pricing, news, earnings,
        // research notes. See lib/data/*.ts and the augmented system prompt
        // above for what each one does and when to use it.
        ...agentDataTools,
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
