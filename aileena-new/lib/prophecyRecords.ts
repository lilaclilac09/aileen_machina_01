/**
 * Prophecy Hall records — original shorts only (no verbatim HP quotes).
 *
 * B: fixed shelf prophecies anyone can warm.
 * C: visitor-memory–gated — “yours” only when priorTopics match tags.
 */

export type ProphecyKind = 'B' | 'C';

export type ProphecyRecord = {
  id: string;
  kind: ProphecyKind;
  title: string;
  /** Soft tags matched against visitor topic memory (C only). */
  tags: string[];
  /** Full text streamed into Console dialog — never rendered inside the orb. */
  text: string;
  /** CSS gradient accents for the glass orb. */
  hue: string;
};

/** B — fixed original shorts (English-first). */
export const PROPHECY_B: ProphecyRecord[] = [
  {
    id: 'b-kiln',
    kind: 'B',
    title: 'Kiln mist',
    tags: ['glass', 'kiln', 'craft'],
    hue: 'radial-gradient(circle at 30% 25%, #fff8, transparent 42%), radial-gradient(circle at 70% 70%, #7ee8dc88, #0a3d3888 70%)',
    text:
      'The kiln remembers heat longer than the hands that opened it. What you fire this season will cool into a shape you already almost know — keep the bench clear and the question small.',
  },
  {
    id: 'b-signal',
    kind: 'B',
    title: 'Soft signal',
    tags: ['signal', 'radio', 'listen'],
    hue: 'radial-gradient(circle at 35% 30%, #fff9, transparent 40%), radial-gradient(circle at 55% 65%, #a8c4ff88, #1a274888 72%)',
    text:
      'A soft signal arrives before the louder one. Answer the quiet ask first — the rest of the week will sort itself around that reply.',
  },
  {
    id: 'b-desk',
    kind: 'B',
    title: 'Desk weather',
    tags: ['desk', 'work', 'write'],
    hue: 'radial-gradient(circle at 28% 28%, #fffc, transparent 38%), radial-gradient(circle at 60% 60%, #e8c47a88, #3d2a1088 75%)',
    text:
      'Desk weather clears after one honest paragraph. Do not wait for the perfect hour; the hour becomes perfect once the first sentence lands.',
  },
  {
    id: 'b-orbit',
    kind: 'B',
    title: 'Near orbit',
    tags: ['solana', 'chain', 'code'],
    hue: 'radial-gradient(circle at 32% 26%, #fff8, transparent 40%), radial-gradient(circle at 65% 68%, #c4a0ff88, #2a184888 74%)',
    text:
      'Something in near orbit wants a smaller scope. Ship the narrow path; the wider map can wait until the first link holds.',
  },
  {
    id: 'b-threshold',
    kind: 'B',
    title: 'Threshold',
    tags: ['door', 'room', 'visit'],
    hue: 'radial-gradient(circle at 40% 30%, #fff9, transparent 42%), radial-gradient(circle at 50% 70%, #ffb8a088, #4a201888 70%)',
    text:
      'You are already on the threshold. Crossing does not need a speech — one step and the room will introduce itself.',
  },
];

/** C — personal slots; unlocked when visitor priorTopics touch these tags. */
export const PROPHECY_C: ProphecyRecord[] = [
  {
    id: 'c-return',
    kind: 'C',
    title: 'Your return',
    tags: ['mev', 'solana', 'hire', 'writing', 'glass', 'dj', 'music', 'agent'],
    hue: 'radial-gradient(circle at 30% 25%, #fff, transparent 36%), radial-gradient(circle at 70% 65%, #00ffea66, #004d4888 78%)',
    text:
      'This shelf kept a seat for you. The thread you left last time still has a loose end — pick it up gently; it wants to become a clean loop, not a knot.',
  },
  {
    id: 'c-mirror',
    kind: 'C',
    title: 'Mirror ask',
    tags: ['console', 'voice', 'machina', 'ailena', 'aileena', 'chat'],
    hue: 'radial-gradient(circle at 35% 28%, #fff8, transparent 40%), radial-gradient(circle at 55% 70%, #86efac88, #14532d88 76%)',
    text:
      'The mirror ask is simpler than it sounds: say what you actually need from this visit. The hall will answer in the dialog — not in the glass.',
  },
];

export const ALL_PROPHECIES: ProphecyRecord[] = [...PROPHECY_B, ...PROPHECY_C];

/** Soft match: any prior topic contains (or is contained by) a tag. */
export function visitorOwnsRecord(record: ProphecyRecord, priorTopics: string[]): boolean {
  if (record.kind === 'B') return true;
  if (!priorTopics.length) return false;
  const topics = priorTopics.map((t) => t.toLowerCase());
  return record.tags.some((tag) => {
    const t = tag.toLowerCase();
    return topics.some((topic) => topic.includes(t) || t.includes(topic));
  });
}

/** Prompt that streams prophecy into Console as a user ask → assistant reply path. */
export function prophecyAskPrompt(record: ProphecyRecord): string {
  return [
    'Read this prophecy aloud in the console as Aileena — warm, brief, no Harry Potter quotes, no spell names.',
    `Title: ${record.title}`,
    `Prophecy: ${record.text}`,
    'Then offer one short follow-up question if it fits.',
  ].join('\n');
}
