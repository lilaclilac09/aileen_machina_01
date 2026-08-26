import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';

/** Immediate site-agent reply. Does not wait for the computer worker. */
export function queuedChatResponse(text: string, extraHeaders: Record<string, string> = {}): Response {
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const id = 'computer-fast';
      writer.write({ type: 'text-start', id });
      writer.write({ type: 'text-delta', id, delta: text });
      writer.write({ type: 'text-end', id });
    },
  });
  return createUIMessageStreamResponse({
    stream,
    headers: {
      'X-Computer-Fast-Path': '1',
      'X-Computer-Backend': 'local-shim',
      ...extraHeaders,
    },
  });
}
