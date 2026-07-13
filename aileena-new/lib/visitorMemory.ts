/**
 * Per-visitor soft memory (L2 soft) — v0.5 skeleton.
 *
 * Decisions (locked):
 * - Store: Upstash Redis (REST; edge-safe). Same pattern as old/chat MemoryManager.
 * - GC: 90-day sliding TTL on every read/write — Dreaming does not scan Redis.
 * - Isolation: one key per anonymous visitorId (signed cookie). No cross-user reads.
 * - Degrade: if UPSTASH_* env missing, all ops no-op; chat still works via priorTopics.
 *
 * Hard taste memory (Markdown / searchMemories) is separate and never written here.
 */

import { Redis } from '@upstash/redis';

export const VISITOR_COOKIE = '__aileena_vid';
export const VISITOR_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days
export const MAX_QUESTIONS = 30;
export const MAX_TOPICS = 12;
export const MAX_QUESTION_CHARS = 160;

export type VisitorSoftMemory = {
  questions: string[];
  topics: string[];
  updatedAt: string;
  hitCount: number;
};

const EMPTY: VisitorSoftMemory = {
  questions: [],
  topics: [],
  updatedAt: '',
  hitCount: 0,
};

let redisClient: Redis | null | undefined;

export function getVisitorRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisClient = null;
    return null;
  }
  redisClient = new Redis({ url, token });
  return redisClient;
}

export function visitorSoftMemoryEnabled(): boolean {
  return getVisitorRedis() !== null;
}

