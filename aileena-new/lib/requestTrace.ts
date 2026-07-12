/**
 * Per-request trace for the site agent (edge-safe, log-based).
 * No Datadog required — Vercel logs + response headers are enough for v0.5.
 */

export type TraceSpan = {
  name: string;
  startedAt: number;
  endedAt?: number;
  ms?: number;
  ok?: boolean;
  meta?: Record<string, unknown>;
};

export type RequestTrace = {
  traceId: string;
  startedAt: number;
  spans: TraceSpan[];
  startSpan: (name: string, meta?: Record<string, unknown>) => TraceSpan;
  endSpan: (span: TraceSpan, ok?: boolean, meta?: Record<string, unknown>) => void;
  log: (event: string, extra?: Record<string, unknown>) => void;
  summary: () => {
    traceId: string;
    totalMs: number;
    spans: Array<{ name: string; ms: number; ok?: boolean; meta?: Record<string, unknown> }>;
  };
};

function newId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID().replace(/-/g, '').slice(0, 16);
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function createRequestTrace(incoming?: string | null): RequestTrace {
  const traceId =
    incoming && /^[a-zA-Z0-9_-]{8,64}$/.test(incoming) ? incoming : newId();
  const startedAt = Date.now();
  const spans: TraceSpan[] = [];

  return {
    traceId,
    startedAt,
    spans,
    startSpan(name, meta) {
      const span: TraceSpan = { name, startedAt: Date.now(), meta };
      spans.push(span);
      return span;
    },
    endSpan(span, ok = true, meta) {
      span.endedAt = Date.now();
      span.ms = span.endedAt - span.startedAt;
      span.ok = ok;
      if (meta) span.meta = { ...span.meta, ...meta };
    },
    log(event, extra) {
      console.log('[chat][trace]', {
        traceId,
        event,
        t: Date.now() - startedAt,
        ...extra,
      });
    },
    summary() {
      return {
        traceId,
        totalMs: Date.now() - startedAt,
        spans: spans.map((s) => ({
          name: s.name,
          ms: s.ms ?? (Date.now() - s.startedAt),
          ok: s.ok,
          meta: s.meta,
        })),
      };
    },
  };
}
