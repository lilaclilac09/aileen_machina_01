/**
 * Night Desk — this subscriber only.
 * Key night:{userId}. Never visitor:soft, never memories/taste.
 */

export const NIGHT_TTL_SECONDS = 90 * 24 * 60 * 60;
export const NIGHT_PRICE_USD = 18;

export const NIGHT_PRICE_COPY =
  '$18/mo continuity — this desk, her shelf, the thread you already started. Not a romance SKU. Payment is not wired.';

export type NightMode = 'night' | 'public';

export type NightRecord = {
  userId: string;
  lines: string[];
  pins: string[];
  updatedAt: string;
};

export type NightReply = {
  kind: 'desk' | 'refuse' | 'crisis' | 'adult';
  text: string;
  store: boolean;
};

const FORBIDDEN_KEYS = ['visitor:soft:', 'memories/', 'taste'];

export function nightKey(userId: string): string {
  const id = userId.trim();
  if (!id || /[:/\s]/.test(id)) {
    throw new Error('night user id must be one token');
  }
  const key = `night:${id}`;
  assertNightKey(key);
  return key;
}

export function assertNightKey(key: string): void {
  for (const bad of FORBIDDEN_KEYS) {
    if (key.includes(bad)) throw new Error(`night key leaked into ${bad}`);
  }
  if (!key.startsWith('night:')) throw new Error('not a night key');
}

export function slidingExpiry(nowMs: number): number {
  return Math.floor(nowMs / 1000) + NIGHT_TTL_SECONDS;
}

function hasMinorSexual(text: string): boolean {
  const t = text.toLowerCase();
  const minor = /\b(child|minor|underage|kid|teen|loli|shota|未成年|小孩|儿童)\b/.test(t);
  const sexual = /\b(sex|nude|naked|porn|nsfw|操|色情|裸)\b/.test(t);
  return minor && sexual;
}

function crisis(text: string): boolean {
  return /suicid|kill myself|end my life|不想活|自杀|輕生|想死/.test(text.toLowerCase());
}

function wantsPartnerOrTherapist(text: string): boolean {
  return /girlfriend|boyfriend|be my (partner|therapist)|你是我(女朋友|对象|治疗师)|陪我谈恋爱/.test(
    text.toLowerCase(),
  );
}

function adultAsk(text: string): boolean {
  return /\b(sex|nude|naked|porn|nsfw|explicit|成人|色情)\b/i.test(text);
}

export function deskReply(opts: {
  mode: NightMode;
  paid: boolean;
  ageOk: boolean;
  text: string;
}): NightReply {
  const text = opts.text.trim();
  if (hasMinorSexual(text)) {
    return { kind: 'refuse', text: 'Illegal. Stop.', store: false };
  }
  if (crisis(text)) {
    return {
      kind: 'crisis',
      text: 'This desk stays. If you are in danger, call or text 988 (US & Canada). IASP https://www.iasp.info/suicidalthoughts/',
      store: false,
    };
  }
  if (wantsPartnerOrTherapist(text)) {
    return {
      kind: 'refuse',
      text: 'Not a partner. Not a therapist. The desk is the room.',
      store: false,
    };
  }
  if (adultAsk(text)) {
    const allowed = opts.mode === 'night' && opts.paid && opts.ageOk;
    if (!allowed) {
      return {
        kind: 'refuse',
        text: 'Adult subjects stay off the public room, and off this desk unless you asked and the desk is paid.',
        store: false,
      };
    }
    return {
      kind: 'adult',
      text: 'Noted. The desk can stay with what you named. It does not become a partner.',
      store: true,
    };
  }
  if (opts.mode !== 'night' || !opts.ageOk) {
    return {
      kind: 'refuse',
      text: 'Night Desk is its own page. Confirm 18+ there.',
      store: false,
    };
  }
  return {
    kind: 'desk',
    text: 'The desk is open. Essays, sets, kiln, the work. Continuity is this thread.',
    store: true,
  };
}

/** Public console, same visitor. Not a second door. Not her taste. */
export function consoleNightReply(text: string): NightReply {
  const gated = deskReply({ mode: 'night', paid: false, ageOk: true, text });
  if (gated.kind !== 'desk') return gated;
  const heard = text.trim().slice(0, 80);
  return {
    kind: 'desk',
    text: `Night desk. I heard you: ${heard}. Same visitor. Long memory, not a girlfriend SKU. The diary stays on this desk. It does not become her taste.`,
    store: true,
  };
}

const nightMem = new Map<string, NightRecord>();

export function readNight(userId: string): NightRecord {
  return nightMem.get(nightKey(userId)) ?? { userId, lines: [], pins: [], updatedAt: '' };
}

export function writeNight(record: NightRecord): void {
  nightMem.set(nightKey(record.userId), record);
}

export function touchNight(
  record: NightRecord,
  line: string,
  nowIso: string,
): NightRecord {
  nightKey(record.userId);
  return {
    ...record,
    lines: [...record.lines, line].slice(-40),
    updatedAt: nowIso,
  };
}

export function pinLine(record: NightRecord, line: string, nowIso: string): NightRecord {
  return { ...record, pins: [...record.pins, line].slice(-12), updatedAt: nowIso };
}

export function deleteNight(userId: string): NightRecord {
  nightKey(userId);
  return { userId, lines: [], pins: [], updatedAt: '' };
}

export function exportNight(record: NightRecord): string {
  nightKey(record.userId);
  return JSON.stringify({ key: nightKey(record.userId), ...record });
}
