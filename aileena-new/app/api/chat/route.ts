import { streamText, convertToModelMessages, tool, stepCountIs, type UIMessage, type ModelMessage } from 'ai';
import { z } from 'zod';
import { SYSTEM_PROMPT } from '../../../lib/agentContext';
import { buildMachinaSystemPrompt } from '../../../lib/aileenaSecondBrain';
import { COUNCIL_SYSTEM_PROMPT, formatCouncilLensForPrompt } from '../../../lib/aileenaCouncil';
import { decideAgentMode, skipVisitorQuota, type AgentMode } from '../../../lib/agentMode';
import { isCouncilLens } from '../../../lib/councilCopy';
import { requireOwnerFromRequest } from '../../../lib/owner-gate';
import { isAgentCaller } from '../../../lib/agentCaller';
import { tryBrowserUseFastPath } from '../../../lib/browserUse/chatFastPath';
import { publicPrepareBrowseResult } from '../../../lib/browserUse/status';
import { tryOwnerComputerFastPath, tryVisitorComputerFastPath } from '../../../lib/computer/chatFastPath';
import { queuedChatResponse } from '../../../lib/computer/queuedStream';
import { answerSiteLane } from '../../../lib/siteLanes';
import { computerActorFromRequest, computerActorSetCookie } from '../../../lib/computer/actor';
import { isComputerPrototypeEnabled } from '../../../lib/computer/flag';
import { callMcpApp, listMcpApps } from '../../../lib/mcp/catalog';
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
  buildFallback,
  buildGpu,
  buildPrimary,
  isModelMissingError,
  noteDeepSeekModelMissing,
  type ModelPick,
  cacheTokensFromSteps,
  createModelAbortSignal,
  classifyModelError,
  degradeMessage,
  MODEL_TOTAL_BUDGET_MS,
} from '../../../lib/modelRouter';
import { breakerFailure, breakerGate, breakerSuccess, isCancellation } from '../../../lib/agentRuntime/breaker';
import { readGpuConfig, markGpuWarm, markGpuCold } from '../../../lib/agentRuntime/gpu';
import { chooseProvider, estimateTokens, peekFirstToken } from '../../../lib/agentRuntime/router';
import { addSpend, estimateTurnMicroUsd, noteTtft, noteTurnDone, noteTurnStart, recordRouterTurn } from '../../../lib/agentRuntime/load';
import { commitTurn, findCommittedTurn, readLedger, rebuildTranscript, validLedgerId } from '../../../lib/agentRuntime/ledger';
import { chargeRedisQuota, quotaKeyFor, readRedisQuota, redisQuotaEnabled } from '../../../lib/agentRuntime/quota';
import { createSummaryToken, summaryTailBlock, verifySummaryToken } from '../../../lib/agentRuntime/summaryToken';
import { neutralizeVisitorText } from '../../../lib/agentGuard/inputGuard';
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
import {
  CHAT_DAILY_LIMIT,
  QUOTA_EXHAUSTED_MSG,
  readQuota,
  buildQuotaCookie,
  takeVisitorChatTurn,
} from '../../../lib/chatQuota';
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
import { formatSkillsForTurn } from '../../../lib/evolution/runtime';
import { enqueueLiveAsk } from '../../../lib/evolution/liveInbox';
import { TurnGuard } from '../../../lib/agentGuard/turnGuard';
import { prefixHash } from '../../../lib/agentGuard/prefixHash';

