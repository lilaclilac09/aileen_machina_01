#!/usr/bin/env tsx
/**
 * Ops resilience checks — model circuit, degrade copy, trace helpers, ETL artifacts.
 *
 *   pnpm verify:ops
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
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
import { COUNCIL_SYSTEM_PROMPT } from '../lib/aileenaCouncil';
import { SYSTEM_PROMPT } from '../lib/agentContext';
import { COUNCIL_OPENING } from '../lib/councilCopy';

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
  assert('council opening is not the public greeting', !/music shelf/i.test(COUNCIL_OPENING));
  assert('council opening forbids leave-a-note', /no leave-a-note/i.test(COUNCIL_OPENING));

  const agentChatSrc = readFileSync(join(process.cwd(), 'components/AgentChat.tsx'), 'utf8');
  const councilChatSrc = readFileSync(join(process.cwd(), 'components/CouncilChat.tsx'), 'utf8');
  const chatRouteSrc = readFileSync(join(process.cwd(), 'app/api/chat/route.ts'), 'utf8');
  assert('public console sends agentMode public', /agentMode:\s*'public'/.test(agentChatSrc));
  assert('public console does not send council', !/agentMode:\s*'council'/.test(agentChatSrc));
  assert('public console still has leave-a-note', /leave a note/i.test(agentChatSrc));
  assert('public console still forwards', /\/api\/chat\/forward/.test(agentChatSrc));
  assert('council UI sends agentMode council', /agentMode:\s*'council'/.test(councilChatSrc));
  assert('council UI has no leave-a-note', !/leave a note|\/api\/lead/i.test(councilChatSrc));
  assert('council UI does not forward', !/\/api\/chat\/forward/.test(councilChatSrc));
  assert('chat route 403s non-owner council', /decideAgentMode/.test(chatRouteSrc) && /Council is owner-only/.test(readFileSync(join(process.cwd(), 'lib/agentMode.ts'), 'utf8')));
  assert('chat route selects council prompt', /COUNCIL_SYSTEM_PROMPT/.test(chatRouteSrc));
  assert('chat route skips visitor memory on council', /isCouncil \? '' : formatVisitorSoftMemoryForPrompt/.test(chatRouteSrc));

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
