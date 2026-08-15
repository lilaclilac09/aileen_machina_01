#!/usr/bin/env tsx
/**
 * Ops resilience checks — model circuit, degrade copy, trace helpers, ETL artifacts.
 *
 *   pnpm verify:ops
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  routeModel,
  recordModelFailure,
  recordModelSuccess,
  isCircuitOpen,
  getCircuitState,
  CIRCUIT_FAILURE_THRESHOLD,
  degradeMessage,
  classifyModelError,
  MODEL_TOTAL_BUDGET_MS,
} from '../lib/modelRouter';
import { createRequestTrace } from '../lib/requestTrace';
import { decideAgentMode, isCouncilPipelineRequest, skipVisitorQuota } from '../lib/agentMode';
import { parseVoiceAccent, spokenRegisterPrompt } from '../lib/voiceAccent';
import { COUNCIL_SYSTEM_PROMPT } from '../lib/aileenaCouncil';
import { SYSTEM_PROMPT } from '../lib/agentContext';
import { COUNCIL_OPENING } from '../lib/councilCopy';
import {
  decodeForwardRecord,
  encodeForwardRecord,
  type ChatForwardRecord,
} from '../lib/chatForwardStore';
import {
  decryptPrivateText,
  encryptPrivateText,
  privateEncryptionAvailable,
  resetPrivateCryptoCache,
} from '../lib/server/crypto';
import { matchCanned } from '../lib/agentCannedResponses';
import { SITE_AGENT_OPENING } from '../lib/siteAgentCopy';
import { buildCatchUpGreeting } from '../lib/articleTopicMemory';
import { CONTACT_OFFLINE_PUBLIC } from '../lib/mail-transcript';
import { isVoiceCodeIntent } from '../lib/voiceCodeIntent';
import { isDrawIntent } from '../lib/drawIntent';
import { DRAW_DECK, DRAW_DECK_SIZE, pickDrawCard, reciteDrawCard } from '../lib/drawDeck';
import { taipeiDay } from '../lib/taipeiDay';
import {
  buildFrozenSystemPrompt,
  buildSessionTail,
  frozenPrefixForbidden,
  needsNewRootForLength,
  needsNewRootForProvider,
  needsNewRootForAccent,
  readSessionProviderLock,
  FROZEN_MAX_MESSAGES,
} from '../lib/consolePrefix';
import { parseNewRootError, frozenRootIdentity, machinaRootSpoken, classifyRootProvider } from '../lib/consolePrefixCopy';
import { routeToolsForQuestion } from '../lib/toolRouter';
import {
  isAllowedVoiceCodePath,
  VOICE_CODE_WRITE_ALLOWLIST,
} from '../lib/voiceCodeAllowlist';
import {
  applyHunksToText,
  buildDownloadablePatch,
  extractUnifiedDiff,
  parseUnifiedDiff,
} from '../lib/voiceCodePatch';
import { applyAllowlistedPatch } from '../lib/voiceCodeApply';
import { isOwnerEmail } from '../lib/owner-access';

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function main() {
  console.log('verify-ops — model route / circuit / trace / ETL\n');

  // Reset circuit via successes first
  recordModelSuccess();
  assert('circuit starts closed', !isCircuitOpen());

  const okRoute = routeModel({ toolRoute: 'taste', lastQuestion: 'what music?' });
  assert(
    'routeModel with key or degrade',
    okRoute.mode === 'llm' || okRoute.mode === 'degrade',
    okRoute.mode === 'llm' ? okRoute.pick.provider : okRoute.reason,
  );

  for (let i = 0; i < CIRCUIT_FAILURE_THRESHOLD; i++) {
    recordModelFailure(new Error(`probe-${i}`));
  }
  assert('circuit opens after threshold failures', isCircuitOpen(), JSON.stringify(getCircuitState()));

  const degraded = routeModel({ toolRoute: 'taste', lastQuestion: 'hello' });
  assert('open circuit → degrade', degraded.mode === 'degrade', degraded.mode);
  if (degraded.mode === 'degrade') {
    assert('degrade prefers canned greeting when possible', /hey|你好|pause|quiet|again|contact/i.test(degraded.message), degraded.message.slice(0, 80));
  }

  // Force half-open by clearing openUntil via success path after cooldown simulation:
  // recordModelSuccess clears circuit entirely.
  recordModelSuccess();
  assert('success closes circuit', !isCircuitOpen());

  assert('budget under vercel maxDuration', MODEL_TOTAL_BUDGET_MS < 30_000, String(MODEL_TOTAL_BUDGET_MS));
  assert('timeout classified', classifyModelError(new Error('AbortError: timeout')).reason === 'timeout');
  assert('billing classified', classifyModelError(new Error('credit balance too low')).reason === 'billing');
  assert('degrade timeout copy', /too long|again/i.test(degradeMessage('timeout')));

  assert('parse shanghai accent', parseVoiceAccent('Shanghai') === 'shanghai');
  assert('reject junk accent', parseVoiceAccent('argentina') === null);
  assert('shanghai spoken register is Chinese-auntie not dsh', /上海阿姨/.test(spokenRegisterPrompt('shanghai')) && !/dsh/i.test(spokenRegisterPrompt('shanghai')));
  assert('typed voice is silent', spokenRegisterPrompt(null) === '');
  const shRoute = routeModel({ toolRoute: 'taste', lastQuestion: '你好', voiceAccent: 'shanghai' });
  if (okRoute.mode === 'llm') {
    assert(
      'shanghai voice stays on deepseek when keyed',
      shRoute.mode === 'llm' && shRoute.reason.startsWith('shanghai_voice:'),
      shRoute.mode === 'llm' ? shRoute.reason : shRoute.reason,
    );
  } else {
    assert(
      'shanghai voice still degrades without a key',
      shRoute.mode === 'degrade',
      shRoute.mode === 'degrade' ? shRoute.reason : shRoute.mode,
    );
  }

  const greet = matchCanned('hi');
  assert('canned hi uses site opening', greet?.reply === SITE_AGENT_OPENING, greet?.reply?.slice(0, 80));
  const modelEn = matchCanned('what model are you', [], { rootProvider: 'deepseek' });
  assert(
    'canned model identity is machina deepseek not dsh',
    Boolean(modelEn?.reply) &&
      /Machina/.test(modelEn!.reply) &&
      /DeepSeek via modelRouter/.test(modelEn!.reply) &&
      /not dsh/i.test(modelEn!.reply) &&
      !/Claude|GPT-4|ChatGPT/i.test(modelEn!.reply),
    modelEn?.reply,
  );
  const modelUnlocked = matchCanned('what model are you');
  assert(
    'unlocked root does not bake DeepSeek',
    Boolean(modelUnlocked?.reply) &&
      /Machina/.test(modelUnlocked!.reply) &&
      !/DeepSeek via modelRouter/.test(modelUnlocked!.reply) &&
      /not dsh/i.test(modelUnlocked!.reply),
    modelUnlocked?.reply,
  );
  const modelZh = matchCanned('你是什么模型', [], { rootProvider: 'deepseek' });
  assert(
    'canned zh model identity is machina not dsh',
    Boolean(modelZh?.reply) && /Machina/.test(modelZh!.reply) && /DeepSeek/.test(modelZh!.reply) && /不是 dsh/.test(modelZh!.reply),
    modelZh?.reply,
  );
  const modelOn = matchCanned('who are you running on', [], { rootProvider: 'on-device' });
  assert(
    'on-device root does not claim deepseek',
    Boolean(modelOn?.reply) && /on-device/i.test(modelOn!.reply) && !/This root is DeepSeek/.test(modelOn!.reply),
    modelOn?.reply,
  );
  const modelQwen = matchCanned('what model are you', [], { rootProvider: 'qwen' });
  assert(
    'qwen on-device is named',
    Boolean(modelQwen?.reply) && /Qwen on-device/.test(modelQwen!.reply) && !/This root is DeepSeek/.test(modelQwen!.reply),
    modelQwen?.reply,
  );
  assert('are you chatgpt does not waffle', /Machina/.test(matchCanned('are you chatgpt', [], { rootProvider: 'deepseek' })?.reply ?? '') && !/small machine/.test(matchCanned('are you chatgpt', [], { rootProvider: 'deepseek' })?.reply ?? ''));
  assert(
    'frozen identity is this-root only',
    /You are Machina/.test(frozenRootIdentity('deepseek')) &&
      /DeepSeek via modelRouter/.test(frozenRootIdentity('deepseek')) &&
      /not DeepSeek Harness/.test(frozenRootIdentity('deepseek')) &&
      /Qwen on-device/.test(frozenRootIdentity('qwen')) &&
      !/speaking model is DeepSeek/.test(frozenRootIdentity('qwen')) &&
      !/DeepSeek via modelRouter/.test(frozenRootIdentity(undefined)) &&
      /THIS root only/.test(frozenRootIdentity('qwen')),
  );
  assert('empty lock does not name DeepSeek', classifyRootProvider(undefined) === 'unset' && classifyRootProvider('') === 'unset');
  assert('spoken fallback does not claim to be gpt', /fallback via modelRouter/.test(machinaRootSpoken('fallback:gpt-4o-mini')) && !/I am GPT/i.test(machinaRootSpoken('fallback:gpt-4o-mini')));
  assert(
    'empty-state greeting is the opening line',
    buildCatchUpGreeting([]) === SITE_AGENT_OPENING,
    buildCatchUpGreeting([]).slice(0, 80),
  );
  assert(
    'system prompt is site-agent spec not chatbot',
    /not a generic chatbot/i.test(SYSTEM_PROMPT) && /contact collector/i.test(SYSTEM_PROMPT),
  );
  assert(
    'system prompt forbids assistant cliches',
    /How can I assist you today/i.test(SYSTEM_PROMPT) && /As an AI/i.test(SYSTEM_PROMPT),
  );
  assert(
    'offline copy stays public-safe',
    /offline right now/i.test(CONTACT_OFFLINE_PUBLIC) && !/resend|api key|vercel/i.test(CONTACT_OFFLINE_PUBLIC),
  );
  const agentChatSrc = readFileSync(join(process.cwd(), 'components/AgentChat.tsx'), 'utf8');
  assert(
    'leave-a-note form uses CONTACT_OFFLINE_PUBLIC',
    agentChatSrc.includes('{CONTACT_OFFLINE_PUBLIC}'),
  );
  assert(
    'leave-a-note form does not use paused copy',
    !/paused right now/i.test(agentChatSrc),
  );
  assert(
    'no_model degrade hides env',
    !/DEEPSEEK|API_KEY|Vercel/i.test(degradeMessage('no_model')),
    degradeMessage('no_model').slice(0, 80),
  );

  const visitorCouncil = decideAgentMode('council', false);
  assert(
    'visitor council request is 403',
    !visitorCouncil.ok && visitorCouncil.status === 403,
    visitorCouncil.ok ? visitorCouncil.mode : visitorCouncil.error,
  );
  const ownerCouncil = decideAgentMode('council', true);
  assert('owner council request is council', ownerCouncil.ok && ownerCouncil.mode === 'council');
  const publicDefault = decideAgentMode(undefined, false);
  assert('omitted mode is public', publicDefault.ok && publicDefault.mode === 'public');
  const siteAlias = decideAgentMode('site', false);
  assert('site alias is public', siteAlias.ok && siteAlias.mode === 'public');
  const publicNamed = decideAgentMode('public', false);
  assert('public mode is public', publicNamed.ok && publicNamed.mode === 'public');
  const unknownMode = decideAgentMode('wizard', true);
  assert('unknown mode is public', unknownMode.ok && unknownMode.mode === 'public');
  assert('visitor cannot skip quota via mode', skipVisitorQuota(false) === false);
  assert('owner skips visitor quota', skipVisitorQuota(true) === true);
  assert('forged council contact is blocked', isCouncilPipelineRequest({ agentMode: 'council' }));
  assert('public contact is allowed', !isCouncilPipelineRequest({ agentMode: 'public' }));
  assert('public prompt is not council', !/private council/i.test(SYSTEM_PROMPT));
  assert('council prompt is private', /private council/i.test(COUNCIL_SYSTEM_PROMPT));
  assert('council does not do therapy', /no therapy voice/i.test(COUNCIL_SYSTEM_PROMPT));
  assert(
    'council is emotionally literate not persuadable',
    /emotionally literate but not emotionally persuadable/i.test(COUNCIL_SYSTEM_PROMPT),
  );
  assert(
    'council rejects therapy cliches',
    /i understand how you feel/i.test(COUNCIL_SYSTEM_PROMPT) &&
      /as an ai assistant/i.test(COUNCIL_SYSTEM_PROMPT),
  );
  assert(
    'council messy format is read-risk-move-wording',
    /read:/i.test(COUNCIL_SYSTEM_PROMPT) && /wording:/i.test(COUNCIL_SYSTEM_PROMPT),
  );
  assert('council opening is not the public greeting', !/music shelf/i.test(COUNCIL_OPENING));
  assert('council opening is the invoice detector', /invoice hiding inside/i.test(COUNCIL_OPENING));
  assert('council prompt forbids leave-a-note', /leave-a-note/i.test(COUNCIL_SYSTEM_PROMPT));

  const councilChatSrc = readFileSync(join(process.cwd(), 'components/CouncilChat.tsx'), 'utf8');
  const chatRouteSrc = readFileSync(join(process.cwd(), 'app/api/chat/route.ts'), 'utf8');
  assert('public console sends agentMode public', /agentMode:\s*'public'/.test(agentChatSrc));
  assert('public console does not send council', !/agentMode:\s*'council'/.test(agentChatSrc));
  assert('public console still has leave-a-note', /leave a note/i.test(agentChatSrc));
  assert('public console still forwards', /\/api\/chat\/forward/.test(agentChatSrc));
  assert(
    'public console sends voiceAccent when Voice is on',
    /voiceAccent:/.test(agentChatSrc) && /readStoredVoiceAccent/.test(agentChatSrc),
  );
  assert('chat route applies spoken register via frozen prefix', /buildFrozenSystemPrompt/.test(chatRouteSrc) && /spokenRegisterPrompt/.test(readFileSync(join(process.cwd(), 'lib/consolePrefix.ts'), 'utf8')));
  assert('chat route ignores voice on council', /isCouncil \? null : parseVoiceAccent/.test(chatRouteSrc));
  const vcodeSrc = readFileSync(join(process.cwd(), 'app/api/voice-code/route.ts'), 'utf8');
  assert('voice-code pins model with voiceAccent', /voiceAccent/.test(vcodeSrc) && /toolRoute: 'voice_code'/.test(vcodeSrc));
  assert('voice-code never applies spoken register', !/spokenRegisterPrompt/.test(vcodeSrc));
  assert('voice-code stays propose-only not dsh', /harness: 'propose-only'/.test(vcodeSrc) && /write_target: null/.test(vcodeSrc) && /not DeepSeek Harness/.test(vcodeSrc));
  assert('voice-code never returns apply true', /apply: false/.test(vcodeSrc) && /wantsWrite/.test(vcodeSrc));
  assert('voice-code does not import dsh', !/from ['"][^'"]*dsh|@deepseek-ai\/dsh|npx @deepseek-ai/.test(vcodeSrc));
  assert('voice-code fetch sends voiceAccent', /\/api\/voice-code/.test(agentChatSrc) && /prompt: trimmed/.test(agentChatSrc));
  assert(
    'voice-on empty state still teaches voice-code',
    /voiceMode \?/.test(agentChatSrc) && /写代码/.test(agentChatSrc) && /propose-only patch/.test(agentChatSrc),
  );
  assert(
    'vcode chip is Voice → code with leftover quota',
    /Voice → code/.test(agentChatSrc) && /\{vcodeRemaining\} left today/.test(agentChatSrc) && /ask\('Voice → code:/.test(agentChatSrc),
  );
  assert('visitor UI has copy + take patch', /copy/.test(agentChatSrc) && /take \.patch/.test(agentChatSrc));
  assert('visitor UI has no public Apply button', !/['"]Apply['"]/.test(agentChatSrc) && /isOwner \?/.test(agentChatSrc) && /owner apply/.test(agentChatSrc));
  assert('console does not call public apply', !/fetch\(['"]\/api\/voice-code\/apply/.test(agentChatSrc));
  assert('owner apply uses existing owner session', /\/api\/owner\/voice-code\/apply/.test(agentChatSrc));

  const publicApplySrc = readFileSync(join(process.cwd(), 'app/api/voice-code/apply/route.ts'), 'utf8');
  assert('public apply route never 200', /status: 403/.test(publicApplySrc) && !/status:\s*200/.test(publicApplySrc));
  assert('public apply never writes', !/writeFile|git apply|applyAllowlistedPatch/.test(publicApplySrc));

  const ownerApplySrc = readFileSync(join(process.cwd(), 'app/api/owner/voice-code/apply/route.ts'), 'utf8');
  assert('owner apply requires owner session', /requireOwnerFromRequest/.test(ownerApplySrc) && /Owner session required/.test(ownerApplySrc) && /401/.test(ownerApplySrc));
  assert('owner apply uses console/footer allowlist', /VOICE_CODE_WRITE_ALLOWLIST/.test(ownerApplySrc));
  assert('owner apply does not import dsh', !/deepseek-harness|@deepseek-ai\/dsh/.test(ownerApplySrc));

  assert('idle chat does not burn vcode', isVoiceCodeIntent('hi') === false && isVoiceCodeIntent("what's her solana stack?") === false);
  assert(
    'casual English fix stays on chat',
    isVoiceCodeIntent('can you fix my understanding of her solana work?') === false &&
      isVoiceCodeIntent('nothing to fix here') === false,
  );
  assert('fix / implement / 写代码 burn vcode', isVoiceCodeIntent('fix the footer') && isVoiceCodeIntent('implement a patch') && isVoiceCodeIntent('写代码'));
  assert(
    'write code / 改代码 / 修bug / 重构 burn vcode',
    isVoiceCodeIntent('write code for the footer') &&
      isVoiceCodeIntent('改代码') &&
      isVoiceCodeIntent('修bug') &&
      isVoiceCodeIntent('重构'),
  );
  assert('Voice → code chip burns vcode', isVoiceCodeIntent('Voice → code: sketch a small patch for the Console footer'));
  assert('Voice -> code ascii prefix burns vcode', isVoiceCodeIntent('Voice -> code: patch the console footer'));
  assert('voice-code POST gates on isVoiceCodeIntent', /isVoiceCodeIntent/.test(vcodeSrc));
  assert(
    'convertToModelMessages throw is 400 jsonError',
    /convertToModelMessages/.test(chatRouteSrc) && /Invalid messages/.test(chatRouteSrc),
  );
  assert('allowlist is Console + footer copy', VOICE_CODE_WRITE_ALLOWLIST.includes('components/AgentChat.tsx') && VOICE_CODE_WRITE_ALLOWLIST.includes('lib/translations.ts'));
  assert('allowlist rejects kiln/visual root assets', isAllowedVoiceCodePath('public/bg_pic/03.jpeg') === false);
  assert('allowlist rejects harness-cli', isAllowedVoiceCodePath('harness-cli/src/tools/applyPatch.ts') === false);

  assert('idle chat does not burn draw', isDrawIntent('hi') === false && isDrawIntent("what's her solana stack?") === false && isDrawIntent('draw a diagram') === false);
  assert('抽牌 / 今日牌 / draw / tarot burn draw', isDrawIntent('抽牌') && isDrawIntent('今日牌') && isDrawIntent('draw') && isDrawIntent('tarot') && isDrawIntent('算一卦'));
  assert('draw deck is about 36 site cards', DRAW_DECK_SIZE >= 30 && DRAW_DECK_SIZE <= 40, String(DRAW_DECK_SIZE));
  assert(
    'draw rooms are kiln/shelf/wire/desk/door',
    DRAW_DECK.every((c) => ['kiln', 'shelf', 'wire', 'desk', 'door'].includes(c.room)),
  );
  assert(
    'draw cards link real site pages',
    DRAW_DECK.every((c) => c.href.startsWith('https://aileena.xyz')),
  );
  assert(
    'draw copy is not astrology',
    DRAW_DECK.every((c) => !/horoscope|zodiac|rising sign|mercury|star sign|fortune/i.test(c.recitation + c.title)),
  );
  const d1 = pickDrawCard('2026-08-14', 'vid-a');
  const d2 = pickDrawCard('2026-08-14', 'vid-a');
  assert('same Taipei day + visitor returns same card', d1.id === d2.id, `${d1.id} vs ${d2.id}`);
  assert('recite includes href', reciteDrawCard(d1).includes(d1.href));
  assert('taipei day is YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(taipeiDay(new Date('2026-08-14T16:00:00.000Z'))));

  const frozenSample = buildFrozenSystemPrompt({
    baseSystem: SYSTEM_PROMPT,
    agentMode: 'public',
    voiceAccent: null,
    rootProvider: 'deepseek',
    memoryIndexLine: '\n# Memory index (L2)\n0 chunks.',
    publicToolTable: '\n# Agent tools\n- searchArticles',
    machinaToolTable: '\n# Machina mode tools',
    councilToolTable: '\n# Council tools',
  });
  assert(
    'frozen prefix has no draw/quota/prefetch',
    frozenPrefixForbidden(frozenSample).length === 0,
    frozenPrefixForbidden(frozenSample).join(','),
  );
  assert('static system prompt has no draw', frozenPrefixForbidden(SYSTEM_PROMPT).length === 0);
  const tailSample = buildSessionTail({
    agentMode: 'public',
    memoryPrefetchBlock: '# Memory prefetch\n- hit',
    toolRoute: routeToolsForQuestion('hi'),
    visitorSoft: { questions: [], topics: [], updatedAt: '', hitCount: 0 },
    priorTopics: [],
    lastQuestion: 'hi',
    councilLensBlock: '',
  });
  assert('prefetch lives in the tail', /Memory prefetch/.test(tailSample));
  assert('compaction pings instead of silent slice', needsNewRootForLength(FROZEN_MAX_MESSAGES + 1) && !needsNewRootForLength(1));
  assert('provider swap needs new root', needsNewRootForProvider('deepseek', 'fallback:gpt-4o-mini'));
  assert('first turn has no provider lock', needsNewRootForProvider(undefined, 'deepseek') === false);
  assert('empty sessionProvider string is unlocked', readSessionProviderLock('', null) === undefined);
  assert('sessionProvider body lock is read', readSessionProviderLock('deepseek', null) === 'deepseek');
  assert('sessionProvider header lock is read', readSessionProviderLock('', 'fallback:x') === 'fallback:x');
  assert('accent swap needs new root', needsNewRootForAccent('shanghai', 'london') === true);
  assert('matching accent stays on root', needsNewRootForAccent('shanghai', 'shanghai') === false);
  assert('first turn has no accent lock', needsNewRootForAccent(undefined, 'shanghai') === false);
  const nr = parseNewRootError(
    JSON.stringify({ error: 'Context is full.', code: 'new_root', reason: 'compaction' }),
  );
  assert('parses 409 new_root JSON', nr?.reason === 'compaction' && /Fresh thread/.test(nr.message ?? ''));
  const nrWrapped = parseNewRootError(
    'Error: ' + JSON.stringify({ error: 'Accent changed.', code: 'new_root', reason: 'accent_swap' }),
  );
  assert('parses wrapped 409 new_root JSON', nrWrapped?.reason === 'accent_swap' && /Accent changed/.test(nrWrapped.message ?? ''));
  assert('chat route never silent-slices', !/messages\.slice\(-20\)/.test(chatRouteSrc) && /needsNewRootForLength/.test(chatRouteSrc));
  assert('chat route appends session tail', /messagesWithTail/.test(chatRouteSrc) && /sessionTail/.test(chatRouteSrc));
  assert('chat route does not import dsh', !/from ['"][^'"]*dsh|@deepseek-ai\/dsh|npx @deepseek-ai/.test(chatRouteSrc));
  assert('draw route exists', existsSync(join(process.cwd(), 'app/api/draw/route.ts')));
  const drawSrc = readFileSync(join(process.cwd(), 'app/api/draw/route.ts'), 'utf8');
  assert('draw route does not import dsh', !/dsh|@deepseek-ai/.test(drawSrc));
  assert('draw is not in the system prompt file', !/抽牌|今日牌|tarot|draw deck/.test(SYSTEM_PROMPT));
  assert('console runtime switch starts a new root', /beginNewRoot\(MODEL_SWAP_PING\)/.test(agentChatSrc));
  assert(
    'console always sends sessionProvider string',
    /sessionProvider: sessionProviderRef\.current \?\? ''/.test(agentChatSrc) &&
      /X-Session-Provider/.test(agentChatSrc),
  );
  assert(
    'frozen prefix names machina deepseek not dsh',
    /You are Machina/.test(frozenSample) &&
      /DeepSeek via modelRouter/.test(frozenSample) &&
      /not DeepSeek Harness/.test(frozenSample),
  );
  assert(
    'chat route identity is this-root lock or pick',
    /rootProvider: sessionProvider \?\? picked\.provider/.test(chatRouteSrc),
  );
  assert(
    'console canned model identity uses root provider',
    /matchCanned\(trimmed, readTopicMemory\(\)\.topics, \{/.test(agentChatSrc) &&
      /rootProvider:/.test(agentChatSrc) &&
      !/sessionProviderRef\.current \|\| 'deepseek'/.test(agentChatSrc),
  );
  assert('static system prompt does not bake speaking DeepSeek', !/DeepSeek as model/i.test(SYSTEM_PROMPT));
  assert(
    'console handles HTTP 409 new_root',
    /parseNewRootError/.test(agentChatSrc) &&
      /status !== 'error'/.test(agentChatSrc) &&
      /beginNewRoot\(parsed\.message/.test(agentChatSrc) &&
      /pingForNewRootReason/.test(agentChatSrc),
  );
  assert(
    'accent toggle starts a new root',
    /onAccentChange/.test(agentChatSrc) && /ACCENT_SWAP_PING/.test(agentChatSrc),
  );
  assert('chat route 409s accent mismatch', /needsNewRootForAccent/.test(chatRouteSrc) && /accent_swap/.test(chatRouteSrc));
  assert('chat route reads sessionProvider header', /readSessionProviderLock/.test(chatRouteSrc) && /x-session-provider/.test(chatRouteSrc));
  assert('console draw chip does not sit in system block', /data-draw-card/.test(agentChatSrc) && /isDrawIntent/.test(agentChatSrc));
  assert('console Enter waits for IME composition', /isComposing/.test(agentChatSrc));
  assert('draw day lock uses localStorage', /aileena_draw_daily_v1/.test(agentChatSrc) && /cardById/.test(agentChatSrc));
  assert('console still does not call public apply', !/fetch\(['"]\/api\/voice-code\/apply/.test(agentChatSrc));

  const sampleDiff = `--- a/components/AgentChat.tsx
+++ b/components/AgentChat.tsx
@@ -1,3 +1,3 @@
 line-a
-line-b
+line-b-fixed
 line-c
`;
  assert('extracts unified diff', extractUnifiedDiff(`notes\n\`\`\`diff\n${sampleDiff}\`\`\`\n`)?.includes('+++ b/components/AgentChat.tsx') === true);
  const parsed = parseUnifiedDiff(sampleDiff);
  assert('parses allowlisted path', parsed[0]?.rel === 'components/AgentChat.tsx');
  const appliedText = applyHunksToText('line-a\nline-b\nline-c\n', parsed[0].hunks);
  assert('hunk apply rewrites line', appliedText === 'line-a\nline-b-fixed\nline-c\n');
  const dl = buildDownloadablePatch({ proposal: sampleDiff, remaining: 4, limit: 5 });
  assert('downloadable patch is not apply true', /apply: false/.test(dl.patch) && dl.hasDiff && dl.filename.endsWith('.patch'));

  const tmp = mkdtempSync(join(tmpdir(), 'vcode-'));
  try {
    mkdirSync(join(tmp, 'components'));
    writeFileSync(join(tmp, 'components/AgentChat.tsx'), 'line-a\nline-b\nline-c\n');
    const off = applyAllowlistedPatch(tmp, `--- a/lib/agentContext.ts\n+++ b/lib/agentContext.ts\n@@ -1,1 +1,1 @@\n-old\n+new\n`);
    assert('off-allowlist apply is 403 no write', off.ok === false && off.status === 403 && off.written.length === 0);
    const empty = applyAllowlistedPatch(tmp, '');
    assert('empty patch is not 200', empty.ok === false && empty.status === 400);
    const okApply = applyAllowlistedPatch(tmp, sampleDiff);
    assert('allowlisted apply writes AgentChat', okApply.ok === true && okApply.written[0] === 'components/AgentChat.tsx');
    const noopDiff = `--- a/components/AgentChat.tsx
+++ b/components/AgentChat.tsx
@@ -1,3 +1,3 @@
 line-a
-line-b-fixed
+line-b-fixed
 line-c
`;
    const noop = applyAllowlistedPatch(tmp, noopDiff);
    assert('noop write is not 200', noop.ok === false && noop.status === 409);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  assert('council UI does not send voiceAccent', !/voiceAccent/.test(councilChatSrc));
  assert('council UI sends agentMode council', /agentMode:\s*'council'/.test(councilChatSrc));
  assert('council UI has no leave-a-note', !/leave a note|\/api\/lead/i.test(councilChatSrc));
  assert('council UI does not forward', !/\/api\/chat\/forward/.test(councilChatSrc));
  assert('chat route 403s non-owner council', /decideAgentMode/.test(chatRouteSrc) && /Council is owner-only/.test(readFileSync(join(process.cwd(), 'lib/agentMode.ts'), 'utf8')));
  assert('chat route selects council prompt', /COUNCIL_SYSTEM_PROMPT/.test(chatRouteSrc));
  assert('chat route skips visitor memory on council', /buildSessionTail/.test(chatRouteSrc) && /agentMode !== 'council'/.test(readFileSync(join(process.cwd(), 'lib/consolePrefix.ts'), 'utf8')));
  assert('council UI does not persist transcripts', !/chatForwardStore|saveChatForward|\/api\/owner/.test(councilChatSrc));
  assert('chat route does not persist council', !/saveChatForward|encodeForwardRecord/.test(chatRouteSrc));

  const councilPageSrc = readFileSync(join(process.cwd(), 'app/council/page.tsx'), 'utf8');
  const cabinetPageSrc = readFileSync(join(process.cwd(), 'app/cabinet/page.tsx'), 'utf8');
  const ownerAuthSrc = readFileSync(join(process.cwd(), 'app/api/auth/owner/route.ts'), 'utf8');
  assert('council page has owner key form', /OwnerUnlockForm/.test(councilPageSrc) && /next="\/council"/.test(councilPageSrc));
  assert('council page links cabinet', /href="\/cabinet"/.test(councilPageSrc));
  assert('cabinet page is owner-only', /getOwnerIdentity/.test(cabinetPageSrc) && /OwnerUnlockForm/.test(cabinetPageSrc));
  assert('owner auth accepts POST', /export async function POST/.test(ownerAuthSrc));
  assert('public console has no council href', !/href=['"]\/council['"]/.test(agentChatSrc));

  const ownerAccessSrc = readFileSync(join(process.cwd(), 'lib/owner-access.ts'), 'utf8');
  assert(
    'owner-access source has no hardcoded owner email',
    !/rosazxc0915@gmail.com/.test(ownerAccessSrc) && !/DEFAULT_OWNER_EMAILS/.test(ownerAccessSrc),
  );
  const ownerEnvKeys = ['OWNER_EMAILS', 'CONTACT_TO', 'CONTACT_TO_EMAIL', 'LEAD_INBOX', 'NOTIFY_CC_EMAIL'] as const;
  const prevOwnerEnv = Object.fromEntries(ownerEnvKeys.map((k) => [k, process.env[k]]));
  for (const k of ownerEnvKeys) delete process.env[k];
  assert('isOwnerEmail rejects empty string', isOwnerEmail('') === false);
  process.env.CONTACT_TO = 'inbox@example.com';
  process.env.CONTACT_TO_EMAIL = 'inbox2@example.com';
  process.env.LEAD_INBOX = 'inbox3@example.com';
  process.env.NOTIFY_CC_EMAIL = 'inbox4@example.com';
  assert(
    'isOwnerEmail is false when OWNER_EMAILS unset even if contact inbox env is set',
    isOwnerEmail('inbox@example.com') === false &&
      isOwnerEmail('inbox2@example.com') === false &&
      isOwnerEmail('inbox3@example.com') === false &&
      isOwnerEmail('inbox4@example.com') === false &&
      isOwnerEmail('rosazxc0915@gmail.com') === false,
  );
  process.env.OWNER_EMAILS = 'owner@example.com';
  assert('isOwnerEmail is true only for OWNER_EMAILS', isOwnerEmail('owner@example.com') === true);
  assert(
    'isOwnerEmail stays false for contact inbox when OWNER_EMAILS is set',
    isOwnerEmail('inbox@example.com') === false && isOwnerEmail('visitor@example.com') === false,
  );
  for (const k of ownerEnvKeys) {
    if (prevOwnerEnv[k] === undefined) delete process.env[k];
    else process.env[k] = prevOwnerEnv[k];
  }

  const prevKey = process.env.PRIVATE_DATA_ENCRYPTION_KEY;
  resetPrivateCryptoCache();
  delete process.env.PRIVATE_DATA_ENCRYPTION_KEY;
  assert('missing encryption key is unavailable', privateEncryptionAvailable() === false);
  const sample: ChatForwardRecord = {
    id: 'sess1234-abc',
    sessionId: 'sess1234-session',
    status: 'sent',
    subject: '[AILEENA Chat sess1234] NEGOTIATE_FEE_SECRET',
    transcript: [{ role: 'user', text: 'NEGOTIATE_FEE_SECRET do not store plaintext' }],
    createdAt: '2026-08-13T00:00:00.000Z',
  };
  assert('missing key refuses plaintext persist', encodeForwardRecord(sample) === null);

  process.env.PRIVATE_DATA_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString('base64');
  resetPrivateCryptoCache();
  assert('explicit 32-byte key is available', privateEncryptionAvailable() === true);
  const a = encryptPrivateText('hello council');
  const b = encryptPrivateText('hello council');
  assert('each encrypt uses a unique iv', a.iv !== b.iv);
  assert('gcm envelope has version', a.v === 1 && a.alg === 'aes-256-gcm');
  assert('decrypt roundtrip', decryptPrivateText(a) === 'hello council');
  const stored = encodeForwardRecord(sample);
  assert('forward encode stores ciphertext blob', Boolean(stored?.enc?.ct));
  const storedJson = JSON.stringify(stored);
  assert('redis payload has no plaintext transcript', !storedJson.includes('NEGOTIATE_FEE_SECRET'));
  assert('redis payload has no subject field', stored != null && !('subject' in stored) && !('transcript' in stored));
  const decoded = decodeForwardRecord(stored);
  assert('owner decode restores transcript', decoded?.transcript[0]?.text === sample.transcript[0].text);
  assert(
    'legacy plaintext still readable',
    decodeForwardRecord({
      id: 'legacy',
      sessionId: 'legacy-sess',
      status: 'sent',
      createdAt: sample.createdAt,
      subject: 'old',
      transcript: [{ role: 'user', text: 'legacy plaintext' }],
    })?.transcript[0]?.text === 'legacy plaintext',
  );

  if (prevKey === undefined) delete process.env.PRIVATE_DATA_ENCRYPTION_KEY;
  else process.env.PRIVATE_DATA_ENCRYPTION_KEY = prevKey;
  resetPrivateCryptoCache();

  const trace = createRequestTrace('abc12345trace');
  const s = trace.startSpan('test');
  trace.endSpan(s, true, { n: 1 });
  const sum = trace.summary();
  assert('trace id preserved', sum.traceId === 'abc12345trace');
  assert('trace has span', sum.spans.length === 1 && sum.spans[0].name === 'test');

  console.log('\n=== Document ETL artifacts ===\n');
  const root = process.cwd();
  const artifacts = [
    'scripts/build-article-index.ts',
    'scripts/build-data-index.ts',
    'scripts/build-memory-index.ts',
    'scripts/sync-content-memory.ts',
    'scripts/dreaming-consolidate.ts',
  ];
  for (const rel of artifacts) {
    const p = join(root, rel);
    assert(`ETL script exists: ${rel}`, existsSync(p));
  }

  // Indexes may be gitignored — existence after local build is best-effort.
  for (const rel of ['lib/memoryIndex.json', 'lib/agentArticleIndex.json'] as const) {
    const p = join(root, rel);
    if (existsSync(p)) {
      const st = statSync(p);
      assert(`${rel} non-empty`, st.size > 100, `${st.size} bytes`);
    } else {
      assert(`${rel} optional until build`, true, 'missing — run pnpm build:memory-index / build:index');
    }
  }

  const failed = checks.filter((c) => !c.ok);
  console.log(`\nResult: ${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) {
    for (const f of failed) console.error(`  - ${f.name}: ${f.detail ?? ''}`);
    process.exit(1);
  }
}

main();
