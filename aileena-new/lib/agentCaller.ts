/**
 * Agent-to-agent callers (/api/mcp). The MCP route calls the chat handler
 * in-process with a Request it built itself and marks it here. The mark is a
 * module-level WeakSet, so no header, cookie or body field can forge it, and a
 * marked request is always treated as a public visitor:
 *   - owner session is ignored (requests carry no cookies anyway),
 *   - council / owner modes are refused, machina falls back to public,
 *   - side-effect lanes (browser, computer desk, forge) are skipped,
 *   - nothing is enqueued into the owner's live inbox.
 */
const AGENT_REQUESTS = new WeakSet<Request>();

export function markAgentCaller(req: Request): Request {
  AGENT_REQUESTS.add(req);
  return req;
}

export function isAgentCaller(req: Request): boolean {
  return AGENT_REQUESTS.has(req);
}
