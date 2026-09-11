import { clip, redactSecrets } from '../computer/redact';
import type { McpCallResult, McpToolDesc } from './types';

export type RemoteMcpServer = {
  name: string;
  url: string;
  bearer?: string;
};

const RESERVED = new Set(['computer', 'github']);
const INIT_PARAMS = {
  protocolVersion: '2025-03-26',
  capabilities: {},
  clientInfo: { name: 'aileena-machina', version: '0.1.0' },
};

export function parseMcpServers(): RemoteMcpServer[] {
  const raw = (process.env.MCP_SERVERS || '').trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: RemoteMcpServer[] = [];
    for (const row of parsed.slice(0, 8)) {
      if (!row || typeof row !== 'object') continue;
      const name = String((row as { name?: unknown }).name || '')
        .trim()
        .slice(0, 40)
        .replace(/[^a-zA-Z0-9_-]/g, '');
      const url = String((row as { url?: unknown }).url || '').trim();
      if (!name || RESERVED.has(name.toLowerCase()) || !/^https:\/\//i.test(url)) continue;
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        continue;
      }
      const host = parsedUrl.hostname.toLowerCase();
      if (host === 'localhost' || host.endsWith('.local') || host === '0.0.0.0') continue;
      if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.)/.test(host)) continue;
      if (host === '::1' || host.startsWith('[')) continue;
      const bearer = String((row as { bearer?: unknown }).bearer || '').trim() || undefined;
      out.push({ name, url: parsedUrl.toString(), bearer });
    }
    return out;
  } catch {
    return [];
  }
}

type RpcEnvelope = { result?: unknown; error?: { message?: string } };

export function parseJsonRpcBody(text: string): RpcEnvelope {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('mcp empty response');
  if (trimmed.startsWith('{')) return JSON.parse(trimmed) as RpcEnvelope;
  const payloads = [...trimmed.matchAll(/^data:\s*(.+)$/gm)].map((m) => m[1]);
  for (let i = payloads.length - 1; i >= 0; i -= 1) {
    try {
      const json = JSON.parse(payloads[i] || '') as RpcEnvelope & { jsonrpc?: string };
      if (json && (json.result !== undefined || json.error || json.jsonrpc)) return json;
    } catch {
      /* next event */
    }
  }
  throw new Error('mcp response was not JSON');
}

async function postRpc(
  server: RemoteMcpServer,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string>,
): Promise<{ json: RpcEnvelope; sessionId: string | null }> {
  const res = await fetch(server.url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      'mcp-protocol-version': '2025-03-26',
      ...(server.bearer ? { Authorization: `Bearer ${server.bearer}` } : {}),
      ...extraHeaders,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`mcp ${res.status} ${clip(text, 400)}`);
  const json = parseJsonRpcBody(text);
  if (json.error?.message) throw new Error(json.error.message);
  return { json, sessionId: res.headers.get('mcp-session-id') };
}

async function rpc(server: RemoteMcpServer, method: string, params: Record<string, unknown>): Promise<unknown> {
  try {
    const init = await postRpc(
      server,
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: INIT_PARAMS },
      {},
    );
    const extra = init.sessionId ? { 'mcp-session-id': init.sessionId } : {};
    try {
      await postRpc(server, { jsonrpc: '2.0', method: 'notifications/initialized' }, extra);
    } catch {
      /* some HTTP MCP servers skip the notification */
    }
    const call = await postRpc(server, { jsonrpc: '2.0', id: 2, method, params }, extra);
    return call.json.result;
  } catch {
    const direct = await postRpc(server, { jsonrpc: '2.0', id: 1, method, params }, {});
    return direct.json.result;
  }
}

export async function listRemoteTools(server: RemoteMcpServer): Promise<McpToolDesc[]> {
  const result = (await rpc(server, 'tools/list', {})) as { tools?: Array<{ name?: string; description?: string }> };
  return (result.tools || [])
    .filter((t) => t.name)
    .slice(0, 24)
    .map((t) => ({ name: String(t.name), description: String(t.description || t.name) }));
}

export async function callRemote(
  server: RemoteMcpServer,
  tool: string,
  args: Record<string, unknown>,
): Promise<McpCallResult> {
  try {
    const result = await rpc(server, 'tools/call', { name: tool, arguments: args });
    return { ok: true, app: server.name, tool, text: clip(redactSecrets(JSON.stringify(result)), 4000) };
  } catch (err) {
    return {
      ok: false,
      app: server.name,
      tool,
      text: redactSecrets(err instanceof Error ? err.message : 'mcp call failed'),
    };
  }
}
