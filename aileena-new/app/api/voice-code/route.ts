/**
 * POST /api/voice-code — launch Cursor Cloud Agent (your CURSOR_API_KEY).
 *
 * - Burns YOUR Cursor quota (Dashboard → API Keys), not visitor Cursor accounts.
 * - Visitor limit: signed cookie `__aileena_vcode`, 5 launches / local day.
 * - Default: plan-mode propose on aileen_machina_01; dialog gets status + agent URL.
 * - Edge budget ~20s poll; if still running, return link for visitor to follow.
 *
 * Curl-apply to: aileena-new/app/api/voice-code/route.ts
 *
 * Env:
 *   CURSOR_API_KEY          required
 *   CURSOR_VCODE_REPO_URL   default https://github.com/lilaclilac09/aileen_machina_01
 *   CURSOR_VCODE_REPO_REF   default main
 *   CURSOR_VCODE_AUTO_PR    "true" to open PR when finished (default false)
 *   CURSOR_VCODE_MODE       "plan" | "agent" (default plan = propose)
 *   CHAT_QUOTA_SECRET       HMAC for __aileena_vcode (same as chat)
 */

export const runtime = 'edge';
export const maxDuration = 30;

export const VCODE_DAILY_LIMIT = 5;
const QUOTA_COOKIE = '__aileena_vcode';
const CURSOR_API = 'https://api.cursor.com/v1';
const POLL_MS = 2000;
const POLL_BUDGET_MS = 18_000;

const CRUEL_FORBID =
  /\b(you will (die|fail|suffer)|doomed|cursed to|hopeless|worthless|kill yourself|no future)\b/i;

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function resolveQuotaDay(req: Request): string {
  const header = (req.headers.get('x-vcode-day') ?? req.headers.get('x-quota-day') ?? '').trim();
  const utc = utcDay();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(header)) return utc;
  const clientNoon = Date.parse(`${header}T12:00:00.000Z`);
  const utcNoon = Date.parse(`${utc}T12:00:00.000Z`);
  if (!Number.isFinite(clientNoon) || !Number.isFinite(utcNoon)) return utc;
  if (Math.abs(clientNoon - utcNoon) > 36 * 60 * 60 * 1000) return utc;
  return header;
}

