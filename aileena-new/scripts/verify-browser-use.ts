#!/usr/bin/env tsx
/**
 * Browser Use Cloud wiring — no billed Cloud call.
 * Run: pnpm verify:browser-use
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseOwnerBrowseCommand } from '../lib/browserUse/parseBrowseCommand';
import { browserUseStatus, formatBrowserUseSpoken } from '../lib/browserUse/status';
import { hasBrowserUseApiKey, isBrowserUseLiveEnabled } from '../lib/browserUse/env';
import { runBrowserUseTask } from '../lib/browserUse/runTask';
import { browserUseAppStatus, callBrowserUse } from '../lib/browserUse/mcp';

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), 'utf8');
}

async function main() {
  const pkg = read('package.json');
  const envSrc = read('lib/browserUse/env.ts');
  const clientSrc = read('lib/browserUse/client.ts');
  const exampleSrc = read('scripts/browser-use-example.ts');
  const chatSrc = read('app/api/chat/route.ts');
  const catalogSrc = read('lib/mcp/catalog.ts');
  const parseComputer = read('lib/computer/parseOwnerCommand.ts');
  const runner = read('lib/computer/runner.ts');

  assert('package.json depends on browser-use-sdk', /"browser-use-sdk"/.test(pkg));
  assert('package.json has dry example script', /"browser-use:example"/.test(pkg));
  assert('client imports official v4', /from ['"]browser-use-sdk\/v4['"]/.test(clientSrc));
  assert('client reads BROWSER_USE_API_KEY', /BROWSER_USE_API_KEY/.test(envSrc) && /readBrowserUseApiKey/.test(clientSrc));
  assert(
    'env never consoles the key',
    !/console\.(log|info|debug|warn|error)\([^)]*API_KEY/.test(envSrc) &&
      !/console\.(log|info|debug|warn|error)\([^)]*apiKey/.test(clientSrc),
  );
  assert('example documents official create+wait loop', /runs\.create/.test(exampleSrc) && /waitForCompletion/.test(exampleSrc));
  assert('example default is dry', /process\.argv\.includes\('--live'\)/.test(exampleSrc));

  assert('status parse', parseOwnerBrowseCommand('browser use status')?.kind === 'status');
  assert('browse: parse', parseOwnerBrowseCommand('browse: open example.com')?.kind === 'prepare');
  const url = parseOwnerBrowseCommand('browse https://example.com');
  assert(
    'browse url parse',
    url?.kind === 'prepare' && url.task.includes('https://example.com'),
    url && url.kind === 'prepare' ? url.task : 'no task',
  );
  assert(
    'screenshot phrases go to Browser Use prepare',
    parseOwnerBrowseCommand('take screenshots of /daily mobile')?.kind === 'prepare',
  );
  assert('ordinary question is not a browse command', parseOwnerBrowseCommand('what did she write about Centaur?') === null);
  assert('open browser opens the window status', parseOwnerBrowseCommand('open browser')?.kind === 'status');
  const host = parseOwnerBrowseCommand('browse example.com');
  assert(
    'browse host parse',
    host?.kind === 'prepare' && host.task.includes('example.com'),
    host && host.kind === 'prepare' ? host.task : 'no task',
  );

  const poison = 'bu_this_is_not_a_real_key_do_not_print';
  const prevKey = process.env.BROWSER_USE_API_KEY;
  const prevLive = process.env.BROWSER_USE_LIVE;
  process.env.BROWSER_USE_API_KEY = poison;
  process.env.BROWSER_USE_LIVE = '';
  const spoken = formatBrowserUseSpoken(browserUseStatus('Find the top Hacker News story'));
  assert('status reports key present without leaking it', hasBrowserUseApiKey() && spoken.includes('Key: present.') && !spoken.includes(poison));
  assert('status spoken is dry', /Dry-run/.test(spoken) && /no cloud browser started/.test(spoken));
  assert('live flag off', isBrowserUseLiveEnabled() === false);

  const dryRun = await runBrowserUseTask('Find the top Hacker News story', { live: false });
  assert('runTask without live does not bill', 'blocked' in dryRun && dryRun.blocked && dryRun.billed === false);

  const mcp = browserUseAppStatus();
  assert('mcp app is browser-use', mcp.name === 'browser-use');
  const prepared = await callBrowserUse('prepare', { task: 'Open https://example.com' });
  assert('mcp prepare is dry json', prepared.ok && /"billed":false/.test(prepared.text) && /"api":"v4"/.test(prepared.text));
  const runBlocked = await callBrowserUse('run', { task: 'x' });
  assert('mcp run stays blocked', runBlocked.blocked === true);

  if (prevKey === undefined) delete process.env.BROWSER_USE_API_KEY;
  else process.env.BROWSER_USE_API_KEY = prevKey;
  if (prevLive === undefined) delete process.env.BROWSER_USE_LIVE;
  else process.env.BROWSER_USE_LIVE = prevLive;

  const browseIdx = chatSrc.indexOf('tryOwnerBrowserUseFastPath');
  const computerIdx = chatSrc.indexOf('tryOwnerComputerFastPath');
  assert('chat imports Browser Use fast path', browseIdx !== -1);
  assert('chat runs Browser Use before Cloudflare computer', browseIdx !== -1 && computerIdx !== -1 && browseIdx < computerIdx);
  assert('chat exposes owner browseWeb', /browseWeb:\s*tool\(/.test(chatSrc));
  const appsBlock = catalogSrc.slice(catalogSrc.indexOf('const apps'));
  assert(
    'mcp catalog lists browser-use first',
    appsBlock.indexOf('browserUseAppStatus()') !== -1 &&
      appsBlock.indexOf('browserUseAppStatus()') < appsBlock.indexOf("name: 'computer'"),
  );
  assert(
    'cloudflare screenshot path stays blocked / no fake shots',
    /No fake screenshots/.test(parseComputer) && /No fake screenshots/.test(runner),
  );
  assert('cloudflare runner points browse at Browser Use', /Browser Use Cloud/.test(runner));

  const agentChatSrc = read('components/AgentChat.tsx');
  const windowSrc = read('components/BrowserUseWindow.tsx');
  const iconSrc = read('components/BrowserUseIcon.tsx');
  const apiSrc = read('app/api/agent/browser-use/route.ts');
  assert('browse window component exists', /data-testid="browser-use-window"/.test(windowSrc));
  assert('corresponding browse icon exists', /viewBox="0 0 14 12"/.test(iconSrc));
  assert('status API never creates a run', /prepareBrowseResult/.test(apiSrc) && !/runs\.create/.test(apiSrc));
  assert(
    'AgentChat has browse toggle + voice icon + site leftover',
    /browse-mode-toggle/.test(agentChatSrc) &&
      /browser-use-voice-icon/.test(agentChatSrc) &&
      /browser-use-site-icon/.test(agentChatSrc),
  );
  assert(
    'Browser Use window is a sibling of Console, not the computer dock',
    agentChatSrc.indexOf('<BrowserUseWindow') !== -1 &&
      agentChatSrc.indexOf('<BrowserUseWindow') < agentChatSrc.indexOf('aria-label="Aileena Console"') &&
      !/ComputerConsoleDock[\s\S]{0,80}BrowserUseWindow/.test(agentChatSrc),
  );
  assert('voice/browse click-through opens the window', /parseOwnerBrowseCommand/.test(agentChatSrc) && /setBrowseMode\(true\)/.test(agentChatSrc));
  assert(
    'Cloudflare desk is a packed chart above voice, browser aside',
    /CloudflareDeskChart/.test(agentChatSrc) &&
      agentChatSrc.indexOf('<CloudflareDeskChart') < agentChatSrc.indexOf('<AgentVoiceOrb') &&
      !/aside=\{/.test(agentChatSrc) &&
      /data-browser="aside"/.test(read('components/CloudflareDeskChart.tsx')),
  );

  const failed = checks.filter((c) => !c.ok);
  console.log(`\nResult: ${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
