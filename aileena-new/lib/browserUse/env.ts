/**
 * Browser Use Cloud env. Server-only.
 * Never log, print, or return the key value.
 */

const LIVE_TRUE = new Set(['1', 'true', 'yes', 'on']);

export function readBrowserUseApiKey(): string {
  return (process.env.BROWSER_USE_API_KEY ?? '').trim();
}

export function hasBrowserUseApiKey(): boolean {
  return readBrowserUseApiKey().length > 0;
}

export function isBrowserUseLiveEnabled(): boolean {
  return LIVE_TRUE.has((process.env.BROWSER_USE_LIVE ?? '').trim().toLowerCase());
}

export function keyPresentLabel(): 'present' | 'missing' {
  return hasBrowserUseApiKey() ? 'present' : 'missing';
}
