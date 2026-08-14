import { streamText, convertToModelMessages, tool, stepCountIs, type UIMessage, type ModelMessage } from 'ai';
import { z } from 'zod';
import { SYSTEM_PROMPT } from '../../../lib/agentContext';
import { buildMachinaSystemPrompt } from '../../../lib/aileenaSecondBrain';
import { COUNCIL_SYSTEM_PROMPT, formatCouncilLensForPrompt } from '../../../lib/aileenaCouncil';
import { decideAgentMode, skipVisitorQuota, type AgentMode } from '../../../lib/agentMode';
import { isCouncilLens } from '../../../lib/councilCopy';
import { requireOwnerFromRequest } from '../../../lib/owner-gate';
import { searchArticles } from '../../../lib/agentSearch';
import { searchMemories, memoryIndexMeta } from '../../../lib/memorySearch';
import { agentDataTools, datasetSummary } from '../../../lib/data/tools';
import {
  createReactGuardSession,
  wrapToolsWithReactGuard,
  REACT_MAX_STEPS,
} from '../../../lib/reactGuard';
import {
  routeToolsForQuestion,
  applyToolRoute,
  isLatestUpdatesQuestion,
  LATEST_CONTENT_MEMORY_QUERY,
} from '../../../lib/toolRouter';
import {
  routeModel,
  recordModelSuccess,
  recordModelFailure,
  createModelAbortSignal,
  classifyModelError,
  degradeMessage,
  MODEL_TOTAL_BUDGET_MS,
} from '../../../lib/modelRouter';
import { createRequestTrace } from '../../../lib/requestTrace';
import {
  ensureVisitorId,
  buildVisitorCookie,
  loadVisitorSoftMemory,
  mergeVisitorQuestion,
  recordVisitorQuestion,
  visitorSoftMemoryEnabled,
} from '../../../lib/visitorMemory';
import { hasOwnerUnlimitedChat } from '../../../lib/owner-access';
import { parseVoiceAccent } from '../../../lib/voiceAccent';
import {
  buildFrozenSystemPrompt,
  buildSessionTail,
  needsNewRootForLength,
  needsNewRootForProvider,
  needsNewRootForAccent,
  readSessionProviderLock,
  readSessionAccentLock,
  COMPACTION_PING,
  MODEL_SWAP_PING,
  ACCENT_SWAP_PING,
} from '../../../lib/consolePrefix';

export const runtime = 'edge';
export const maxDuration = 30;
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
 * Day key must match the visitor's local calendar day (client sends
 * `X-Quota-Day: YYYY-MM-DD`). UTC-only keys made Asia/Europe visitors look
 * like the counter never reset between local midnight and UTC midnight.
 *
 * If CHAT_QUOTA_SECRET is unset we skip signature verification but still
 * use the counter (so the limit works, just isn't tamper-proof).
 */

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Prefer visitor-local day from header; fall back to UTC; reject absurd skew. */
function resolveQuotaDay(req: Request): string {
  const header = (req.headers.get('x-quota-day') ?? '').trim();
  const utc = utcDay();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(header)) return utc;
  const clientNoon = Date.parse(`${header}T12:00:00.000Z`);
  const utcNoon = Date.parse(`${utc}T12:00:00.000Z`);
  if (!Number.isFinite(clientNoon) || !Number.isFinite(utcNoon)) return utc;
  // All civil timezones sit within ±14h of UTC; allow ~36h slack for clock skew.
  if (Math.abs(clientNoon - utcNoon) > 36 * 60 * 60 * 1000) return utc;
  return header;
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
  const today = resolveQuotaDay(req);
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
      // New local day (or UTC roll) → fresh counter.
      return { date: today, count: 0 };
    }
    return { date: decoded.date, count: Math.max(0, Math.min(decoded.count, 99)) };
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

function jsonError(
  message: string,
  status: number,
  traceId?: string,
  extraHeaders?: Record<string, string>,
  extraBody?: Record<string, unknown>,
): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(traceId ? { 'X-Trace-Id': traceId } : {}),
    ...extraHeaders,
  };
  return new Response(
    JSON.stringify({ error: message, traceId: traceId ?? null, ...extraBody }),
    {
      status,
      headers,
    },
  );
}

function extractTextFromMessage(m: UIMessage): string {
  if (!m.parts?.length) return '';
  return m.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join(' ')
    .trim();
}

function lastUserQuery(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== 'user') continue;
    const t = extractTextFromMessage(messages[i]);
    if (t) return t;
  }
  return '';
}

