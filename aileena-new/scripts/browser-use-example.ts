#!/usr/bin/env tsx
/**
 * Official Browser Use Cloud API v4 example.
 *
 * Dry (default — no billed call):
 *   cd aileena-new && pnpm browser-use:example
 *
 * Live (paid — only after you confirm):
 *   BROWSER_USE_LIVE=1 pnpm browser-use:example -- --live
 *
 * Reads BROWSER_USE_API_KEY from the environment. Never prints the key.
 *
 * Official shape (https://docs.browser-use.com/cloud/agent/quickstart.md):
 *   import { BrowserUse } from "browser-use-sdk/v4";
 *   const client = new BrowserUse();
 *   const run = await client.runs.create({ task: "Find the top Hacker News story" });
 *   const result = await client.runs.waitForCompletion(run.id);
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runBrowserUseTask } from '../lib/browserUse/runTask';
import { browserUseStatus, formatBrowserUseSpoken } from '../lib/browserUse/status';

const OFFICIAL_TASK = 'Find the top Hacker News story';

function loadEnvLocal() {
  const p = join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

async function main() {
  loadEnvLocal();
  const live = process.argv.includes('--live');
  const status = browserUseStatus(OFFICIAL_TASK);

  console.log(formatBrowserUseSpoken(status));
  console.log(JSON.stringify({ ...status, argvLive: live }, null, 2));

  if (!live) {
    console.log('\nHow to run (dry): cd aileena-new && pnpm browser-use:example');
    console.log('How to run (paid, after confirm): BROWSER_USE_LIVE=1 pnpm browser-use:example -- --live');
    return;
  }

  const result = await runBrowserUseTask(OFFICIAL_TASK, { live: true });
  if ('blocked' in result && result.blocked) {
    console.error(result.reason);
    process.exit(2);
  }
  if (result.billed) {
    console.log(JSON.stringify({ runId: result.runId, status: result.status, result: result.result }, null, 2));
  }
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : 'example failed';
  console.error(message.includes('BROWSER_USE_API_KEY') ? 'BROWSER_USE_API_KEY is not set' : message);
  process.exit(1);
});
