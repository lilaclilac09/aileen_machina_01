/**
 * Thin wrapper over the Chrome Prompt API (a.k.a. "Built-in AI" /
 * Gemini Nano on-device).
 *
 * Chrome 138+ exposes `window.LanguageModel`. We feature-detect it,
 * surface an availability state to the UI, and wrap session creation and
 * streaming so the rest of the codebase doesn't need to deal with the raw
 * API shape (which is not yet in lib.dom.d.ts).
 *
 * If the API is unavailable for any reason — wrong browser, hardware
 * insufficient, model not downloaded — every function returns a safe
 * fallback value so the caller can transparently route to the server.
 */

export type Availability =
  | 'unsupported'   // browser doesn't expose window.LanguageModel
  | 'unavailable'   // browser supports the API but the model can't run here
  | 'downloadable'  // model not present yet, will download on create()
  | 'downloading'   // model is currently downloading
  | 'available';    // ready to use right now

/* ── Minimal type shape for the unstable API ───────────────────────── */

interface DownloadProgressEvent extends Event {
  loaded: number;
}

interface LanguageModelMonitor {
  addEventListener(
    type: 'downloadprogress',
    listener: (e: DownloadProgressEvent) => void,
  ): void;
}

interface InitialPrompt {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CreateOptions {
  initialPrompts?: InitialPrompt[];
  temperature?: number;
  topK?: number;
  monitor?: (m: LanguageModelMonitor) => void;
  signal?: AbortSignal;
}

export interface BrowserSession {
  prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  promptStreaming(input: string, options?: { signal?: AbortSignal }): AsyncIterable<string>;
  destroy(): void;
  readonly tokensSoFar: number;
  readonly maxTokens: number;
}

interface LanguageModelAPI {
  availability(): Promise<Exclude<Availability, 'unsupported'>>;
  create(options?: CreateOptions): Promise<BrowserSession>;
}

declare global {
  interface Window {
    LanguageModel?: LanguageModelAPI;
  }
}

/* ── Public helpers ────────────────────────────────────────────────── */

export async function getBrowserAgentAvailability(): Promise<Availability> {
  if (typeof window === 'undefined' || !window.LanguageModel) return 'unsupported';
  try {
    return await window.LanguageModel.availability();
  } catch {
    return 'unsupported';
  }
}

export async function createBrowserSession(
  systemPrompt: string,
  options?: {
    temperature?: number;
    onDownloadProgress?: (loaded: number) => void;
    signal?: AbortSignal;
  },
): Promise<BrowserSession | null> {
  if (typeof window === 'undefined' || !window.LanguageModel) return null;
  try {
    const session = await window.LanguageModel.create({
      initialPrompts: [{ role: 'system', content: systemPrompt }],
      temperature: options?.temperature ?? 0.4,
      ...(options?.onDownloadProgress
        ? {
            monitor: (m) => {
              m.addEventListener('downloadprogress', (e) => {
                options.onDownloadProgress?.(e.loaded);
              });
            },
          }
        : {}),
      ...(options?.signal ? { signal: options.signal } : {}),
    });
    return session;
  } catch (e) {
    console.error('[browser-agent] session create failed', e);
    return null;
  }
}
