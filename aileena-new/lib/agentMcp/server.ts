/**
 * Public agent-to-agent MCP server (Streamable HTTP, stateless, JSON responses).
 * Agent callers are public visitors: the ask tool runs the same chat handler
 * with the same input/output guards, forced to public mode. Council, owner and
 * private second-brain content are not reachable from here.
 */
import { lookupProjects, type PublicProject } from './projects';

export const MCP_SERVER_INFO = { name: 'aileena-site-agent', title: "Aileen's site agent", version: '1.0.0' };
export const SUPPORTED_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
export const MAX_QUESTION_CHARS = 1500;

export const MCP_INSTRUCTIONS =
  "Public agent for aileena.xyz (Aileen Choo: Solana/MEV research, security tools, AI infra writing, DJ sets). " +
  'Use ask_aileen_agent for questions about her public work and lookup_project for structured project links. ' +
  'Public mode only: owner, council and private notes are not available. Rate limited per caller.';

export const MCP_TOOLS = [
  {
    name: 'ask_aileen_agent',
    title: "Ask Aileen's site agent",
    description:
      "Ask the public site agent of aileena.xyz a question about Aileen Choo's public work (projects, writing, music, AI infra notes). " +
      'Same guards as the website console. Public mode only. Answers may be in the language of the question.',
    inputSchema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'The question, plain text.', maxLength: MAX_QUESTION_CHARS },
      },
      required: ['question'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'lookup_project',
    title: 'Look up a project',
    description:
      'Find one of Aileen\'s public projects or tools by name or keyword (e.g. "tamper check", "keyshield", "mev"). Returns title, stack, summary and links. Use "all" to list everything.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Project name or keyword, or "all".' },
        limit: { type: 'integer', minimum: 1, maximum: 20, default: 5 },
      },
      required: ['query'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
] as const;

export type JsonRpcRequest = { jsonrpc: '2.0'; id?: string | number | null; method: string; params?: Record<string, unknown> };
export type JsonRpcResponse =
  | { jsonrpc: '2.0'; id: string | number | null; result: unknown }
  | { jsonrpc: '2.0'; id: string | number | null; error: { code: number; message: string; data?: unknown } };

export type AskResult =
  | { ok: true; text: string; traceId?: string }
  | { ok: false; status: number; error: string; retryAfterSec?: number };

export type McpDeps = {
  ask: (question: string) => Promise<AskResult>;
  rate: (kind: 'ask' | 'lookup') => Promise<{ ok: true } | { ok: false; retryAfterSec: number }>;
  onAsk?: () => void;
};

/** Argument names that try to pick a privileged mode. Refused outright. */
const PRIVILEGED_ARG = /^(agent_?mode|mode|council(_?lens)?|owner|owner_?key|session|cookie|token|auth|role|system)$/i;

function err(id: JsonRpcRequest['id'], code: number, message: string, data?: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id: id ?? null, error: data === undefined ? { code, message } : { code, message, data } };
}

function toolError(text: string, extra?: Record<string, unknown>) {
  return { content: [{ type: 'text', text }], isError: true, ...(extra ? { structuredContent: extra } : {}) };
}

function projectText(ps: PublicProject[]): string {
  if (!ps.length) return 'No matching public project. Try "all".';
  return ps.map((p) => `${p.title} (${p.stack}) — ${p.summary}\n${p.links.join('\n')}`).join('\n\n');
}