export const maxDuration = 30;
const DAILY_LIMIT = CHAT_DAILY_LIMIT;

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
    /** Frozen-root id for the server turn ledger. */
    sessionId?: string;
    /** Per visitor turn; a retry with the same id is replayed, not re-run. */
    turnId?: string;
    /** Signed summary from a 409 compaction; seeds this new root. */
    summaryToken?: string;
    /** Owner-only model tier preference ('gpu' | 'deepseek'). Ignored for visitors. */
    modelTier?: string;
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

  // Agent callers (/api/mcp) are public visitors: no owner, no council, no side effects.
  const agentCaller = isAgentCaller(req);
  const owner = agentCaller ? null : await requireOwnerFromRequest(req);
  const decidedRaw = decideAgentMode(body.agentMode, Boolean(owner));
  const decided =
    agentCaller && decidedRaw.ok ? { ok: true as const, mode: 'public' as AgentMode } : decidedRaw;
  if (!decided.ok) {
    return jsonError(decided.error, decided.status, trace.traceId, {
      'X-Agent-Mode': 'forbidden',
    });
  }

  // Owner computer / visitor scratch skip the model when the line is a command.
  const lastQEarly = lastUserQuery(messages);
  const computerActor = await computerActorFromRequest(req);
  const withComputerCookie = (res: Response): Response => {
    const header = computerActorSetCookie(computerActor);
    if (header) res.headers.append('Set-Cookie', header);
    return res;
  };
  const browse = tryBrowserUseFastPath({ lastQ: lastQEarly });
  if (browse && !agentCaller) {
    const ownerUnlimitedBrowse = await hasOwnerUnlimitedChat(req);
    const unlimitedBrowse = skipVisitorQuota(Boolean(owner)) || ownerUnlimitedBrowse;
    const turn = await takeVisitorChatTurn(req, unlimitedBrowse);
    if (!turn.ok) {
      const exhausted = await buildQuotaCookie(turn.quota);
      return jsonError(QUOTA_EXHAUSTED_MSG, 429, trace.traceId, {
        ...(exhausted ? { 'Set-Cookie': exhausted } : {}),
        'X-Daily-Remaining': '0',
        'X-Quota-Day': turn.quota.date,
      });
    }
    if (turn.cookie) browse.headers.append('Set-Cookie', turn.cookie);
    browse.headers.set('X-Daily-Remaining', turn.remaining);
    browse.headers.set('X-Quota-Day', turn.quota.date);
    trace.log('browser_use_fast_path', { q: lastQEarly.slice(0, 80) });
    return withComputerCookie(browse);
  }
  if (agentCaller) {
    // no computer desk for agent callers
  } else if (computerActor.kind === 'owner') {
    const fast = await tryOwnerComputerFastPath({
      req,
      isOwner: true,
      lastQ: lastQEarly,
    });
    if (fast) {
      trace.log('computer_fast_path', { q: lastQEarly.slice(0, 80) });
      return withComputerCookie(fast);
    }
  } else {
    const fast = await tryVisitorComputerFastPath({
      req,
      actor: computerActor,
      lastQ: lastQEarly,
    });
    if (fast) {
      trace.log('computer_fast_path', { q: lastQEarly.slice(0, 80), actor: 'visitor' });
      return withComputerCookie(fast);
    }
  }
  const laneText = await answerSiteLane(lastQEarly, computerActor.id, { allowSideEffects: !agentCaller });
  if (laneText) {
    trace.log('site_lane', { q: lastQEarly.slice(0, 80) });
    return withComputerCookie(queuedChatResponse(laneText));
  }
  const agentMode: AgentMode = decided.mode;
  const isCouncil = agentMode === 'council';
  // Debug headers (prompt sizes, budgets, tiers) are for the owner only.
  const showDebugHeaders = Boolean(owner);
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

  // P1.3 turn ledger: a retry of a committed turn is replayed (no model, no charge).
  // The ledger is bound to this visitor cookie and mode, so a leaked sessionId
  // alone never opens someone else's thread.
  const { id: visitorId, isNew: newVisitorCookie } = await ensureVisitorId(req);
  const ledgerSessionId =
    !isCouncil && validLedgerId(body.sessionId) ? `${agentMode}:${visitorId}:${body.sessionId}` : null;
  const ledgerTurnId = ledgerSessionId && validLedgerId(body.turnId) ? body.turnId : null;
  if (ledgerSessionId && ledgerTurnId) {
    const done = await findCommittedTurn(ledgerSessionId, ledgerTurnId);
    if (done) {
      trace.log('turn', { stopReason: 'replay', committed: true, route: 'replay', turnId: ledgerTurnId });
      return queuedChatResponse(done.assistant, { 'X-Turn-Replay': '1', 'X-Trace-Id': trace.traceId, 'X-Agent-Mode': agentMode });
    }
  }

  // Daily quota — public visitors only. OWNER_KEY session or recognized
  // owner-email cookie skips the 20/day cap. Forged agentMode cannot bypass this.
  // The cap is CHAT_DAILY_LIMIT (20/day, unchanged). With Redis, the counter is
  // keyed by a salted daily hash of visitor id + IP and charged only when the
  // turn commits; without Redis the signed cookie works exactly as before.
  const quotaSpan = trace.startSpan('quota');
  const ownerUnlimited = await hasOwnerUnlimitedChat(req);
  const unlimitedChat = skipQuota || ownerUnlimited;
  const cookieQuota = await readQuota(req);
  const redisQuotaKey = !unlimitedChat && redisQuotaEnabled() ? await quotaKeyFor(req, visitorId, cookieQuota.date) : null;
  const redisCount = redisQuotaKey ? await readRedisQuota(redisQuotaKey) : 0;
  const quota = { date: cookieQuota.date, count: Math.max(cookieQuota.count, redisCount) };
  trace.endSpan(quotaSpan, true, {
    count: quota.count,
    date: quota.date,
    skipQuota,
    ownerUnlimited,
    store: redisQuotaKey ? 'redis' : 'cookie',
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
    // P2.9: hand the client a signed summary to seed the next root.
    const summaryToken = await createSummaryToken(messages);
    return jsonError(COMPACTION_PING, 409, trace.traceId, { 'X-New-Root': 'compaction' }, {
      code: 'new_root',
      reason: 'compaction',
      summaryToken,
    });
  }
  const seededSummary = !isCouncil ? await verifySummaryToken(body.summaryToken) : null;
  const ledgerTurns = ledgerSessionId ? await readLedger(ledgerSessionId) : [];
  const rebuilt = rebuildTranscript(messages, ledgerTurns);
  // One TurnGuard owns all guard state for this request: (a) input guard,
  // (b) output guard, (c) number grounding, (d) locale. Council is owner-only
  // and keeps its own layout; secrets are still redacted there.
  const guard = new TurnGuard({
    mode: agentMode,
    isOwner: Boolean(owner),
    lastQuestion: lastQEarly,
  });
  const trimmed = guard.guardTranscript(rebuilt.messages);
  if (trimmed.length === 0) {
    return jsonError('No messages provided.', 400, trace.traceId);
  }
  if (guard.inputGuardHits > 0 || guard.droppedClientParts > 0 || rebuilt.source === 'ledger') {
    trace.log('input_guard', {
      hits: guard.inputGuardHits,
      droppedClientParts: guard.droppedClientParts,
      mode: agentMode,
      transcript: rebuilt.source,
      ledgerTurns: ledgerTurns.length,
      replacedAssistant: rebuilt.replacedAssistant,
    });
  }
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
        ? buildMachinaSystemPrompt({ visitor: !owner })
        : SYSTEM_PROMPT;

  const lastQ = lastUserQuery(trimmed);
  // Chinese "更新了吗" misses TF-IDF — force English shelf query for prefetch.
  const memoryPrefetch = lastQ
    ? searchMemories(
        isLatestUpdatesQuestion(lastQ) ? LATEST_CONTENT_MEMORY_QUERY : lastQ,
        isLatestUpdatesQuestion(lastQ) ? 4 : 2,
        { publicOnly: !owner },
      )
    : [];
  const memMeta = memoryIndexMeta();

  // Per-visitor soft memory: one Redis GET on the hot path; merge locally for
  // this turn's prompt; SET is fire-and-forget so TTFT isn't blocked by write RTT.
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
  // Uncovered public asks → Redis live inbox. Drain ratchets held-out only.
  // Council never enqueues. Does not write AGENTS.md / QA.md / PROJECT_RULES.md.
  if (lastQ && !agentCaller) {
    void enqueueLiveAsk(lastQ, { isCouncil, traceId: trace.traceId, visitorKey: redisQuotaKey ?? visitorId });
  }

  const toolRoute = routeToolsForQuestion(lastQ, visitorSoft, priorTopics);
  const modelDecision = routeModel({
    toolRoute: toolRoute.route,
    lastQuestion: lastQ,
    voiceAccent,
    // The Redis per-provider breaker below gates /api/chat; the legacy
    // in-isolate circuit belongs to the side surfaces (voice-code, scratch).
    ignoreLegacyCircuit: true,
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

  // Model tier: P1.6 per-provider breaker (Redis, one half-open probe) + the
  // state-based GPU tier (lib/agentRuntime/router.ts). With AGENT_GPU_MODE unset
  // this is exactly today's chain: primary → fallback (provider lock answers
  // 409 and the client starts a new root) → 503.
  const sessionProvider = readSessionProviderLock(
    body.sessionProvider,
    req.headers.get('x-session-provider'),
  );
  const gpuCfg = readGpuConfig();
  const gpuPick = buildGpu(gpuCfg);
  const fallbackPick = buildFallback();
  const routed = await chooseProvider({
    primary: modelDecision.pick,
    gpu: gpuPick,
    fallback: fallbackPick,
    cfg: gpuCfg,
    sessionProvider,
    isOwner: Boolean(owner),
    // Owner-only. Visitors and agent callers cannot pick a tier.
    requestedTier: owner && (body.modelTier === 'gpu' || body.modelTier === 'deepseek') ? body.modelTier : undefined,
    estTokens: estimateTokens(baseSystem.length + JSON.stringify(trimmed).length + 6_000),
    toolRoute: toolRoute.route,
    rootKey: body.sessionId || visitorId,
    shanghaiVoice: voiceAccent === 'shanghai',
  });
  if (!routed.ok) {
    trace.log('breaker', { provider: modelDecision.pick.provider, state: routed.blocked, fallback: 'none' });
    return jsonError(degradeMessage('circuit_open', lastQ), 503, trace.traceId, {
      'X-Degrade-Reason': 'circuit_open',
      'X-Tool-Route': toolRoute.route,
      'X-Agent-Mode': agentMode,
    });
  }
  if (routed.blocked) {
    trace.log('breaker', { provider: modelDecision.pick.provider, state: routed.blocked, fallback: routed.pick.provider });
  }
  let picked = routed.pick;
  let probe = routed.probe;
  let routeRule: string = routed.rule;
  trace.log('route', { rule: routed.rule, provider: picked.provider, gpuState: routed.gpuState, wake: routed.wakeSent });
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
- searchArticles(query, k): optional when visitor asks about her published writing.
- browseWeb({ task? }): anyone. Browser Use Cloud API v4. Dry-run — no paid browser. Cloudflare computer is not the browser.${
    owner && isComputerPrototypeEnabled()
      ? `
- listMcpApps(): owner. browser-use first (Cloud API v4, dry-run), then computer (worker-shell), github (token), remote MCP_SERVERS.
- callMcp({ app, tool, args }): owner. browser-use.status|prepare (never run). computer.exec / computer.read / github.me|repo|pulls|issues|contents / remote tools. Not merge. Not a laptop OS.`
      : ''
  }`;
  const councilToolTable = `

# Council tools
Same retrieval tools as the site. Use them for evidence (articles, memory, chips, prices). Do not pad answers to look busy. Drafts (emails, scopes, site copy) may run longer than five sentences; decisions stay short: judgment / leverage / next move / do not.`;

  // Frozen root per provider: the identity line names THIS root's provider, so
  // a pre-first-token GPU failover rebuilds it for the provider that answers.
  const frozenFor = (pick: ModelPick) =>
    buildFrozenSystemPrompt({
      baseSystem,
      agentMode,
      voiceAccent,
      // THIS root only — lock matches pick or we already 409'd. New root may be Qwen.
      rootProvider: sessionProvider ?? pick.provider,
      memoryIndexLine,
      publicToolTable,
      machinaToolTable,
      councilToolTable,
    });
  let frozenSystem = frozenFor(picked);
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
  const sessionTailCore = buildSessionTail({
    agentMode,
    memoryPrefetchBlock,
    toolRoute,
    visitorSoft,
    priorTopics,
    lastQuestion: lastQ,
    councilLensBlock: isCouncil ? formatCouncilLensForPrompt(councilLens) : '',
    skillBlock: isCouncil ? '' : formatSkillsForTurn(lastQ),
    languageNote: isCouncil ? '' : guard.languageNote(),
  });
  // P2.9: a verified compaction summary seeds this root (visitor text, neutralized).
  const summaryBlock = seededSummary
    ? summaryTailBlock({ ...seededSummary, questions: seededSummary.questions.map((q) => neutralizeVisitorText(q).text) })
    : '';
  const sessionTail = [summaryBlock, sessionTailCore].filter(Boolean).join('\n\n');
  guard.setSystem(frozenSystem);
  // The genuine tail is wrapped in this request's nonce; visitor copies of the
  // marker were neutralized above, so only the server can open this block.
  const wrappedTail = sessionTail ? guard.wrapTail(sessionTail) : '';
  const messagesWithTail: ModelMessage[] = wrappedTail
    ? [...modelMessages, { role: 'user', content: wrappedTail }]
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
            return searchMemories(query, k ?? 3, { publicOnly: !owner }).map((h) => ({
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

    // R2: the tool table stays the same every turn (prefix cache). Tools this
    // route doesn't allow are wrapped to return {blocked, reason:'wrong_route'};
    // route 'none' (hire / CV) also sets toolChoice 'none' below.
    const routedTools = applyToolRoute(allTools, toolRoute);
    const withBrowse = {
      ...routedTools,
      browseWeb: tool({
        description:
          'Anyone. Browser Use Cloud API v4 status or dry-run prepare. Does not start a paid browser. Cloudflare computer is not the browser path.',
        inputSchema: z.object({
          task: z.string().min(2).max(4000).optional().describe('Browse goal. Omit for wiring status only.'),
        }),
        execute: async ({ task }) => publicPrepareBrowseResult(task),
      }),
    };
    const withMcp =
      owner && isComputerPrototypeEnabled()
        ? {
            ...withBrowse,
            listMcpApps: tool({
              description:
                'Owner. List Machina MCP apps: browser-use (Cloud API v4, dry-run) first, then computer (worker-shell), github (if token), remote MCP_SERVERS. Does not merge. Does not start Linux.',
              inputSchema: z.object({}),
              execute: async () => listMcpApps(),
            }),
            callMcp: tool({
              description:
                'Owner. Call one MCP tool. app=browser-use|computer|github|<remote name>. browser-use: status|prepare (never run). computer: exec|read. github: me|repo|pulls|issues|contents. Public https remotes only.',
              inputSchema: z.object({
                app: z.string().min(1).max(40),
                tool: z.string().min(1).max(80),
                args: z.record(z.any()).optional(),
              }),
              execute: async ({ app, tool: mcpTool, args }) =>
                callMcpApp(app, mcpTool, args ?? {}, computerActor.id),
            }),
          }
        : withBrowse;
    const guardedTools = wrapToolsWithReactGuard(withMcp, reactGuard);

    console.log('[chat] tool-route', {
      traceId: trace.traceId,
      route: toolRoute.route,
      allowed: toolRoute.allowed,
      preferred: toolRoute.preferred,
      exposed: Object.keys(withMcp),
    });

    let turnPrefixHash = await prefixHash(frozenSystem, withMcp);
    trace.log('prefix', { prefixHash: turnPrefixHash, route: toolRoute.route, tools: Object.keys(withMcp).length });
    // P1.4: real cancel. The visitor closing the tab aborts the model and the
    // tools (they get this signal via their execute options); the budget still
    // caps the turn (shared across a GPU attempt and its failover).
    const budgetSignal = createModelAbortSignal(MODEL_TOTAL_BUDGET_MS);
    const gpuLoadNotes = gpuCfg?.mode === 'public';

    // One model attempt. A GPU attempt that fails before its first token is
    // abandoned (callbacks go quiet) and the turn restarts on DeepSeek.
    const startAttempt = (pick: ModelPick, attemptProbe: boolean, system: string, attemptPrefixHash: string) => {
      const attemptCtl = new AbortController();
      const abortSignal =
        typeof AbortSignal.any === 'function' && req.signal ? AbortSignal.any([req.signal, budgetSignal, attemptCtl.signal]) : budgetSignal;
      let abandoned = false;
      const startedAt = Date.now();
      let firstChunkAt = 0;
      if (gpuLoadNotes) void noteTurnStart(pick.provider).catch(() => {});
      const modelSpan = trace.startSpan('model_stream', {
        provider: pick.provider,
        budgetMs: MODEL_TOTAL_BUDGET_MS,
      });
      let turnSettled = false;
      const turnEvent = (extra: Record<string, unknown>) => {
        if (turnSettled || abandoned) return;
        turnSettled = true;
        const audit = reactGuard.summary();
        if (gpuLoadNotes) void noteTurnDone(pick.provider).catch(() => {});
        void recordRouterTurn({ provider: pick.provider, rule: routeRule, committed: extra.committed === true }).catch(() => {});
        trace.log('turn', {
          prefixHash: attemptPrefixHash,
          route: toolRoute.route,
          mode: agentMode,
          provider: pick.provider,
          model: pick.modelId,
          rule: routeRule,
          gpuState: routed.gpuState,
          failoverFrom,
          ttftMs: firstChunkAt ? firstChunkAt - startedAt : null,
          probe: attemptProbe,
          tools: audit.calls.map((c) => c.tool),
          blockedTools: audit.calls.filter((c) => c.blocked).length,
          transcript: rebuilt.source,
          quotaStore: redisQuotaKey ? 'redis' : unlimitedChat ? 'unlimited' : 'cookie',
          ...extra,
        });
      };

      const result = streamText({
        model: pick.model,
        system,
        messages: messagesWithTail,
        temperature: 0.4,
        // GPU: no SDK retries; a failed first token fails over instead.
        ...(pick.tier === 'gpu' ? { maxRetries: 0 } : {}),
        // Cap final ASSISTANT-text response at 200 tokens; tool calls
        // themselves don't count against this. The Helius-style 2-3
        // sentence answer is still the target.
        maxOutputTokens: isCouncil ? 900 : 200,
        // ReAct short loop: think → tool → observe → … then answer.
        // Cap so a confused model can't burn quota looping forever.
        stopWhen: stepCountIs(REACT_MAX_STEPS),
        tools: Object.keys(guardedTools).length > 0 ? guardedTools : undefined,
        // Hire / CV route: same tool table (prefix cache holds), but no calls.
        toolChoice: toolRoute.allowed === 'none' ? 'none' : 'auto',
        // P1.5: the last step must answer, not call another tool.
        prepareStep: ({ stepNumber }) => (stepNumber >= REACT_MAX_STEPS - 1 ? { toolChoice: 'none' as const } : {}),
        abortSignal,
        onChunk: () => {
          if (firstChunkAt) return;
          firstChunkAt = Date.now();
          if (gpuLoadNotes && gpuCfg) void noteTtft(pick.provider, firstChunkAt - startedAt, gpuCfg.spillTtftMs).catch(() => {});
        },
        onAbort: ({ steps }) => {
          if (abandoned) return;
          // P1.4: cancelled turns are not committed, not charged and not breaker failures.
          trace.endSpan(modelSpan, false, { reason: 'cancelled', steps: steps?.length ?? 0 });
          reactGuard.markCancelled();
          if (attemptProbe) void breakerSuccess(pick.provider).catch(() => {});
          turnEvent({ stopReason: 'cancelled', finishReason: 'abort', committed: false, steps: steps?.length ?? 0 });
        },
        // (b)(c) Output guard + number grounding, sentence-buffered on the stream.
        experimental_transform: guard.transform(),
        onFinish: async ({ finishReason, steps, text, totalUsage }) => {
          if (abandoned) return;
          trace.endSpan(modelSpan, true, {
            finishReason,
            steps: steps?.length ?? 0,
          });
          void breakerSuccess(pick.provider).catch(() => {});
          if (pick.tier === 'gpu') void markGpuWarm().catch(() => {});
          // P1.3: commit + charge only when the model actually finished.
          const committed = finishReason === 'stop' || finishReason === 'length';
          if (committed) {
            try {
              if (redisQuotaKey) await chargeRedisQuota(redisQuotaKey);
              if (ledgerSessionId) {
                await commitTurn(ledgerSessionId, {
                  turnId: ledgerTurnId ?? `${trace.traceId}`,
                  user: lastQ,
                  assistant: text ?? '',
                  finishReason,
                  at: Date.now(),
                });
              }
            } catch (err) {
              console.error('[chat] commit failed', err instanceof Error ? err.message : String(err), { traceId: trace.traceId });
            }
          }
          const cache = cacheTokensFromSteps(steps as unknown as Parameters<typeof cacheTokensFromSteps>[0]);
          if (pick.provider === 'deepseek') {
            const inTok = totalUsage?.inputTokens ?? 0;
            const hit = cache?.promptCacheHitTokens ?? 0;
            const miss = cache ? cache.promptCacheMissTokens : Math.max(0, inTok - hit);
            void addSpend(pick.provider, estimateTurnMicroUsd({ hit, miss, out: totalUsage?.outputTokens ?? 0 })).catch(() => {});
          }
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
            guard: guard.summary(),
          });
          trace.log('guard', guard.summary());
          turnEvent({
            stopReason: audit.stopReasonPrimary,
            finishReason,
            committed,
            steps: steps?.length ?? 0,
            promptCacheHitTokens: cache?.promptCacheHitTokens ?? null,
            promptCacheMissTokens: cache?.promptCacheMissTokens ?? null,
          });
        },
      });
      const abandon = () => {
        abandoned = true;
        trace.endSpan(modelSpan, false, { reason: 'gpu_failover' });
        attemptCtl.abort(new Error('gpu_failover'));
      };
      return { result, modelSpan, turnEvent, abandon };
    };

    let failoverFrom: string | null = null;
    let att = startAttempt(picked, probe, frozenSystem, turnPrefixHash);

    // GPU tier: switch providers only before the first token. A GPU that
    // errors or stays silent past AGENT_GPU_TTFT_MS is a breaker failure and
    // the turn restarts on DeepSeek (or the fallback); the visitor never waits
    // on a cold GPU because the router only picks a WARM one.
    if (picked.tier === 'gpu' && gpuCfg) {
      const first = await peekFirstToken(att.result.fullStream, gpuCfg.ttftMs);
      if (!first.ok && !req.signal?.aborted) {
        const failedProvider = picked.provider;
        att.abandon();
        void breakerFailure(failedProvider).catch(() => {});
        void markGpuCold().catch(() => {});
        trace.log('gpu_failover', { provider: failedProvider, reason: first.reason });
        const primaryPick = buildPrimary();
        const primaryGate = primaryPick ? await breakerGate(primaryPick.provider) : null;
        const fbGate = !primaryGate?.allowed && fallbackPick ? await breakerGate(fallbackPick.provider) : null;
        const next = primaryPick && primaryGate?.allowed ? { pick: primaryPick, probe: primaryGate.probe } : fallbackPick && fbGate?.allowed ? { pick: fallbackPick, probe: fbGate.probe } : null;
        if (!next) {
          return jsonError(degradeMessage('circuit_open', lastQ), 503, trace.traceId, {
            'X-Degrade-Reason': 'circuit_open',
            'X-Tool-Route': toolRoute.route,
            'X-Agent-Mode': agentMode,
          });
        }
        // A root already locked to the GPU cannot silently change speaker.
        if (needsNewRootForProvider(sessionProvider, next.pick.provider)) {
          return jsonError(MODEL_SWAP_PING, 409, trace.traceId, { 'X-New-Root': 'model_swap' }, {
            code: 'new_root',
            reason: 'model_swap',
          });
        }
        failoverFrom = failedProvider;
        routeRule = 'gpu_failover';
        picked = next.pick;
        probe = next.probe;
        frozenSystem = frozenFor(picked);
        guard.setSystem(frozenSystem);
        turnPrefixHash = await prefixHash(frozenSystem, withMcp);
        att = startAttempt(picked, probe, frozenSystem, turnPrefixHash);
      }
    }
    const result = att.result;

    // Owner unlimited (session or email cookie): do not burn the visitor counter.
    // Cookie quota (no Redis): charged up front exactly as before. With Redis
    // the cookie just mirrors the current count; the charge happens on commit.
    const setCookie = unlimitedChat
      ? null
      : await buildQuotaCookie({ date: quota.date, count: redisQuotaKey ? quota.count : quota.count + 1 });
    // Always refresh visitor cookie Max-Age so browser id tracks the 90d Redis TTL.
    const visitorCookie = await buildVisitorCookie(visitorId);

    const stream = result.toUIMessageStreamResponse({
      onError: (err) => {
        const msg = err instanceof Error ? err.message : String(err);
        const classified = classifyModelError(err);
        const cancelled = isCancellation(err, req.signal);
        if (!cancelled) void breakerFailure(picked.provider).catch(() => {});
        if (!cancelled && picked.provider === 'deepseek' && isModelMissingError(err)) noteDeepSeekModelMissing();
        trace.endSpan(att.modelSpan, false, { error: msg.slice(0, 160), reason: cancelled ? 'cancelled' : classified.reason });
        att.turnEvent({ stopReason: cancelled ? 'cancelled' : 'error', finishReason: 'error', committed: false, error: classified.reason });
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
    // X-Provider stays public: the console uses it as the session provider lock.
    headers.set('X-Provider', picked.provider);
    headers.set('X-Agent-Mode', agentMode);
    headers.set('X-Voice-Accent', voiceAccent ?? 'off');
    headers.set('X-Tool-Route', toolRoute.route);
    headers.set('X-Trace-Id', trace.traceId);
    // Hash only (no content): lets the harness check the prefix stays stable per session.
    headers.set('X-Prefix-Hash', turnPrefixHash);
    if (showDebugHeaders) {
      headers.set('X-Model-Tier', picked.tier);
      headers.set('X-System-Prompt-Chars', String(frozenSystem.length));
      headers.set('X-Session-Tail-Chars', String(wrappedTail.length));
      headers.set('X-Visitor-Soft-Memory', visitorSoftMemoryEnabled() ? 'redis' : 'off');
      headers.set('X-React-Max-Steps', String(REACT_MAX_STEPS));
      headers.set('X-Model-Budget-Ms', String(MODEL_TOTAL_BUDGET_MS));
    }

    console.log('[chat] POST: stream response initialized', { traceId: trace.traceId });
    return new Response(stream.body, { status: stream.status, headers });
  } catch (err) {
    if (!isCancellation(err, req.signal)) void breakerFailure(picked.provider).catch(() => {});
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
