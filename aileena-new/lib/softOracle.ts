/**
 * Soft oracle — shallow positive fortune craft for orb / Prophecy Hall.
 *
 * Story feeling (Divination mist, Patronus light, Erised → one step,
 * Room-of-Requirement summon, phoenix “try again”) — original English only.
 * No Rowling quotes, no spell names as product features, no cruel fate.
 *
 * Text is for Console dialog injection only — never render inside the glass orb.
 */

export const CRUEL_FORBID =
  /\b(you will (die|fail|suffer)|doomed|cursed to|hopeless|worthless|kill yourself|no future)\b/i;

const STRENGTH_MIRRORS: Array<{ re: RegExp; label: string; nudge: string }> = [
  {
    re: /solana|mev|chain|web3|crypto|code|agent|machina/i,
    label: 'builder thread',
    nudge: 'Keep the next change small enough to ship before the mist clears.',
  },
  {
    re: /writ|blog|essay|dispatch|page|desk/i,
    label: 'writer’s light',
    nudge: 'One honest paragraph is enough weather for today.',
  },
  {
    re: /music|dj|sound|listen|song|shelf/i,
    label: 'listening ear',
    nudge: 'Answer the quiet track first; the loud one can wait a bar.',
  },
  {
    re: /glass|kiln|craft|visual|work/i,
    label: 'maker’s warmth',
    nudge: 'Clear one corner of the bench — the shape will meet you there.',
  },
  {
    re: /hire|job|work with|available/i,
    label: 'open door',
    nudge: 'Name what you need from the visit; doors prefer clear knocks.',
  },
];

const GENERIC_HINTS = [
  'The mist does not shout. It suggests a warm thread — follow the smallest kind step you already almost know.',
  'Like a room that appears when needed: you do not have to force the whole map. One doorway is enough.',
  'If worry fog gathers, picture a small light you can carry — then do one brave, ordinary thing.',
  'Desire is allowed to glow, then return to the desk: name what you want, then take the next real inch.',
  'Tomorrow the shelf resets its patience. Nothing here is trying to be cruel to you.',
];

function tidyTopic(topic: string): string {
  return topic.replace(/…$/u, '').trim().slice(0, 48);
}

function pickMirror(topics: string[]): (typeof STRENGTH_MIRRORS)[number] | null {
  for (const topic of topics) {
    for (const m of STRENGTH_MIRRORS) {
      if (m.re.test(topic)) return m;
    }
  }
  return null;
}

/** Stable-ish pick so the same visitor sees a calm repeating hint, not chaos. */
function pickIndex(seed: string, n: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return n === 0 ? 0 : h % n;
}

/**
 * Shallow positive hint for Console dialog (welcome / idle / Hall).
 * Weaves priorTopics when present; never cruel.
 */
export function composeSoftHint(priorTopics: string[] = []): string {
  const topics = priorTopics.map(tidyTopic).filter(Boolean);
  const mirror = pickMirror(topics);
  const seed = topics[0] || 'aileena';
  const base = GENERIC_HINTS[pickIndex(seed, GENERIC_HINTS.length)];

  if (mirror && topics[0]) {
    return `I remember a little of your ${mirror.label} (“${topics[0]}”). ${mirror.nudge} ${base}`;
  }
  if (topics[0]) {
    return `A soft echo of “${topics[0]}” is still on the shelf. ${base}`;
  }
  return base;
}

/** Personalize a Hall record for dialog — history weave for C (and light touch for B). */
export function personalizeProphecy(
  title: string,
  body: string,
  priorTopics: string[] = [],
  kind: 'B' | 'C' = 'B',
): string {
  const hintTail = composeSoftHint(priorTopics);
  const topics = priorTopics.map(tidyTopic).filter(Boolean);
  const opener =
    kind === 'C' && topics[0]
      ? `For you — because the hall recognizes your thread around “${topics[0]}”:\n\n`
      : kind === 'B' && topics[0]
        ? `Warming “${title}” with a nod to what you’ve been circling (“${topics[0]}”):\n\n`
        : `Warming “${title}”:\n\n`;

  const text = `${opener}${body}\n\n— Soft hint: ${hintTail}`;
  if (CRUEL_FORBID.test(text)) {
    return `${opener}${body}\n\n— Soft hint: ${GENERIC_HINTS[0]}`;
  }
  return text;
}

/** CI / self-test helper — true if text violates the kindness contract. */
export function isCruelOracleText(text: string): boolean {
  return CRUEL_FORBID.test(text);
}