export async function POST(req: Request) {
  const trace = createRequestTrace(req.headers.get('x-trace-id'));
  trace.log('request_start');

  let body: {
    messages?: UIMessage[];
    priorTopics?: string[];
    agentMode?: 'public' | 'site' | 'machina' | 'council';
    councilLens?: string;
    voiceAccent?: string;
    sessionProvider?: string;
    sessionVoiceAccent?: string;
  };
  try {
    body = await req.json();
  } catch (err) {
    console.error('[chat] POST: failed to parse JSON body', err);
    return jsonError('Invalid JSON.', 400, trace.traceId);
  }

  const messages = body.messages ?? [];
  if (!Array.isArray(messages) || messages.length === 0) {
    console.error('[chat] POST: messages array is empty or missing');
    return jsonError('No messages provided.', 400, trace.traceId);
  }

  // Client localStorage topics (fallback / supplement when Redis is off).
  const priorTopics = Array.isArray(body.priorTopics)
    ? body.priorTopics
        .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
        .slice(0, 5)
    : [];

  const owner = await requireOwnerFromRequest(req);
  const decided = decideAgentMode(body.agentMode, Boolean(owner));
  if (!decided.ok) {
    return jsonError(decided.error, decided.status, trace.traceId, {
      'X-Agent-Mode': 'forbidden',
    });
  }
  const agentMode: AgentMode = decided.mode;
  const isCouncil = agentMode === 'council';
  const skipQuota = skipVisitorQuota(Boolean(owner));
  const councilLens = isCouncil && isCouncilLens(body.councilLens) ? body.councilLens : undefined;
  const voiceAccent = isCouncil ? null : parseVoiceAccent(body.voiceAccent);
  const sessionVoiceAccent = isCouncil
    ? undefined
    : readSessionAccentLock(body.sessionVoiceAccent, req.headers.get('x-session-voice-accent'));
  if (!isCouncil && needsNewRootForAccent(sessionVoiceAccent, voiceAccent)) {
    return jsonError(ACCENT_SWAP_PING, 409, trace.traceId, { 'X-New-Root': 'accent_swap' }, {
      code: 'new_root',
      reason: 'accent_swap',
    });
  }

  // Daily quota — public visitors only. OWNER_KEY session or recognized
  // owner-email cookie skips the 20/day cap. Forged agentMode cannot bypass this.
  const quotaSpan = trace.startSpan('quota');
  const ownerUnlimited = await hasOwnerUnlimitedChat(req);
  const unlimitedChat = skipQuota || ownerUnlimited;
  const quota = await readQuota(req);
  trace.endSpan(quotaSpan, true, {
    count: quota.count,
    date: quota.date,
    skipQuota,
    ownerUnlimited,
  });
  if (!unlimitedChat && quota.count >= DAILY_LIMIT) {
    console.warn('[chat] POST: daily limit reached for user', { count: quota.count, date: quota.date, traceId: trace.traceId });
    // Refresh cookie so Max-Age / date stay aligned with "today" — avoids stale
    // multi-day cookies that look like the counter never reset.
    const exhaustedCookie = await buildQuotaCookie({ date: quota.date, count: quota.count });
    return jsonError(
      `You've used today's ${DAILY_LIMIT} messages. A fresh set lands tomorrow — see you then.`,
      429,
      trace.traceId,
      {
        ...(exhaustedCookie ? { 'Set-Cookie': exhaustedCookie } : {}),
        'X-Daily-Remaining': '0',
        'X-Quota-Day': quota.date,
      },
    );
  }

  const prepSpan = trace.startSpan('prepare');
  if (needsNewRootForLength(messages.length)) {
    trace.endSpan(prepSpan, true, { reason: 'compaction' });
    return jsonError(COMPACTION_PING, 409, trace.traceId, { 'X-New-Root': 'compaction' }, {
      code: 'new_root',
      reason: 'compaction',
    });
  }
  const trimmed = messages;
  let modelMessages: ModelMessage[];
  try {
    modelMessages = await convertToModelMessages(trimmed);
  } catch (err) {
    trace.endSpan(prepSpan, false, { reason: 'invalid_messages' });
    console.error('[chat] POST: invalid messages', err);
    return jsonError('Invalid messages.', 400, trace.traceId);
  }
  const baseSystem =
    isCouncil
      ? COUNCIL_SYSTEM_PROMPT
      : agentMode === 'machina'
        ? buildMachinaSystemPrompt()
        : SYSTEM_PROMPT;

  const lastQ = lastUserQuery(trimmed);
  // Chinese "更新了吗" misses TF-IDF — force English shelf query for prefetch.
  const memoryPrefetch = lastQ
    ? searchMemories(
        isLatestUpdatesQuestion(lastQ) ? LATEST_CONTENT_MEMORY_QUERY : lastQ,
        isLatestUpdatesQuestion(lastQ) ? 4 : 2,
      )
    : [];
  const memMeta = memoryIndexMeta();

  // Per-visitor soft memory: one Redis GET on the hot path; merge locally for
  // this turn's prompt; SET is fire-and-forget so TTFT isn't blocked by write RTT.
  const { id: visitorId, isNew: newVisitorCookie } = await ensureVisitorId(req);
  const visitorSoftLoaded = isCouncil
    ? { questions: [] as string[], topics: [] as string[], updatedAt: '', hitCount: 0 }
    : await loadVisitorSoftMemory(visitorId);
  let visitorSoft = visitorSoftLoaded;
  if (!isCouncil && lastQ && visitorSoftMemoryEnabled()) {
    const merged = mergeVisitorQuestion(visitorSoftLoaded, lastQ);
    if (merged) {
      visitorSoft = merged;
      void recordVisitorQuestion(visitorId, lastQ, visitorSoftLoaded);
    }
  }

  const toolRoute = routeToolsForQuestion(lastQ, visitorSoft, priorTopics);
  const modelDecision = routeModel({
    toolRoute: toolRoute.route,
    lastQuestion: lastQ,
    voiceAccent,
  });
  trace.endSpan(prepSpan, true, {
    toolRoute: toolRoute.route,
    modelMode: modelDecision.mode,
  });

  if (modelDecision.mode === 'degrade') {
    trace.log('degrade', { reason: modelDecision.reason, agentMode });
    const degradeCopy = isCouncil
      ? 'Council is paused on the model side. Try again in a moment.'
      : modelDecision.message;
    return jsonError(degradeCopy, modelDecision.status, trace.traceId, {
      'X-Degrade-Reason': modelDecision.reason,
      'X-Tool-Route': toolRoute.route,
      'X-Agent-Mode': agentMode,
      'X-Daily-Remaining': unlimitedChat
        ? skipQuota
          ? 'owner'
          : 'unlimited'
        : String(Math.max(0, DAILY_LIMIT - quota.count)),
    });
  }

  const picked = modelDecision.pick;
  const sessionProvider = readSessionProviderLock(
    body.sessionProvider,
    req.headers.get('x-session-provider'),
  );
  if (needsNewRootForProvider(sessionProvider, picked.provider)) {
    return jsonError(MODEL_SWAP_PING, 409, trace.traceId, { 'X-New-Root': 'model_swap' }, {
      code: 'new_root',
      reason: 'model_swap',
    });
  }

  console.log('[chat] POST: starting streamText', {
    traceId: trace.traceId,
    provider: picked.provider,
    tier: picked.tier,
    modelReason: modelDecision.reason,
    agentMode,
    voiceAccent: voiceAccent ?? 'off',
    owner: Boolean(owner),
    skipQuota,
    priorTopicsCount: priorTopics.length,
    visitorSoftEnabled: !isCouncil && visitorSoftMemoryEnabled(),
    visitorQuestions: visitorSoft.questions.length,
    newVisitor: newVisitorCookie,
    toolRoute: toolRoute.route,
  });

  // Frozen root: system + tool table. Per-turn RAG / route / visitor notes
  // go on the message tail — never rewritten into the prefix.
  const ds = datasetSummary();
  const memoryIndexLine = `

# Memory index (L2)
${memMeta.chunkCount} chunks indexed at ${memMeta.generatedAt || 'build time'}. Tool: searchMemories.`;
  const publicToolTable = `

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

## Machina second-brain (${memMeta.chunkCount} memory chunks)
- searchMemories(query, k): TF-IDF over aileena_second_brain Markdown — taste, music, culture, memory frameworks, Dreaming, hardware Memory Wall. Use before stating preferences or private curation rules.

# Tool-use rules
- For top-level CV / contact / availability questions, no tool — answer from the static prompt.
- For article content, use searchArticles.
- For taste / music / culture / memory stack, use searchMemories.
- For chip specs / prices / news / earnings / research, use the matching tool above.
- If a tool returns no hits, say so plainly and offer the closest alternative — do not invent data.
- Quote retrieved snippets concisely. Always include the relevant url or date if returned.
- If a tool observation has blocked:true / reason:duplicate_tool — do not retry the same call; answer from prior observations or change query/tool.

# MANDATORY before answering about a named subject
If the visitor names a specific article, project, product, person, company, technology, framework, or proper noun that is NOT defined verbatim in your static context above, you MUST call searchArticles (and/or searchResearch / searchEarnings / queryChip / etc.) FIRST. Do not infer the subject from your training. Specifically:
  - "Centaur" → call searchResearch("Centaur") AND searchArticles("Centaur"). It is the Paradigm + Tempo agent runtime — not a Solana validator and not anything else. Confirm with retrieval before describing it.
  - Any other proper noun the visitor uses, default to: search first, answer second. If retrieval returns nothing, say "I don't have her take on that" — never substitute training data.

# Link formatting
- ALWAYS write links as full URLs starting with "https://" — e.g. https://aileena.xyz/blog/centaur, not aileena.xyz/blog/centaur. The UI auto-linkifies https:// URLs cleanly; bare domains render as plain text and frustrate the reader.`;
  const machinaToolTable = `

# Machina mode tools
- searchMemories(query, k): required for taste, setlist, culture, frameworks, Dreaming, hardware notes.
- searchArticles(query, k): optional when visitor asks about her published writing.`;
  const councilToolTable = `

# Council tools
Same retrieval tools as the site. Use them for evidence (articles, memory, chips, prices). Do not pad answers to look busy. Drafts (emails, scopes, site copy) may run longer than five sentences; decisions stay short: judgment / leverage / next move / do not.`;

  const frozenSystem = buildFrozenSystemPrompt({
    baseSystem,
    agentMode,
    voiceAccent,
    // THIS root only — lock matches pick or we already 409'd. New root may be Qwen.
    rootProvider: sessionProvider ?? picked.provider,
    memoryIndexLine,
    publicToolTable,
    machinaToolTable,
    councilToolTable,
  });
  const memoryPrefetchBlock =
    memoryPrefetch.length > 0
      ? `# Memory prefetch (top hits for this turn — verify with searchMemories if unsure)
${memoryPrefetch
  .map(
    (h) =>
      `- [${h.tier}] ${h.path} § ${h.section}: ${h.snippet.replace(/\n/g, ' ')}`,
  )
  .join('\n')}`
      : '';
  const sessionTail = buildSessionTail({
    agentMode,
    memoryPrefetchBlock,
    toolRoute,
    visitorSoft,
    priorTopics,
    lastQuestion: lastQ,
    councilLensBlock: isCouncil ? formatCouncilLensForPrompt(councilLens) : '',
  });
  const messagesWithTail: ModelMessage[] = sessionTail
    ? [...modelMessages, { role: 'user', content: sessionTail }]
    : modelMessages;

  try {
    const reactGuard = createReactGuardSession();
    const allTools = {
        searchMemories: tool({
          description:
            'Search Aileen Machina second-brain Markdown memories (music taste, culture, memory frameworks, Dreaming, hardware Memory Wall, DJ set curation). Use for preferences and private curation — not for CV or blog articles.',
          inputSchema: z.object({
            query: z.string().min(2).describe('Natural-language query over memory files.'),
            k: z.number().int().min(1).max(5).optional().describe('Top passages. Default 3.'),
          }),
          execute: async ({ query, k }) => {
            return searchMemories(query, k ?? 3).map((h) => ({
              path: h.path,
              tier: h.tier,
              title: h.title,
              section: h.section,
              snippet: h.snippet,
              score: h.score,
            }));
          },
        }),
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
        // research notes. See lib/data/*.ts and the frozen tool table.
        // above for what each one does and when to use it.
        ...agentDataTools,
    };

    // R2: only expose tools allowed for this question type (hire → none, taste → memories…).
    const routedTools = applyToolRoute(allTools, toolRoute);
    const guardedTools = wrapToolsWithReactGuard(routedTools, reactGuard);

    console.log('[chat] tool-route', {
      route: toolRoute.route,
      allowed: toolRoute.allowed,
      preferred: toolRoute.preferred,
      exposed: Object.keys(routedTools),
    });

    const modelSpan = trace.startSpan('model_stream', {
      provider: picked.provider,
      budgetMs: MODEL_TOTAL_BUDGET_MS,
    });
    const abortSignal = createModelAbortSignal(MODEL_TOTAL_BUDGET_MS);

    const result = streamText({
      model: picked.model,
      system: frozenSystem,
      messages: messagesWithTail,
      temperature: 0.4,
      // Cap final ASSISTANT-text response at 200 tokens; tool calls
      // themselves don't count against this. The Helius-style 2-3
      // sentence answer is still the target.
      maxOutputTokens: isCouncil ? 900 : 200,
      // ReAct short loop: think → tool → observe → … then answer.
      // Cap so a confused model can't burn quota looping forever.
      stopWhen: stepCountIs(REACT_MAX_STEPS),
      tools: Object.keys(guardedTools).length > 0 ? guardedTools : undefined,
      abortSignal,
      onFinish: ({ finishReason, steps }) => {
        trace.endSpan(modelSpan, true, {
          finishReason,
          steps: steps?.length ?? 0,
        });
        recordModelSuccess();
        if (finishReason === 'stop' || finishReason === 'length') {
          reactGuard.noteStop('model_finish');
        }
        if ((steps?.length ?? 0) >= REACT_MAX_STEPS) {
          reactGuard.noteStop('max_steps');
        }
        const audit = reactGuard.summary();
        console.log('[chat] react-audit', {
          traceId: trace.traceId,
          finishReason,
          steps: steps?.length ?? 0,
          route: toolRoute.route,
          stopReason: audit.stopReasonPrimary,
          toolCalls: audit.calls.length,
          duplicateBlocks: audit.duplicateBlocks,
          emptyRecalls: audit.emptyRecalls,
          toolErrors: audit.toolErrors,
          tools: audit.calls.map((c) => ({
            step: c.step,
            tool: c.tool,
            blocked: c.blocked,
            empty: c.empty,
            obsChars: c.obsChars,
          })),
          traceSummary: trace.summary(),
        });
      },
    });

    // Owner unlimited (session or email cookie): do not burn the visitor counter.
    const setCookie = unlimitedChat
      ? null
      : await buildQuotaCookie({ date: quota.date, count: quota.count + 1 });
    // Always refresh visitor cookie Max-Age so browser id tracks the 90d Redis TTL.
    const visitorCookie = await buildVisitorCookie(visitorId);

    const stream = result.toUIMessageStreamResponse({
      onError: (err) => {
        const msg = err instanceof Error ? err.message : String(err);
        const classified = classifyModelError(err);
        recordModelFailure(err);
        trace.endSpan(modelSpan, false, { error: msg.slice(0, 160), reason: classified.reason });
        console.error('[chat] streamText: provider=%s error: %s', picked.provider, msg, {
          traceId: trace.traceId,
        });
        return degradeMessage(classified.reason, lastQ);
      },
    });

    const headers = new Headers(stream.headers);
    if (setCookie) {
      headers.append('Set-Cookie', setCookie);
    }
    if (visitorCookie) {
      headers.append('Set-Cookie', visitorCookie);
    }

    headers.set(
      'X-Daily-Remaining',
      unlimitedChat
        ? skipQuota
          ? 'owner'
          : 'unlimited'
        : String(DAILY_LIMIT - (quota.count + 1)),
    );
    if (unlimitedChat) {
      headers.set('X-Owner-Unlimited', '1');
    }
    headers.set('X-Quota-Day', quota.date);
    headers.set('X-Provider', picked.provider);
    headers.set('X-Model-Tier', picked.tier);
    headers.set('X-System-Prompt-Chars', String(frozenSystem.length));
    headers.set('X-Frozen-Prefix', '1');
    headers.set('X-Session-Tail-Chars', String(sessionTail.length));
    headers.set('X-Agent-Mode', agentMode);
    headers.set('X-Voice-Accent', voiceAccent ?? 'off');
    headers.set('X-Visitor-Soft-Memory', visitorSoftMemoryEnabled() ? 'redis' : 'off');
    headers.set('X-React-Max-Steps', String(REACT_MAX_STEPS));
    headers.set('X-Tool-Route', toolRoute.route);
    headers.set('X-Trace-Id', trace.traceId);
    headers.set('X-Model-Budget-Ms', String(MODEL_TOTAL_BUDGET_MS));

    console.log('[chat] POST: stream response initialized', { traceId: trace.traceId });
    return new Response(stream.body, { status: stream.status, headers });
  } catch (err) {
    recordModelFailure(err);
    const classified = classifyModelError(err);
    console.error('[chat] POST: unexpected error during stream setup', err, {
      traceId: trace.traceId,
    });
    return jsonError(degradeMessage(classified.reason, lastQ), classified.reason === 'billing' ? 402 : 500, trace.traceId, {
      'X-Degrade-Reason': classified.reason,
      'X-Tool-Route': toolRoute.route,
    });
  }
}
