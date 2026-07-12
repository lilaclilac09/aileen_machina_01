#!/usr/bin/env tsx
/**
 * ReAct R1 unit checks — duplicate fuse, observation truncate, audit.
 *
 *   pnpm verify:react
 */

import {
  createReactGuardSession,
  fingerprintToolCall,
  truncateObservation,
  isEmptyObservation,
  wrapToolsWithReactGuard,
  REACT_MAX_HITS,
  REACT_MAX_SNIPPET_CHARS,
} from '../lib/reactGuard';
import {
  routeToolsForQuestion,
  applyToolRoute,
  toolsBlockedByRoute,
  isToolAllowed,
} from '../lib/toolRouter';

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log('verify-react — R1 guards\n');

  const a = fingerprintToolCall('searchMemories', { query: 'Hockney', k: 3 });
  const b = fingerprintToolCall('searchMemories', { k: 3, query: 'Hockney' });
  const c = fingerprintToolCall('searchMemories', { query: 'Didion', k: 3 });
  assert('fingerprint ignores key order', a === b, a);
  assert('fingerprint differs on args', a !== c);

  const longSnip = 'x'.repeat(500);
  const truncated = truncateObservation([
    { path: 'a.md', snippet: longSnip, score: 1 },
    { path: 'b.md', snippet: 'ok', score: 0.5 },
    { path: 'c.md', snippet: 'ok', score: 0.4 },
    { path: 'd.md', snippet: 'dropped', score: 0.1 },
  ]) as Array<{ snippet: string; path: string }>;
  assert('truncate keeps top N hits', truncated.length === REACT_MAX_HITS, String(truncated.length));
  assert(
    'truncate clips snippet',
    truncated[0].snippet.length <= REACT_MAX_SNIPPET_CHARS,
    String(truncated[0].snippet.length),
  );
  assert('empty array is empty obs', isEmptyObservation([]));
  assert('found:false is empty obs', isEmptyObservation({ found: false }));
  assert('non-empty hits not empty', !isEmptyObservation([{ path: 'a' }]));

  const session = createReactGuardSession();
  const tools = wrapToolsWithReactGuard(
    {
      searchMemories: {
        execute: async ({ query }: { query: string }) => [{ path: 'x', snippet: query.repeat(100), score: 1 }],
      },
    },
    session,
  );

  const first = await (tools.searchMemories.execute as (a: { query: string }) => Promise<unknown>)({
    query: 'Hockney',
  });
  assert('first call allowed', Array.isArray(first) && (first as unknown[]).length === 1);

  const second = (await (tools.searchMemories.execute as (a: { query: string }) => Promise<unknown>)({
    query: 'Hockney',
  })) as { blocked?: boolean; reason?: string };
  assert('second identical call blocked', second?.blocked === true && second?.reason === 'duplicate_tool');

  const third = await (tools.searchMemories.execute as (a: { query: string }) => Promise<unknown>)({
    query: 'Didion',
  });
  assert('different args still allowed', Array.isArray(third));

  const emptySession = createReactGuardSession();
  const emptyTools = wrapToolsWithReactGuard(
    {
      searchMemories: {
        execute: async () => [],
      },
    },
    emptySession,
  );
  await (emptyTools.searchMemories.execute as (a: { query: string }) => Promise<unknown>)({ query: 'zzz' });
  const emptyAudit = emptySession.summary();
  assert('empty recall counted', emptyAudit.emptyRecalls === 1, String(emptyAudit.emptyRecalls));

  const errSession = createReactGuardSession();
  const errTools = wrapToolsWithReactGuard(
    {
      boom: {
        execute: async () => {
          throw new Error('boom');
        },
      },
    },
    errSession,
  );
  const errObs = (await (errTools.boom.execute as (a: Record<string, never>) => Promise<unknown>)(
    {},
  )) as { error?: boolean };
  assert('tool error returns soft observation', errObs?.error === true);
  assert('tool error counted', errSession.summary().toolErrors === 1);

  const audit = session.summary();
  assert('duplicateBlocks >= 1', audit.duplicateBlocks >= 1, String(audit.duplicateBlocks));
  assert(
    'stopReasonPrimary duplicate_tool',
    audit.stopReasonPrimary === 'duplicate_tool',
    audit.stopReasonPrimary,
  );

  console.log('\n=== Tool router (R2) ===\n');

  const music = routeToolsForQuestion('what music does she like?');
  assert('music → taste route', music.route === 'taste', music.route);
  assert('music allows searchMemories', isToolAllowed(music, 'searchMemories'));
  assert('music blocks queryChip', !isToolAllowed(music, 'queryChip'), toolsBlockedByRoute(music).join(','));

  const hire = routeToolsForQuestion('is she available for hire?');
  assert('hire → none', hire.allowed === 'none', String(hire.allowed));
  const hireTools = applyToolRoute(
    { searchMemories: { execute: async () => [] }, queryChip: { execute: async () => ({}) } },
    hire,
  );
  assert('hire exposes zero tools', Object.keys(hireTools).length === 0);

  const centaur = routeToolsForQuestion('what is Centaur?');
  assert('centaur route', centaur.route === 'centaur', centaur.route);
  assert('centaur prefers research+articles', centaur.preferred.includes('searchResearch'));
  assert('centaur blocks queryChip', !isToolAllowed(centaur, 'queryChip'));

  const chip = routeToolsForQuestion('how much is an H100?');
  assert('chip route', chip.route === 'chips', chip.route);
  assert('chip allows queryChip', isToolAllowed(chip, 'queryChip'));
  assert('chip blocks searchMemories', !isToolAllowed(chip, 'searchMemories'));

  const faith = routeToolsForQuestion('what is her faith?');
  assert('faith route', faith.route === 'faith', faith.route);
  assert('faith prefers searchMemories', faith.preferred[0] === 'searchMemories');

  const myth = routeToolsForQuestion('if I get senior enough will that protect women in tech?');
  assert('myth → false_belief', myth.route === 'false_belief', myth.route);

  const failed = checks.filter((c) => !c.ok);
  console.log(`\nResult: ${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) {
    for (const f of failed) console.error(`  - ${f.name}: ${f.detail ?? ''}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
