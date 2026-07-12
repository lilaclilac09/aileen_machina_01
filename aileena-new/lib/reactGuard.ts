/**
 * ReAct R1 guards for the site agent:
 * - duplicate tool+args circuit breaker (same call twice in one turn → block)
 * - observation truncation (cap hits / string length)
 * - per-request audit log + stop reason
 *
 * Stateless helpers + one session object per chat POST.
 */

export const REACT_MAX_STEPS = 4;
export const REACT_MAX_HITS = 3;
export const REACT_MAX_SNIPPET_CHARS = 180;
export const REACT_MAX_OBS_CHARS = 2400;

export type ReactStopReason =
  | 'max_steps'
  | 'duplicate_tool'
  | 'empty_recall'
  | 'tool_error'
  | 'model_finish'
  | 'unknown';

export type ReactToolCallRecord = {
  step: number;
  tool: string;
  argsKey: string;
  blocked: boolean;
  empty: boolean;
  error?: string;
  obsChars: number;
};

export type ReactAudit = {
  calls: ReactToolCallRecord[];
  stopReasons: ReactStopReason[];
  duplicateBlocks: number;
  emptyRecalls: number;
  toolErrors: number;
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

export function fingerprintToolCall(tool: string, args: unknown): string {
  return `${tool}::${stableStringify(args ?? {})}`;
}

function truncateString(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

/**
 * Shrink tool observations before they re-enter the model context.
 * Arrays of hit-like objects keep top N with clipped snippets.
 */
export function truncateObservation(raw: unknown): unknown {
  if (raw == null) return raw;

  if (typeof raw === 'string') {
    return truncateString(raw, REACT_MAX_OBS_CHARS);
  }

  if (Array.isArray(raw)) {
    const clipped = raw.slice(0, REACT_MAX_HITS).map((item) => {
      if (!item || typeof item !== 'object') return item;
      const o = { ...(item as Record<string, unknown>) };
      if (typeof o.snippet === 'string') {
        o.snippet = truncateString(o.snippet, REACT_MAX_SNIPPET_CHARS);
      }
      if (typeof o.text === 'string') {
        o.text = truncateString(o.text, REACT_MAX_SNIPPET_CHARS);
      }
      if (typeof o.summary === 'string') {
        o.summary = truncateString(o.summary, REACT_MAX_SNIPPET_CHARS);
      }
      return o;
    });
    return clipped;
  }

  if (typeof raw === 'object') {
    const o = { ...(raw as Record<string, unknown>) };
    if (Array.isArray(o.items)) {
      o.items = truncateObservation(o.items);
      if (typeof o.count === 'number') o.count = (o.items as unknown[]).length;
    }
    if (Array.isArray(o.hits)) o.hits = truncateObservation(o.hits);
    if (Array.isArray(o.points)) o.points = (o.points as unknown[]).slice(0, REACT_MAX_HITS);
    if (typeof o.snippet === 'string') o.snippet = truncateString(o.snippet, REACT_MAX_SNIPPET_CHARS);
    if (typeof o.message === 'string') o.message = truncateString(o.message, 400);
    const json = JSON.stringify(o);
    if (json.length > REACT_MAX_OBS_CHARS) {
      return {
        truncated: true,
        note: 'Observation clipped for context budget — answer from what remains or say data was too large.',
        preview: truncateString(json, REACT_MAX_OBS_CHARS - 120),
      };
    }
    return o;
  }

  return raw;
}

export function isEmptyObservation(obs: unknown): boolean {
  if (obs == null) return true;
  if (Array.isArray(obs)) return obs.length === 0;
  if (typeof obs === 'object') {
    const o = obs as Record<string, unknown>;
    if (o.found === false) return true;
    if (typeof o.count === 'number' && o.count === 0) return true;
    if (Array.isArray(o.items) && o.items.length === 0) return true;
    if (Array.isArray(o.hits) && o.hits.length === 0) return true;
    if (o.blocked === true) return false;
  }
  return false;
}

export type ReactGuardSession = {
  beforeCall: (
    tool: string,
    args: unknown,
  ) => { allowed: true } | { allowed: false; observation: Record<string, unknown> };
  afterCall: (tool: string, args: unknown, raw: unknown) => unknown;
  afterError: (tool: string, args: unknown, err: unknown) => Record<string, unknown>;
  noteStop: (reason: ReactStopReason) => void;
  summary: () => ReactAudit & { stopReasonPrimary: ReactStopReason };
};

export function createReactGuardSession(): ReactGuardSession {
  const seen = new Map<string, number>();
  const audit: ReactAudit = {
    calls: [],
    stopReasons: [],
    duplicateBlocks: 0,
    emptyRecalls: 0,
    toolErrors: 0,
  };
  let step = 0;

  const record = (row: Omit<ReactToolCallRecord, 'step'>) => {
    step += 1;
    audit.calls.push({ step, ...row });
  };

  return {
    beforeCall(tool, args) {
      const key = fingerprintToolCall(tool, args);
      const count = seen.get(key) ?? 0;

      // Block identical tool+args already run this turn (circuit breaker).
      if (count >= 1) {
        audit.duplicateBlocks += 1;
        record({
          tool,
          argsKey: key,
          blocked: true,
          empty: false,
          obsChars: 0,
        });
        audit.stopReasons.push('duplicate_tool');
        return {
          allowed: false as const,
          observation: {
            blocked: true,
            reason: 'duplicate_tool',
            message:
              'Same tool with the same arguments was already called this turn. Do not retry. Answer from prior observations, try a different tool/query, or say you lack enough evidence.',
            tool,
          },
        };
      }

      seen.set(key, count + 1);
      return { allowed: true as const };
    },

    afterCall(tool, args, raw) {
      const key = fingerprintToolCall(tool, args);
      const truncated = truncateObservation(raw);
      const empty = isEmptyObservation(truncated);
      if (empty) {
        audit.emptyRecalls += 1;
        audit.stopReasons.push('empty_recall');
      }
      const obsChars = JSON.stringify(truncated).length;
      record({ tool, argsKey: key, blocked: false, empty, obsChars });
      return truncated;
    },

    afterError(tool, args, err) {
      const key = fingerprintToolCall(tool, args);
      const message = err instanceof Error ? err.message : String(err);
      audit.toolErrors += 1;
      audit.stopReasons.push('tool_error');
      record({
        tool,
        argsKey: key,
        blocked: false,
        empty: true,
        error: message.slice(0, 200),
        obsChars: 0,
      });
      return {
        error: true,
        tool,
        message: 'Tool failed. Do not invent data — say the lookup failed and offer the closest alternative.',
        detail: message.slice(0, 200),
      };
    },

    noteStop(reason) {
      audit.stopReasons.push(reason);
    },

    summary() {
      const primary: ReactStopReason =
        audit.duplicateBlocks > 0
          ? 'duplicate_tool'
          : audit.toolErrors > 0
            ? 'tool_error'
            : audit.calls.length >= REACT_MAX_STEPS
              ? 'max_steps'
              : audit.stopReasons.includes('model_finish')
                ? 'model_finish'
                : audit.stopReasons[audit.stopReasons.length - 1] ?? 'unknown';
      return { ...audit, stopReasonPrimary: primary };
    },
  };
}

type AnyTool = {
  execute?: (...args: never[]) => unknown;
  [key: string]: unknown;
};

/**
 * Wrap a tools map so every execute goes through the guard.
 * Preserves description / inputSchema / other tool fields.
 */
export function wrapToolsWithReactGuard<T extends Record<string, AnyTool>>(
  tools: T,
  session: ReactGuardSession,
): T {
  const out: Record<string, AnyTool> = {};
  for (const [name, t] of Object.entries(tools)) {
    const original = t?.execute;
    if (typeof original !== 'function') {
      out[name] = t;
      continue;
    }
    out[name] = {
      ...t,
      execute: async (args: unknown, opts: unknown) => {
        const gate = session.beforeCall(name, args);
        if (!gate.allowed) return gate.observation;
        try {
          // AI SDK may pass (args) or (args, options)
          const raw = await (original as (a: unknown, o?: unknown) => Promise<unknown>).call(
            t,
            args,
            opts,
          );
          return session.afterCall(name, args, raw);
        } catch (err) {
          return session.afterError(name, args, err);
        }
      },
    };
  }
  return out as T;
}
