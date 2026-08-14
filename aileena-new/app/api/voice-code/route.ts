/**
 * POST /api/voice-code — public door. Propose-only.
 *
 * - Brain: same Machina/DeepSeek stack as /api/chat (NOT Cursor tokens, NOT dsh).
 * - Quota: signed cookie `__aileena_vcode`, 5 proposals / visitor / local day.
 * - Returns a unified diff + downloadable .patch metadata. Never writes.
 * - `apply: true` / write flags → 403. Never 200 that implies a write.
 *
 * Owner apply is `/api/owner/voice-code/apply` (OWNER_KEY session + allowlist).
 */

import { generateText } from 'ai';
import {
  routeModel,
  recordModelSuccess,
  recordModelFailure,
  createModelAbortSignal,
  classifyModelError,
  degradeMessage,
} from '../../../lib/modelRouter';
import { parseVoiceAccent } from '../../../lib/voiceAccent';
import { buildDownloadablePatch } from '../../../lib/voiceCodePatch';

export const runtime = 'edge';
export const maxDuration = 30;

export const VCODE_DAILY_LIMIT = 5;
const QUOTA_COOKIE = '__aileena_vcode';

const CRUEL_FORBID =
  /\b(you will (die|fail|suffer)|doomed|cursed to|hopeless|worthless|kill yourself|no future)\b/i;

const SYSTEM = `You are Aileena's voice-to-code helper on aileena.xyz.
Return a CODE PROPOSAL only — unified diff and/or short numbered steps.
You are not DeepSeek Harness (dsh). dsh is a local coding CLI with disk and sandbox.
This Console loop is propose-only: no git, no apply, write_target is always null.
Rules:
- Do NOT claim you wrote files, ran git, or applied a patch.
- Do NOT ask the visitor to paste Cursor API keys or use Cursor tokens.
- Prefer small, reviewable changes. If the ask is vague, propose the smallest clarifying patch sketch.
- English-first even if the visitor spoke Chinese. Be kind and practical. No cruel or fatalistic language.
- Do not use spoken/auntie cadence. Diffs are for reading, not TTS.
- End with one line: "Copy or take the .patch — this Console only proposes."`;

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
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}

function wantsWrite(body: Record<string, unknown>): boolean {
  if (body.apply === true || body.write === true) return true;
  if (body.permission === 'apply') return true;
  const target = body.write_target;
  if (typeof target === 'string' && target.trim().length > 0) return true;
  if (target && typeof target === 'object') return true;
  return false;
}

const PROPOSE_FIELDS = {
  apply: false,
  write_target: null,
  permission: 'propose',
  harness: 'propose-only',
} as const;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Invalid JSON.', ok: false, ...PROPOSE_FIELDS }, 400);
  }

  if (wantsWrite(body)) {
    return json(
      {
        ok: false,
        error: 'Public voice-code is propose-only. Nothing was written.',
        remaining: null,
        show_in_dialog: true,
        ...PROPOSE_FIELDS,
      },
      403,
    );
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) return json({ error: 'No prompt.', ok: false, ...PROPOSE_FIELDS }, 400);
  if (prompt.length > 4000) {
    return json({ error: 'Prompt too long.', ok: false, ...PROPOSE_FIELDS }, 413);
  }

  const priorTopics = Array.isArray(body.priorTopics)
    ? body.priorTopics
        .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
        .slice(0, 5)
    : [];
  const voiceAccent = parseVoiceAccent(body.voiceAccent);

  const quota = await readQuota(req);
  if (quota.count >= VCODE_DAILY_LIMIT) {
    const exhaustedCookie = await buildQuotaCookie({ date: quota.date, count: quota.count });
    return json(
      {
        ok: false,
        error: `You've used today's ${VCODE_DAILY_LIMIT} voice-code proposals. Fresh set tomorrow — chat still works within the 20/day limit.`,
        remaining: 0,
        limit: VCODE_DAILY_LIMIT,
        show_in_dialog: true,
        ...PROPOSE_FIELDS,
      },
      429,
      {
        ...(exhaustedCookie ? { 'Set-Cookie': exhaustedCookie } : {}),
        'X-VCode-Remaining': '0',
        'X-VCode-Day': quota.date,
        'X-Voice-Accent': voiceAccent ?? 'off',
        'X-Harness': 'propose-only',
      },
    );
  }

  const decision = routeModel({
    toolRoute: 'voice_code',
    lastQuestion: prompt,
    voiceAccent,
  });
  if (decision.mode === 'degrade') {
    return json(
      {
        ok: false,
        error: decision.message,
        remaining: Math.max(0, VCODE_DAILY_LIMIT - quota.count),
        limit: VCODE_DAILY_LIMIT,
        show_in_dialog: true,
        ...PROPOSE_FIELDS,
      },
      decision.status,
    );
  }

  const topicLine =
    priorTopics.length > 0
      ? `Visitor prior topics (soft memory): ${priorTopics.join(' · ')}`
      : 'No prior topics.';

  let proposal = '';
  try {
    const result = await generateText({
      model: decision.pick.model,
      system: SYSTEM,
      prompt: `${topicLine}\n\nVisitor ask:\n${prompt}`,
      maxOutputTokens: 1200,
      abortSignal: createModelAbortSignal(20_000),
    });
    proposal = (result.text || '').trim();
    recordModelSuccess();
  } catch (err) {
    recordModelFailure(err);
    const { reason } = classifyModelError(err);
    return json(
      {
        ok: false,
        error: degradeMessage(reason, prompt),
        remaining: Math.max(0, VCODE_DAILY_LIMIT - quota.count),
        limit: VCODE_DAILY_LIMIT,
        show_in_dialog: true,
        ...PROPOSE_FIELDS,
      },
      reason === 'billing' ? 502 : 503,
    );
  }

  if (!proposal) {
    return json(
      {
        ok: false,
        error: 'Empty proposal — try a more specific ask.',
        remaining: Math.max(0, VCODE_DAILY_LIMIT - quota.count),
        limit: VCODE_DAILY_LIMIT,
        show_in_dialog: true,
        ...PROPOSE_FIELDS,
      },
      502,
    );
  }

  if (CRUEL_FORBID.test(proposal)) {
    proposal =
      'I almost said something too sharp — here’s a kinder pass: describe the smallest file change you want, and I’ll sketch a reviewable proposal only. Nothing is written to disk from this Console.';
  }

  const nextCount = quota.count + 1;
  const cookie = await buildQuotaCookie({ date: quota.date, count: nextCount });
  const remaining = Math.max(0, VCODE_DAILY_LIMIT - nextCount);
  const download = buildDownloadablePatch({
    proposal,
    prompt,
    remaining,
    limit: VCODE_DAILY_LIMIT,
  });

  return json(
    {
      ok: true,
      proposal,
      patch: download.patch,
      patch_filename: download.filename,
      has_diff: download.hasDiff,
      remaining,
      limit: VCODE_DAILY_LIMIT,
      show_in_dialog: true,
      ...PROPOSE_FIELDS,
    },
    200,
    {
      ...(cookie ? { 'Set-Cookie': cookie } : {}),
      'X-VCode-Remaining': String(remaining),
      'X-VCode-Day': quota.date,
      'X-Voice-Accent': voiceAccent ?? 'off',
      'X-Harness': 'propose-only',
    },
  );
}
