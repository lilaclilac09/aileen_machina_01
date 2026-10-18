/**
 * Public agent-to-agent MCP server (Streamable HTTP, stateless, JSON responses).
 * Agent callers are public visitors: the ask tool runs the same chat handler
 * with the same input/output guards, forced to public mode. Council, owner and
 * private second-brain content are not reachable from here.
 */
import { lookupProjects, type PublicProject } from './projects';
import type { PatchInput, PatchResult } from '../codeAgent/patch';

export const MCP_SERVER_INFO = { name: 'aileena-site-agent', title: "Aileen's site agent", version: '1.0.0' };
export const SUPPORTED_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
export const MAX_QUESTION_CHARS = 1500;

export const MCP_INSTRUCTIONS =
  "Public agent for aileena.xyz (Aileen Choo: Solana/MEV research, security tools, AI infra writing, DJ sets). " +
  'Use ask_aileen_agent for questions about her public work and lookup_project for structured project links. ' +
  'Public mode only: owner, council and private notes are not available. Rate limited per caller. ' +
  'For code: suggest_patch takes a task plus the file contents and returns unified diffs and full new file contents. It has no repo access; ' +
  'pair it with the GitHub MCP server (get_file_contents to fetch files, then create_branch, push_files and create_pull_request with your own credentials) and open a PR, never push to the default branch.';

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
  {
    name: 'suggest_patch',
    title: 'Suggest a code patch',
    description:
      "Machina's code-editing loop (read_file / list_files / search_files / edit_file, ported from github.com/lilaclilac09/aileena-code) run over the files you send. " +
      'Returns a summary, unified diffs and the full new content of each changed file. No repo access and no writes: apply the result yourself, ' +
      'e.g. with the GitHub MCP server (create_branch, push_files, create_pull_request). File contents are treated as untrusted data. ' +
      'Limits: 20 files, 200 KB total; .env files, keys, secrets and CI workflows are skipped.',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'What to change, plain text.', maxLength: 2000 },
        files: {
          type: 'array',
          maxItems: 20,
          description: 'The files the change needs, with repo-relative paths.',
          items: {
            type: 'object',
            properties: { path: { type: 'string' }, content: { type: 'string' } },
            required: ['path', 'content'],
            additionalProperties: false,
          },
        },
        repo: { type: 'string', description: 'Optional owner/repo label, for context only.' },
      },
      required: ['task', 'files'],
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
  rate: (kind: 'ask' | 'lookup' | 'patch') => Promise<{ ok: true } | { ok: false; retryAfterSec: number }>;
  /** suggest_patch backend. Absent → the tool reports it is unavailable. */
  patch?: (input: PatchInput) => Promise<PatchResult>;
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
      if (name === 'suggest_patch') {
        if (!deps.patch) return { jsonrpc: '2.0', id: msg.id ?? null, result: toolError('suggest_patch is not available on this server.') };
        const task = typeof args.task === 'string' ? args.task : '';
        if (!task.trim()) return err(msg.id, -32602, 'task is required');
        if (!Array.isArray(args.files)) return err(msg.id, -32602, 'files must be an array of { path, content }');
        const rl = await deps.rate('patch');
        if (!rl.ok) {
          return { jsonrpc: '2.0', id: msg.id ?? null, result: toolError(`Rate limited. Try again in ${rl.retryAfterSec}s.`, { rateLimited: true, retryAfterSec: rl.retryAfterSec }) };
        }
        const r = await deps.patch({ task, files: args.files as PatchInput['files'], repo: typeof args.repo === 'string' ? args.repo : undefined });
        if (!r.ok) return { jsonrpc: '2.0', id: msg.id ?? null, result: toolError(r.error) };
        const text = [
          r.summary || (r.changes.length ? 'Patch ready.' : 'No changes suggested.'),
          ...r.changes.map((c) => `\n${c.diff}`),
          ...(r.skipped.length ? [`\nSkipped: ${r.skipped.map((x) => `${x.path} (${x.reason})`).join('; ')}`] : []),
          r.changes.length ? '\nApply on a new branch and open a pull request; do not push to the default branch.' : '',
        ].join('\n');
        return {
          jsonrpc: '2.0',
          id: msg.id ?? null,
          result: { content: [{ type: 'text', text }], structuredContent: { status: r.status, summary: r.summary, changes: r.changes, skipped: r.skipped } },
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
