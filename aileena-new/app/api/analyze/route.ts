import { checkRateLimit, LLM_RATE } from '../../../lib/api/ratelimit';
import { analyzeIntent, IntentError, publicMessage } from '../../../lib/intent/analyze';

export const runtime = 'nodejs';
export const maxDuration = 30;

function fail(code: string, status: number): Response {
  return Response.json({ error: publicMessage(code) }, { status });
}

export async function POST(req: Request) {
  const rl = checkRateLimit(req, LLM_RATE, 'intent-analyze');
  if (!rl.ok) {
    return Response.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('invalid_json', 400);
  }

  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : null;
  const scenario = typeof record?.scenario === 'string' ? record.scenario : '';
  const text = typeof record?.text === 'string' ? record.text : '';

  try {
    const result = await analyzeIntent(scenario, text);
    return Response.json(result);
  } catch (error) {
    if (error instanceof IntentError) {
      console.error(`[intent] ${error.code} ${error.status}`);
      return fail(error.code, error.status);
    }
    console.error('[intent] unexpected');
    return fail('bad_upstream', 502);
  }
}
