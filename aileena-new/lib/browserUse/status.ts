import { hasBrowserUseApiKey, isBrowserUseLiveEnabled, keyPresentLabel } from './env';

export type BrowserUseStatus = {
  api: 'v4';
  sdk: 'browser-use-sdk/v4';
  key: 'present' | 'missing';
  live: boolean;
  dryRun: true;
  billed: false;
  cloudflareBrowser: 'aside';
  wouldRunTask: string | null;
};

export function browserUseStatus(task?: string): BrowserUseStatus {
  const trimmed = (task ?? '').trim().slice(0, 4000);
  return {
    api: 'v4',
    sdk: 'browser-use-sdk/v4',
    key: keyPresentLabel(),
    live: isBrowserUseLiveEnabled(),
    dryRun: true,
    billed: false,
    cloudflareBrowser: 'aside',
    wouldRunTask: trimmed || null,
  };
}

export function formatBrowserUseSpoken(status: BrowserUseStatus): string {
  const task = status.wouldRunTask ? ` Task would be: ${status.wouldRunTask}` : '';
  const live = status.live ? 'Live flag is on — still dry here until you confirm a paid run.' : 'Live flag is off.';
  const key = hasBrowserUseApiKey() ? 'Key: present.' : 'Key: missing.';
  return `⚡ Browser Use Cloud API v4 is wired. Dry-run — no cloud browser started. ${key} ${live} Cloudflare computer is not the browser.${task}`;
}

export function prepareBrowseResult(task?: string): BrowserUseStatus {
  return browserUseStatus(task);
}
