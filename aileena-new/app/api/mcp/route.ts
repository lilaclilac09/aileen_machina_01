import { POST as chatPOST } from '../chat/route';
import { markAgentCaller } from '../../../lib/agentCaller';
import { AGENT_LIMITS, takeAgentRate } from '../../../lib/agentMcp/rateLimit';
import {
  collectUiStreamText,
  handleMcpMessage,
  type AskResult,
  type JsonRpcRequest,
  type JsonRpcResponse,
} from '../../../lib/agentMcp/server';
import { clientIpTransient, countryFromRequest, dailyVisitorHash } from '../../../lib/agentEngage/visitorHash';
import { recordEngageEvent } from '../../../lib/agentEngage/store';
import { traceLine } from '../../../lib/requestTrace';
import { suggestPatch } from '../../../lib/codeAgent/patch';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id, Mcp-Protocol-Version',
};

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { ...(body === null ? {} : { 'Content-Type': 'application/json' }), 'Cache-Control': 'no-store', ...CORS, ...extra },
  });
}

/** Run one question through the public chat handler, in-process, as an agent caller. */
async function askChat(question: string, traceId: string): Promise<AskResult> {
  const chatReq = markAgentCaller(
    new Request('https://aileena.xyz/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-trace-id': traceId },
      body: JSON.stringify({
        agentMode: 'public',
        messages: [{ id: `mcp-${traceId}`, role: 'user', parts: [{ type: 'text', text: question }] }],
      }),
    }),
  );
  const res = await chatPOST(chatReq);
  if (!res.ok) {
    let error = `Agent unavailable (${res.status}).`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j?.error) error = j.error;
    } catch {
      /* ignore */
    }
    return { ok: false, status: res.status, error };
  }
  const text = await collectUiStreamText(res);
  return text ? { ok: true, text, traceId: res.headers.get('x-trace-id') ?? traceId } : { ok: false, status: 502, error: 'Empty answer.' };
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS });
}

/** No server-initiated stream: this server is stateless. */
export async function GET(): Promise<Response> {
  return json({ error: 'This MCP server is stateless. POST JSON-RPC to this URL.' }, 405, { Allow: 'POST, OPTIONS' });
}

export async function DELETE(): Promise<Response> {
  return json(null, 405, { Allow: 'POST, OPTIONS' });
}

export async function POST(req: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400);
  }
  const startedAt = Date.now();
  const traceId = `mcp_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  // Salted, daily-rotated caller key. The raw IP is not stored or logged.
  const callerKey = await dailyVisitorHash({ ip: clientIpTransient(req), purpose: 'mcp-caller' });
  const country = countryFromRequest(req);
  const ua = (req.headers.get('user-agent') || 'unknown').split(/[\s/]/)[0].slice(0, 24);

  const deps = {
    ask: (q: string) => askChat(q, traceId),
    rate: async (kind: 'ask' | 'lookup' | 'patch') => {
      const own = await takeAgentRate(callerKey, AGENT_LIMITS[kind]);
      if (!own.ok) return own;
      if (kind === 'ask' || kind === 'patch') {
        const global = await takeAgentRate('all', kind === 'ask' ? AGENT_LIMITS.globalAsk : AGENT_LIMITS.globalPatch);
        if (!global.ok) return global;
      }
      return { ok: true as const };
    },
    patch: (input: Parameters<typeof suggestPatch>[0]) => suggestPatch(input, { caller: callerKey, budgetMs: 22_000 }),
    onAsk: () => {
      void recordEngageEvent({
        type: 'agent_ask',
        sid: `agent-${callerKey}`,
        at: Date.now(),
        uniqHash: callerKey,
        dims: { source: 'agent', landing: '/api/mcp', country, locale: 'unknown', device: ua || 'agent', caller: 'agent' },
      }).catch(() => {});
    },
  };

  const batch = Array.isArray(payload);
  const msgs = (batch ? payload : [payload]) as JsonRpcRequest[];
  if (msgs.length === 0 || msgs.length > 10) {
    return json({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } }, 400);
  }
  const out: JsonRpcResponse[] = [];
  for (const m of msgs) {
    const r = await handleMcpMessage(m, deps);
    if (r) out.push(r);
    console.log(
      traceLine(traceId, 'mcp', Date.now() - startedAt, {
        method: typeof m?.method === 'string' ? m.method : 'invalid',
        tool: m?.method === 'tools/call' ? String((m.params as { name?: unknown })?.name ?? '') : undefined,
        caller: 'agent',
        error: r && 'error' in r ? r.error.code : undefined,
      }),
    );
  }
  const headers: Record<string, string> = { 'X-Trace-Id': traceId };
  const init = msgs.find((m) => m?.method === 'initialize');
  if (init && out[0] && 'result' in out[0]) {
    headers['Mcp-Protocol-Version'] = (out[0].result as { protocolVersion: string }).protocolVersion;
  }
  if (out.length === 0) return json(null, 202, headers);
  return json(batch ? out : out[0], 200, headers);
}
