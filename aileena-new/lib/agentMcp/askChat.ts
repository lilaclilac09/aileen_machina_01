import { POST as chatPOST } from '../../app/api/chat/route';
import { markAgentCaller } from '../agentCaller';
import { collectUiStreamText, type AskResult } from './server';

/**
 * Run one question through the public chat handler, in-process, as an agent
 * caller (public door only: no owner, no council, no side-effect lanes).
 * Shared by /api/mcp and /api/ask-paid.
 */
export async function askChat(question: string, traceId: string): Promise<AskResult & { answerCache?: string | null }> {
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
  return text
    ? { ok: true, text, traceId: res.headers.get('x-trace-id') ?? traceId, answerCache: res.headers.get('x-answer-cache') }
    : { ok: false, status: 502, error: 'Empty answer.' };
}
