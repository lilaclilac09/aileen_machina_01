import { BrowserUse } from 'browser-use-sdk/v4';
import { readBrowserUseApiKey } from './env';

/**
 * Official Cloud API v4 client. Reads BROWSER_USE_API_KEY.
 * Do not import this from the public chat bundle unless starting a run.
 */
export function createBrowserUseClient(): BrowserUse {
  const apiKey = readBrowserUseApiKey();
  if (!apiKey) {
    throw new Error('BROWSER_USE_API_KEY is not set');
  }
  return new BrowserUse({ apiKey });
}
