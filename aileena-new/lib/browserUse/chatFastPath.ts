import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { parseOwnerBrowseCommand } from './parseBrowseCommand';
import { browserUseStatus, formatBrowserUsePublicSpoken } from './status';

function browserUseQueuedResponse(text: string): Response {
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const id = 'browser-use-fast';
      writer.write({ type: 'text-start', id });
      writer.write({ type: 'text-delta', id, delta: text });
      writer.write({ type: 'text-end', id });
    },
  });
  return createUIMessageStreamResponse({
    stream,
    headers: {
      'X-Browser-Use-Fast-Path': '1',
      'X-Browser-Use-Dry-Run': '1',
    },
  });
}

/**
 * Anyone's browse / screenshot lines skip the Cloudflare computer.
 * Never creates a Cloud run. Spoken copy never names the API key.
 */
export function tryBrowserUseFastPath(opts: { lastQ: string }): Response | null {
  const command = parseOwnerBrowseCommand(opts.lastQ);
  if (!command) return null;

  const status = browserUseStatus(command.kind === 'prepare' ? command.task : undefined);
  return browserUseQueuedResponse(formatBrowserUsePublicSpoken(status));
}