function softKey(visitorId: string): string {
  return `visitor:soft:${visitorId}`;
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

function newVisitorId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === 'function') {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Read anonymous visitor id from cookie; verify HMAC when secret is set. */
export async function readVisitorId(req: Request): Promise<string | null> {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const match = cookieHeader.match(new RegExp(`${VISITOR_COOKIE}=([^;]+)`));
  if (!match) return null;

  try {
    const raw = decodeURIComponent(match[1]);
    const dot = raw.indexOf('.');
    const id = dot === -1 ? raw : raw.slice(0, dot);
    const sig = dot === -1 ? '' : raw.slice(dot + 1);
    if (!id || id.length < 8 || id.length > 80) return null;

    const secret = process.env.CHAT_QUOTA_SECRET ?? '';
    if (secret) {
      if (!sig) return null;
      const expected = await hmac(id, secret);
      if (expected !== sig) return null;
    }
    return id;
  } catch {
    return null;
  }
}

export async function ensureVisitorId(req: Request): Promise<{ id: string; isNew: boolean }> {
  const existing = await readVisitorId(req);
  if (existing) return { id: existing, isNew: false };
  return { id: newVisitorId(), isNew: true };
}

export async function buildVisitorCookie(visitorId: string): Promise<string> {
  const secret = process.env.CHAT_QUOTA_SECRET ?? '';
  const sig = secret ? await hmac(visitorId, secret) : '';
  const value = sig ? `${visitorId}.${sig}` : visitorId;
  return `${VISITOR_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${VISITOR_TTL_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

function normalizeQuestion(q: string): string {
  const trimmed = q.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  return trimmed.length > MAX_QUESTION_CHARS
    ? trimmed.slice(0, MAX_QUESTION_CHARS - 1) + '…'
    : trimmed;
}

/** Cheap topic tag from a question (not LLM). */
function topicFromQuestion(q: string): string | null {
  const t = q.toLowerCase();
  if (t.length < 4) return null;
  // Prefer a short noun-ish slice; drop leading filler.
  const cleaned = t
    .replace(/^(what'|what’s|whats|how|why|is|are|can|does|do|tell me |show me )/i, '')
    .trim();
  if (!cleaned) return null;
  return cleaned.length > 48 ? cleaned.slice(0, 47) + '…' : cleaned;
}

function parseSoft(raw: unknown): VisitorSoftMemory {
  if (!raw || typeof raw !== 'object') return { ...EMPTY };
  const o = raw as Partial<VisitorSoftMemory>;
  return {
    questions: Array.isArray(o.questions)
      ? o.questions.filter((x): x is string => typeof x === 'string').slice(0, MAX_QUESTIONS)
      : [],
    topics: Array.isArray(o.topics)
      ? o.topics.filter((x): x is string => typeof x === 'string').slice(0, MAX_TOPICS)
      : [],
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : '',
    hitCount: typeof o.hitCount === 'number' && o.hitCount >= 0 ? o.hitCount : 0,
  };
}

export async function loadVisitorSoftMemory(visitorId: string): Promise<VisitorSoftMemory> {
  const redis = getVisitorRedis();
  if (!redis) return { ...EMPTY };
  try {
    const raw = await redis.get<VisitorSoftMemory | string>(softKey(visitorId));
    if (!raw) return { ...EMPTY };
    const parsed = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw;
    return parseSoft(parsed);
  } catch (err) {
    console.warn('[visitorMemory] load failed', err);
    return { ...EMPTY };
  }
}

/** Merge a new question into an in-memory soft record (no I/O). */
export function mergeVisitorQuestion(
  prev: VisitorSoftMemory,
  question: string,
): VisitorSoftMemory | null {
  const q = normalizeQuestion(question);
  if (!q) return null;
  const topic = topicFromQuestion(q);
  const questions = [q, ...prev.questions.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(
    0,
    MAX_QUESTIONS,
  );
  const topics = topic
    ? [topic, ...prev.topics.filter((t) => t.toLowerCase() !== topic.toLowerCase())].slice(
        0,
        MAX_TOPICS,
      )
    : prev.topics;
  return {
    questions,
    topics,
    updatedAt: new Date().toISOString(),
    hitCount: prev.hitCount + 1,
  };
}

/**
 * Persist soft memory; refresh 90d TTL.
 * Pass `prev` from an earlier load to avoid a second Redis GET on the chat hot path.
 * Safe to fire-and-forget — failures never throw to the chat path.
 */
export async function recordVisitorQuestion(
  visitorId: string,
  question: string,
  prev?: VisitorSoftMemory,
): Promise<VisitorSoftMemory | null> {
  const redis = getVisitorRedis();
  if (!redis) return null;

  try {
    const base = prev ?? (await loadVisitorSoftMemory(visitorId));
    const next = mergeVisitorQuestion(base, question);
    if (!next) return null;
    await redis.set(softKey(visitorId), next, { ex: VISITOR_TTL_SECONDS });
    return next;
  } catch (err) {
    console.warn('[visitorMemory] record failed', err);
    return null;
  }
}

/** Touch TTL without adding a question (optional keep-alive). */
export async function touchVisitorSoftMemory(visitorId: string): Promise<void> {
  const redis = getVisitorRedis();
  if (!redis) return;
  try {
    const prev = await loadVisitorSoftMemory(visitorId);
    if (!prev.updatedAt && prev.questions.length === 0) return;
    await redis.set(softKey(visitorId), { ...prev, updatedAt: new Date().toISOString() }, {
      ex: VISITOR_TTL_SECONDS,
    });
  } catch (err) {
    console.warn('[visitorMemory] touch failed', err);
  }
}

export type VisitorIntent =
  | 'hire'
  | 'taste'
  | 'tech'
  | 'personal'
  | 'faith'
  | 'false_belief'
  | 'joke'
  | 'repeat';

export type VisitorStance = 'accommodate' | 'pierce';

export type VisitorStanceDecision = {
  stance: VisitorStance;
  intents: VisitorIntent[];
  reason: string;
};

const INTENT_PATTERNS: Array<{ intent: VisitorIntent; re: RegExp }> = [
  {
    intent: 'hire',
    re: /\b(hire|hiring|available|availability|rate|rates|freelance|contract|work with|work together|retain|commission)\b|合作|招人|报价|档期/,
  },
  {
    intent: 'taste',
    re: /\b(music|dj|set|techno|podcast|documentary|hockney|didion|shelf|listening|film|painter|taste|lifestyle|european living|seydoux|bond)\b|音乐|品味|纪录片|画家|电影|欧洲生活|生活方式/,
  },
  {
    intent: 'tech',
    re: /\b(h100|hbm|solana|mev|gpu|chip|nvidia|rpc|validator|cpo|pcb|pricing|sku)\b|芯片|算力/,
  },
  {
    intent: 'faith',
    re: /\b(faith|belief|believe|trust|religion|spiritual|creed)\b|信仰|信念|信什么/,
  },
  {
    intent: 'personal',
    re: /\b(who is she|about her|her story|personality|what is she like)\b|她是谁|什么样的人/,
  },
  {
    intent: 'false_belief',
    re: /\b(senior(ity)? (will |can )?protect|if i (just )?get senior|room will (accept|complete)|leap of faith|belonging (will|can) save|once i('m| am) powerful enough)\b|资历.*(保护|没事)|熬到.*就好|房间.*(承认|完整)/,
  },
  {
    intent: 'joke',
    re: /\b(lol|lmao|haha|jk|just kidding|kidding|meme|joke|funny|banter)\b|哈哈|开个玩笑|逗你|玩笑/,
  },
];

/** Rule-based intents from current ask + soft history (no LLM). */
export function inferVisitorIntents(
  lastQuestion: string,
  soft: VisitorSoftMemory,
  clientPriorTopics: string[] = [],
): VisitorIntent[] {
  const blob = [lastQuestion, ...soft.questions.slice(0, 8), ...soft.topics, ...clientPriorTopics]
    .join(' ')
    .toLowerCase();
  const found = new Set<VisitorIntent>();
  for (const { intent, re } of INTENT_PATTERNS) {
    if (re.test(blob)) found.add(intent);
  }
  const last = lastQuestion.trim().toLowerCase();
  if (last.length >= 8) {
    const repeats = soft.questions.filter((q) => {
      const a = q.toLowerCase();
      return a === last || a.includes(last) || last.includes(a);
    }).length;
    if (repeats >= 1) found.add('repeat');
  }
  return [...found];
}

/**
 * Auto stance (locked product rules):
 * - Default: accommodate (warm, human)
 * - Pierce only on false-belief comfort myths (soft, max one beat)
 * - Jokes stay light — never harsh roast
 * - Same rules for site + machina
 */
export function chooseVisitorStance(
  lastQuestion: string,
  soft: VisitorSoftMemory,
  clientPriorTopics: string[] = [],
): VisitorStanceDecision {
  const intents = inferVisitorIntents(lastQuestion, soft, clientPriorTopics);
  const joking = intents.includes('joke');
  const falseBelief = intents.includes('false_belief');
  const repeatingMyth =
    intents.includes('repeat') &&
    /\b(senior|protect|leap of faith|belong|powerful enough)\b|资历|leap of faith/.test(
      lastQuestion.toLowerCase(),
    );

  if ((falseBelief || repeatingMyth) && !joking) {
    return {
      stance: 'pierce',
      intents,
      reason: repeatingMyth
        ? 'repeat of a comforting myth — soft pierce once, then help'
        : 'false-belief pattern — soft pierce once, then help',
    };
  }
  return {
    stance: 'accommodate',
    intents,
    reason: joking
      ? 'joke/banter — stay warm and light'
      : 'default accommodate — follow their interests quietly',
  };
}

export function formatVisitorSoftMemoryForPrompt(
  soft: VisitorSoftMemory,
  clientPriorTopics: string[],
  lastQuestion: string = '',
): string {
  const topics = [...soft.topics];
  for (const t of clientPriorTopics) {
    if (typeof t !== 'string' || !t.trim()) continue;
    if (!topics.some((x) => x.toLowerCase() === t.toLowerCase())) topics.push(t.trim());
  }
  const topicLine = topics.slice(0, MAX_TOPICS);
  const recentQs = soft.questions.slice(0, 8);
  const decision = chooseVisitorStance(lastQuestion, soft, clientPriorTopics);
  const hasHistory = topicLine.length > 0 || recentQs.length > 0;

  const parts: string[] = [
    '# This visitor (soft memory + stance)',
    'Anonymous per-browser memory. Do not invent their identity, job, or feelings.',
    `Auto stance: **${decision.stance}** (${decision.reason}).`,
    decision.intents.length > 0
      ? `Intents: ${decision.intents.join(', ')}.`
      : 'Intents: (none detected — still default accommodate).',
  ];

  if (topicLine.length > 0) {
    parts.push(
      `Topics they cared about: ${topicLine.map((t) => `"${t.replace(/"/g, "'")}"`).join('; ')}.`,
    );
  }
  if (recentQs.length > 0) {
    parts.push(
      `Recent questions (newest first): ${recentQs.map((t) => `"${t.replace(/"/g, "'")}"`).join('; ')}.`,
    );
  }

  parts.push(`
## Stance rules (site + machina — same)
Tone: warm, human, brief. Never cruel. Never roast for sport. Max one soft pierce beat per reply.

### First beat — greet + catch-up
- If they greet (hi/hey/你好) OR this is clearly a returning visitor with topics below: open with a short warm hello and optionally name 1–2 prior topics ("last time you were into X"). Then answer.
- Do not dump the full question list. Do not invent what they care about beyond the topics/questions here.
- First-time / no history: still greet lightly, then help.

### accommodate (default)
- Quietly route to what they already care about (related essay, shelf, set, chip tool) — do **not** open every turn with "you asked before…".
- A light callback is OK when natural ("since you're looking at HBM…").
- Lead with their interest, then answer the current question.

### pierce (only false-belief / comforting myths)
- Trigger: seniority-will-protect-you, the-room-will-complete-you, leap-of-faith-over-measurement, similar comfort myths — especially on repeat.
- Do: one warm, clear sentence that names the gap (use her essays / faith-from-essays / harassment / third-culture when relevant), then help with the real ask.
- Don't: pile on, moralize, or pierce hire/taste/tech questions that aren't carrying a false belief.
- Jokes / banter: stay playful; do not harden into pierce.

### Always
- Answer the current question first in substance (after the short greet when appropriate).
- Recite the question list only if they ask what they asked before.
${hasHistory ? '' : '- No prior soft history yet — greet simply; learn from this turn.'}`.trim());

  return '\n\n' + parts.join('\n');
}