function b64urlEncode(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(value: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return b64urlEncode(new Uint8Array(sig));
}

type QuotaState = { date: string; count: number };

async function readQuota(req: Request): Promise<QuotaState> {
  const today = resolveQuotaDay(req);
  const cookieHeader = req.headers.get('cookie') ?? '';
  const match = cookieHeader.match(new RegExp(`${QUOTA_COOKIE}=([^;]+)`));
  if (!match) return { date: today, count: 0 };

  try {
    const raw = decodeURIComponent(match[1]);
    const dot = raw.indexOf('.');
    const encoded = dot === -1 ? raw : raw.slice(0, dot);
    const sig = dot === -1 ? '' : raw.slice(dot + 1);

    const secret = process.env.CHAT_QUOTA_SECRET ?? '';
    if (secret) {
      if (!sig) return { date: today, count: 0 };
      const expected = await hmac(encoded, secret);
      if (expected !== sig) return { date: today, count: 0 };
    }

    const decoded = JSON.parse(atob(encoded)) as Partial<QuotaState>;
    if (decoded.date !== today || typeof decoded.count !== 'number') {
      return { date: today, count: 0 };
    }
    return { date: decoded.date, count: Math.max(0, Math.min(decoded.count, 99)) };
  } catch {
    return { date: today, count: 0 };
  }
}

async function buildQuotaCookie(state: QuotaState): Promise<string> {
  try {
    const encoded = btoa(JSON.stringify(state));
    const secret = process.env.CHAT_QUOTA_SECRET ?? '';
    const sig = secret ? await hmac(encoded, secret) : '';
    const value = sig ? `${encoded}.${sig}` : encoded;
    return `${QUOTA_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=90000; HttpOnly; Secure; SameSite=Strict`;
  } catch {
    return '';
  }
}

function json(
  body: Record<string, unknown>,
  status: number,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function cursorAuthHeader(apiKey: string): string {
  // Basic auth: username = API key, password empty (Edge-safe btoa).
  return `Basic ${btoa(`${apiKey}:`)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type CursorCreateResponse = {
  agent?: { id?: string; url?: string; name?: string; latestRunId?: string };
  run?: { id?: string; status?: string };
  error?: unknown;
  message?: string;
};

type CursorRunResponse = {
  id?: string;
  status?: string;
  result?: string;
  durationMs?: number;
  git?: {
    branches?: Array<{ repoUrl?: string; branch?: string; url?: string }>;
  };
};

async function createCursorAgent(
  apiKey: string,
  promptText: string,
): Promise<CursorCreateResponse> {
  const repoUrl =
    process.env.CURSOR_VCODE_REPO_URL?.trim() ||
    'https://github.com/lilaclilac09/aileen_machina_01';
  const startingRef = process.env.CURSOR_VCODE_REPO_REF?.trim() || 'main';
  const autoCreatePR = process.env.CURSOR_VCODE_AUTO_PR === 'true';
  const mode = process.env.CURSOR_VCODE_MODE === 'agent' ? 'agent' : 'plan';

  const res = await fetch(`${CURSOR_API}/agents`, {
    method: 'POST',
    headers: {
      Authorization: cursorAuthHeader(apiKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: {
        text: [
          'Voice-to-code request from aileena.xyz Console orb.',
          'Prefer a small, reviewable proposal. Do not be cruel.',
          mode === 'plan'
            ? 'Stay in plan/propose mode: describe the patch; avoid large unsolicited refactors.'
            : 'Implement the smallest change that satisfies the ask.',
          '',
          `Visitor ask: ${promptText}`,
        ].join('\n'),
      },
      name: `orb-vcode ${promptText.slice(0, 40)}`.slice(0, 100),
      mode,
      autoCreatePR,
      workOnCurrentBranch: false,
      repos: [{ url: repoUrl, startingRef }],
    }),
  });

  const data = (await res.json().catch(() => ({}))) as CursorCreateResponse & {
    error?: { message?: string };
  };
  if (!res.ok) {
    const msg =
      (typeof data.error === 'object' && data.error && 'message' in data.error
        ? String((data.error as { message?: string }).message)
        : null) ||
      data.message ||
      `Cursor API ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

async function getCursorRun(
  apiKey: string,
  agentId: string,
  runId: string,
): Promise<CursorRunResponse> {
  const res = await fetch(`${CURSOR_API}/agents/${agentId}/runs/${runId}`, {
    headers: { Authorization: cursorAuthHeader(apiKey) },
  });
  const data = (await res.json().catch(() => ({}))) as CursorRunResponse & {
    message?: string;
  };
  if (!res.ok) {
    throw new Error(data.message || `Cursor run ${res.status}`);
  }
  return data;
}

function formatProposal(opts: {
  prompt: string;
  agentId: string;
  agentUrl: string;
  runStatus: string;
  resultText?: string;
  branches?: Array<{ repoUrl?: string; branch?: string; url?: string }>;
}): string {
  const lines = [
    '▸ voice → code · Cursor Cloud Agent (your API key · visitor quota 5/day)',
    `Status: ${opts.runStatus}`,
    `Agent: ${opts.agentUrl || opts.agentId}`,
    '',
  ];
  if (opts.resultText?.trim()) {
    lines.push(opts.resultText.trim(), '');
  } else if (opts.runStatus === 'CREATING' || opts.runStatus === 'RUNNING') {
    lines.push(
      'Agent is still working (edge poll budget ended). Open the Agent link above to watch or read the plan.',
      '',
    );
  }
  if (opts.branches?.length) {
    lines.push('Branches:');
    for (const b of opts.branches) {
      lines.push(`- ${b.branch || '?'}${b.url ? ` · ${b.url}` : ''}`);
    }
    lines.push('');
  }
  lines.push(`Ask was: ${opts.prompt.slice(0, 200)}`);
  lines.push('Apply / merge only after you review — Console proposes and links; it does not merge for visitors.');
  let text = lines.join('\n');
  if (CRUEL_FORBID.test(text)) {
    text =
      'Cursor agent returned text that looked too sharp — open the Agent URL to review the plan safely. Nothing was merged from this Console.';
  }
  return text;
}

export async function POST(req: Request) {
  let body: { prompt?: unknown; priorTopics?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON.', ok: false }, 400);
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) return json({ error: 'No prompt.', ok: false }, 400);
  if (prompt.length > 4000) {
    return json({ error: 'Prompt too long.', ok: false }, 413);
  }

  const apiKey = (process.env.CURSOR_API_KEY || '').trim();
  if (!apiKey) {
    return json(
      {
        ok: false,
        error:
          'CURSOR_API_KEY is not set on the server. Add it in Vercel (Cursor Dashboard → API Keys), then redeploy.',
        remaining: null,
        limit: VCODE_DAILY_LIMIT,
        show_in_dialog: true,
        write_target: null,
        permission: 'propose',
        provider: 'cursor',
      },
      503,
    );
  }

  const quota = await readQuota(req);
  if (quota.count >= VCODE_DAILY_LIMIT) {
    const exhaustedCookie = await buildQuotaCookie({ date: quota.date, count: quota.count });
    return json(
      {
        ok: false,
        error: `You've used today's ${VCODE_DAILY_LIMIT} voice-code launches. Fresh set tomorrow — chat still works within the 20/day limit.`,
        remaining: 0,
        limit: VCODE_DAILY_LIMIT,
        show_in_dialog: true,
        write_target: null,
        permission: 'propose',
        provider: 'cursor',
      },
      429,
      {
        ...(exhaustedCookie ? { 'Set-Cookie': exhaustedCookie } : {}),
        'X-VCode-Remaining': '0',
        'X-VCode-Day': quota.date,
      },
    );
  }

  let created: CursorCreateResponse;
  try {
    created = await createCursorAgent(apiKey, prompt);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Cursor launch failed';
    return json(
      {
        ok: false,
        error: `Cursor agent launch failed: ${msg}`,
        remaining: Math.max(0, VCODE_DAILY_LIMIT - quota.count),
        limit: VCODE_DAILY_LIMIT,
        show_in_dialog: true,
        write_target: null,
        permission: 'propose',
        provider: 'cursor',
      },
      502,
    );
  }

  const agentId = created.agent?.id || '';
  const agentUrl =
    created.agent?.url ||
    (agentId ? `https://cursor.com/agents/${agentId}` : '');
  let runId = created.run?.id || created.agent?.latestRunId || '';
  let runStatus = created.run?.status || 'CREATING';
  let resultText = '';
  let branches: CursorRunResponse['git'] extends infer G
    ? G extends { branches?: infer B }
      ? B
      : undefined
    : undefined;

  // Count the launch immediately (protects your Cursor bill even if visitor leaves).
  const nextCount = quota.count + 1;
  const cookie = await buildQuotaCookie({ date: quota.date, count: nextCount });
  const remaining = Math.max(0, VCODE_DAILY_LIMIT - nextCount);

  if (agentId && runId) {
    const deadline = Date.now() + POLL_BUDGET_MS;
    while (Date.now() < deadline) {
      try {
        const run = await getCursorRun(apiKey, agentId, runId);
        runStatus = run.status || runStatus;
        if (typeof run.result === 'string' && run.result.trim()) {
          resultText = run.result.trim();
        }
        branches = run.git?.branches;
        if (
          runStatus === 'FINISHED' ||
          runStatus === 'FAILED' ||
          runStatus === 'CANCELLED' ||
          runStatus === 'ERROR'
        ) {
          break;
        }
      } catch {
        break;
      }
      await sleep(POLL_MS);
    }
  }

  const proposal = formatProposal({
    prompt,
    agentId,
    agentUrl,
    runStatus,
    resultText,
    branches,
  });

  return json(
    {
      ok: true,
      proposal,
      remaining,
      limit: VCODE_DAILY_LIMIT,
      show_in_dialog: true,
      write_target: null,
      permission: 'propose',
      provider: 'cursor',
      agentId: agentId || null,
      agentUrl: agentUrl || null,
      runStatus,
    },
    200,
    {
      ...(cookie ? { 'Set-Cookie': cookie } : {}),
      'X-VCode-Remaining': String(remaining),
      'X-VCode-Day': quota.date,
    },
  );
}
