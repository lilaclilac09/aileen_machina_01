/**
 * Cancellable TTS chunk queue. One session id; stale chunks never play.
 */

import { pauseAfterChunkMs } from './chunkText';

export type TtsUiStatus =
  | 'idle'
  | 'generating'
  | 'queued'
  | 'playing'
  | 'paused'
  | 'interrupted'
  | 'error'
  | 'complete';

export const TTS_UI = {
  failed: '⚡ Voice failed.',
  busy: '⚡ Voice busy.',
  stopped: '⚡ Stopped.',
} as const;

export type TtsFetchResult =
  | { ok: true; buf: ArrayBuffer }
  | { ok: false; status: number };

export function ttsHintForStatus(status: number): string {
  if (status === 429) return TTS_UI.busy;
  return TTS_UI.failed;
}

export function shouldRetryTtsStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 0;
}

export async function waitAbortable(ms: number, signal: AbortSignal): Promise<void> {
  if (ms <= 0 || signal.aborted) return;
  await new Promise<void>((resolve) => {
    const t = setTimeout(finish, ms);
    function finish() {
      clearTimeout(t);
      signal.removeEventListener('abort', finish);
      resolve();
    }
    signal.addEventListener('abort', finish, { once: true });
  });
}

export async function runTtsQueue(opts: {
  chunks: string[];
  signal: AbortSignal;
  isCurrent: () => boolean;
  fetchChunk: (text: string, signal: AbortSignal) => Promise<TtsFetchResult>;
  playBuf: (buf: ArrayBuffer) => Promise<void>;
  onStatus: (status: TtsUiStatus, hint?: string) => void;
}): Promise<'complete' | 'interrupted' | 'error'> {
  const { chunks, signal, isCurrent, fetchChunk, playBuf, onStatus } = opts;

  const alive = () => isCurrent() && !signal.aborted;
  if (!chunks.length) {
    onStatus('complete');
    return 'complete';
  }

  const fetchWithRetry = async (text: string): Promise<TtsFetchResult> => {
    const first = await fetchChunk(text, signal);
    if (first.ok || !alive()) return first;
    if (!shouldRetryTtsStatus(first.status)) return first;
    if (first.status === 429) onStatus('queued', TTS_UI.busy);
    await waitAbortable(first.status === 429 ? 700 : 280, signal);
    if (!alive()) return first;
    return fetchChunk(text, signal);
  };

  onStatus('generating');
  let pending = fetchWithRetry(chunks[0]);

  for (let i = 0; i < chunks.length; i++) {
    if (!alive()) {
      onStatus('interrupted', TTS_UI.stopped);
      return 'interrupted';
    }
    if (i > 0) onStatus('queued');
    const nextPromise = i + 1 < chunks.length ? fetchWithRetry(chunks[i + 1]) : null;
    const result = await pending;
    pending = nextPromise ?? Promise.resolve({ ok: true, buf: new ArrayBuffer(0) });

    if (!alive()) {
      onStatus('interrupted', TTS_UI.stopped);
      return 'interrupted';
    }
    if (!result.ok) {
      onStatus('error', ttsHintForStatus(result.status));
      if (i === 0) return 'error';
      continue;
    }
    onStatus('playing');
    await playBuf(result.buf);
    if (!alive()) {
      onStatus('interrupted', TTS_UI.stopped);
      return 'interrupted';
    }
    await waitAbortable(pauseAfterChunkMs(chunks[i], i >= chunks.length - 1), signal);
  }

  if (!alive()) {
    onStatus('interrupted', TTS_UI.stopped);
    return 'interrupted';
  }
  onStatus('complete');
  return 'complete';
}
