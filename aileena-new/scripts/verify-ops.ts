#!/usr/bin/env tsx
/**
 * Ops resilience checks — model circuit, degrade copy, trace helpers, ETL artifacts.
 *
 *   pnpm verify:ops
 */

import { existsSync, statSync } from 'node:fs';
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
    assert('degrade prefers canned greeting when possible', /hey|你好|break|snag|contact/i.test(degraded.message), degraded.message.slice(0, 80));
  }

  // Force half-open by clearing openUntil via success path after cooldown simulation:
  // recordModelSuccess clears circuit entirely.
  recordModelSuccess();
  assert('success closes circuit', !isCircuitOpen());

  assert('budget under vercel maxDuration', MODEL_TOTAL_BUDGET_MS < 30_000, String(MODEL_TOTAL_BUDGET_MS));
  assert('timeout classified', classifyModelError(new Error('AbortError: timeout')).reason === 'timeout');
  assert('billing classified', classifyModelError(new Error('credit balance too low')).reason === 'billing');
  assert('degrade timeout copy', /too long|again/i.test(degradeMessage('timeout')));

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