export async function handleMcpMessage(msg: JsonRpcRequest, deps: McpDeps): Promise<JsonRpcResponse | null> {
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    return err(msg?.id ?? null, -32600, 'Invalid Request');
  }
  const isNotification = msg.id === undefined;
  const params = (msg.params ?? {}) as Record<string, unknown>;

  switch (msg.method) {
    case 'initialize': {
      const requested = typeof params.protocolVersion === 'string' ? params.protocolVersion : '';
      const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requested) ? requested : SUPPORTED_PROTOCOL_VERSIONS[1];
      return {
        jsonrpc: '2.0',
        id: msg.id ?? null,
        result: {
          protocolVersion,
          capabilities: { tools: { listChanged: false } },
          serverInfo: MCP_SERVER_INFO,
          instructions: MCP_INSTRUCTIONS,
        },
      };
    }
    case 'ping':
      return isNotification ? null : { jsonrpc: '2.0', id: msg.id ?? null, result: {} };
    case 'tools/list':
      return { jsonrpc: '2.0', id: msg.id ?? null, result: { tools: MCP_TOOLS } };
    case 'tools/call': {
      const name = params.name;
      const args = (params.arguments ?? {}) as Record<string, unknown>;
      if (typeof args !== 'object' || Array.isArray(args)) return err(msg.id, -32602, 'arguments must be an object');
      const privileged = Object.keys(args).filter((k) => PRIVILEGED_ARG.test(k));
      if (privileged.length) {
        return {
          jsonrpc: '2.0',
          id: msg.id ?? null,
          result: toolError(
            'Agent callers get public mode only. Council, owner and private modes are not available over MCP.',
            { refused: 'privileged_mode', fields: privileged },
          ),
        };
      }
      if (name === 'ask_aileen_agent') {
        const q = typeof args.question === 'string' ? args.question.trim() : '';
        if (!q) return err(msg.id, -32602, 'question is required');
        if (q.length > MAX_QUESTION_CHARS) return err(msg.id, -32602, `question is longer than ${MAX_QUESTION_CHARS} characters`);
        const rl = await deps.rate('ask');
        if (!rl.ok) {
          return {
            jsonrpc: '2.0',
            id: msg.id ?? null,
            result: toolError(`Rate limited. Try again in ${rl.retryAfterSec}s.`, { rateLimited: true, retryAfterSec: rl.retryAfterSec }),
          };
        }
        deps.onAsk?.();
        const r = await deps.ask(q);
        if (!r.ok) {
          return {
            jsonrpc: '2.0',
            id: msg.id ?? null,
            result: toolError(r.error, { status: r.status, ...(r.retryAfterSec ? { retryAfterSec: r.retryAfterSec } : {}) }),
          };
        }
        return {
          jsonrpc: '2.0',
          id: msg.id ?? null,
          result: {
            content: [{ type: 'text', text: r.text }],
            structuredContent: { answer: r.text, mode: 'public', ...(r.traceId ? { traceId: r.traceId } : {}) },
          },
        };
      }
      if (name === 'lookup_project') {
        const q = typeof args.query === 'string' ? args.query : '';
        const limit = typeof args.limit === 'number' ? Math.min(20, Math.max(1, Math.floor(args.limit))) : 5;
        const rl = await deps.rate('lookup');
        if (!rl.ok) {
          return { jsonrpc: '2.0', id: msg.id ?? null, result: toolError(`Rate limited. Try again in ${rl.retryAfterSec}s.`, { rateLimited: true }) };
        }
        const projects = lookupProjects(q, limit);
        return {
          jsonrpc: '2.0',
          id: msg.id ?? null,
          result: { content: [{ type: 'text', text: projectText(projects) }], structuredContent: { projects } },
        };
      }
      return err(msg.id, -32602, `Unknown tool: ${String(name)}`);
    }
    default:
      if (msg.method.startsWith('notifications/')) return null;
      return isNotification ? null : err(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

/** Collect the text of an AI SDK UI message stream (SSE) response. */
export async function collectUiStreamText(res: Response): Promise<string> {
  const raw = await res.text();
  let text = '';
  for (const line of raw.split('\n')) {
    if (!line.startsWith('data:')) continue;
    const data = line.slice(5).trim();
    if (!data || data === '[DONE]') continue;
    try {
      const ev = JSON.parse(data) as { type?: string; delta?: string; errorText?: string };
      if (ev.type === 'text-delta' && typeof ev.delta === 'string') text += ev.delta;
    } catch {
      /* skip */
    }
  }
  return text.trim();
}
