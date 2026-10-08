import { prepareBrowseResult, type BrowserUseStatus } from './status';
import { hasBrowserUseApiKey, isBrowserUseLiveEnabled } from './env';
import type { McpAppStatus, McpCallResult, McpToolDesc } from '../mcp/types';

const TOOLS: McpToolDesc[] = [
  { name: 'status', description: 'Cloud API v4 wiring. Never starts a browser.' },
  { name: 'prepare', description: 'Dry-run a browse task. Does not create a Cloud run.' },
];

export function browserUseTools(): McpToolDesc[] {
  return TOOLS;
}

export function browserUseReady(): { ready: boolean; reason: string } {
  if (!hasBrowserUseApiKey()) {
    return { ready: false, reason: 'needs BROWSER_USE_API_KEY' };
  }
  if (!isBrowserUseLiveEnabled()) {
    return { ready: true, reason: 'dry-run — no paid browser until BROWSER_USE_LIVE=1' };
  }
  return { ready: true, reason: 'key present; live flag on — still ask before a paid run' };
}

export function browserUseAppStatus(): McpAppStatus {
  const gate = browserUseReady();
  return {
    name: 'browser-use',
    kind: 'in-process',
    ready: gate.ready,
    reason: gate.reason,
    tools: browserUseTools(),
  };
}

export async function callBrowserUse(
  tool: string,
  args: Record<string, unknown>,
): Promise<McpCallResult> {
  if (tool === 'status') {
    return pack(prepareBrowseResult());
  }
  if (tool === 'prepare') {
    const task = String(args.task || '').trim();
    return pack(prepareBrowseResult(task || undefined));
  }
  if (tool === 'run') {
    return {
      ok: false,
      app: 'browser-use',
      tool,
      text: 'blocked. Paid Cloud runs stay off until the owner confirms. Use pnpm browser-use:example -- --live only after that.',
      blocked: true,
    };
  }
  return { ok: false, app: 'browser-use', tool, text: `unknown tool ${tool}` };
}

function pack(status: BrowserUseStatus): McpCallResult {
  return {
    ok: true,
    app: 'browser-use',
    tool: status.wouldRunTask ? 'prepare' : 'status',
    text: JSON.stringify(status),
  };
}
