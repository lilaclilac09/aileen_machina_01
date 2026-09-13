/**
 * Production drain for the chat live inbox.
 * GitHub Actions presents an OIDC JWT. No UPSTASH secret on GitHub.
 */

import { drainLiveInbox, type LiveAsk } from './liveInbox';
import { verifyGithubActionsOidc } from './githubOidc';

export type DrainResponse = {
  asks: LiveAsk[];
  drained: number;
};

export async function handleEvolveDrain(req: Request): Promise<Response> {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const verified = await verifyGithubActionsOidc(token);
  if (!verified.ok) {
    return Response.json({ error: 'unauthorized', reason: verified.reason }, { status: 401 });
  }
  const asks = await drainLiveInbox(5);
  const body: DrainResponse = { asks, drained: asks.length };
  return Response.json(body);
}

export function parseEvolveAsksJson(raw: unknown): LiveAsk[] {
  if (!raw) return [];
  const rows = Array.isArray(raw) ? raw : Array.isArray((raw as { asks?: unknown }).asks) ? (raw as { asks: unknown[] }).asks : [];
  const out: LiveAsk[] = [];
  for (const row of rows) {
    if (typeof row === 'string' && row.trim()) {
      out.push({ at: new Date().toISOString(), prompt: row.trim(), source: 'chat' });
      continue;
    }
    if (row && typeof row === 'object' && typeof (row as LiveAsk).prompt === 'string') {
      const prompt = (row as LiveAsk).prompt.trim();
      if (!prompt) continue;
      out.push({
        at: typeof (row as LiveAsk).at === 'string' ? (row as LiveAsk).at : new Date().toISOString(),
        prompt,
        source: 'chat',
      });
    }
  }
  return out;
}
