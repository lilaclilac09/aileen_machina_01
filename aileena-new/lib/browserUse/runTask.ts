import { createBrowserUseClient } from './client';
import { isBrowserUseLiveEnabled } from './env';
import { browserUseStatus, type BrowserUseStatus } from './status';

export type BrowserUseRunResult =
  | (BrowserUseStatus & { blocked: true; reason: string })
  | {
      billed: true;
      dryRun: false;
      api: 'v4';
      runId: string;
      status: string;
      result: string | null;
    };

/**
 * Fail-closed. A paid Cloud run needs BROWSER_USE_LIVE=1 and live=true.
 * Site agent never calls this.
 */
export async function runBrowserUseTask(
  task: string,
  opts: { live: boolean },
): Promise<BrowserUseRunResult> {
  const trimmed = task.trim().slice(0, 4000);
  if (!trimmed) {
    return { ...browserUseStatus(), blocked: true, reason: 'task required' };
  }
  if (!opts.live || !isBrowserUseLiveEnabled()) {
    return {
      ...browserUseStatus(trimmed),
      blocked: true,
      reason: 'dry-run — BROWSER_USE_LIVE is off or --live was not passed. No cloud browser started.',
    };
  }

  const client = createBrowserUseClient();
  const run = await client.runs.create({ task: trimmed });
  const completed = await client.runs.waitForCompletion(run.id);
  return {
    billed: true,
    dryRun: false,
    api: 'v4',
    runId: run.id,
    status: completed.status,
    result: completed.result,
  };
}
