/** Mix receipt + SoundCloud-ready copy. Dry, editorial — not EDM-bro. */

export type MixEvent = {
  atSec: number;
  kind: 'play' | 'pause' | 'load' | 'xfade' | 'record-start' | 'record-stop';
  deck?: 'A' | 'B';
  title?: string;
  xfade?: number;
};

export type MixTrackInfo = {
  deck: 'A' | 'B';
  title: string;
  fileName?: string | null;
  bpm?: number | null;
  durationSec?: number | null;
};

export type MixReceiptInput = {
  recordedAt: Date;
  durationSec: number;
  tracks: MixTrackInfo[];
  events: MixEvent[];
  notes?: string;
};

export type MixReceipt = {
  title: string;
  date: string;
  mood: string;
  description: string;
  tracklist: string;
  timestamps: string;
  tags: string[];
  soundcloudCaption: string;
  coverPrompt: string;
  notes: string;
};

function pad(n: number): string {
  const s = Math.max(0, Math.floor(n));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function avgBpm(tracks: MixTrackInfo[]): number | null {
  const xs = tracks.map((t) => t.bpm).filter((b): b is number => typeof b === 'number' && b > 0);
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function moodFromBpm(bpm: number | null): string {
  if (bpm == null) return 'unmeasured';
  if (bpm < 100) return 'low ceiling';
  if (bpm < 118) return 'walking pace';
  if (bpm < 128) return 'late room';
  return 'harder floor';
}

function dateLine(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildMixReceipt(input: MixReceiptInput): MixReceipt {
  const date = dateLine(input.recordedAt);
  const named = input.tracks.filter((t) => t.title.trim());
  const first = named[0]?.title ?? 'untitled';
  const last = named.length > 1 ? named[named.length - 1]?.title : null;
  const title = last && last !== first ? `${first} → ${last}` : `${first} — desk mix`;
  const bpm = avgBpm(named);
  const mood = moodFromBpm(bpm);

  const tracklist = named.length
    ? named
        .map((t, i) => {
          const bpmBit = t.bpm ? ` · ${Math.round(t.bpm)} BPM` : '';
          return `${String(i + 1).padStart(2, '0')}  Deck ${t.deck}  ${t.title}${bpmBit}`;
        })
        .join('\n')
    : '(no mix sources loaded)';

  const playEvents = input.events.filter((e) => e.kind === 'play' && e.title);
  const timestamps = playEvents.length
    ? playEvents.map((e) => `${pad(e.atSec)}  Deck ${e.deck ?? '?'}  ${e.title}`).join('\n')
    : named.map((t) => `00:00  Deck ${t.deck}  ${t.title}`).join('\n') || '—';

  const description = [
    `A short mix cut on the aileena desk. ${named.length} source${named.length === 1 ? '' : 's'}.`,
    bpm ? `Average marked tempo ${Math.round(bpm)} BPM — ${mood}.` : 'Tempo unmarked; no beat grid claimed.',
    `Runtime ${pad(input.durationSec)}.`,
  ].join(' ');

  const tags = [
    'aileena',
    'desk mix',
    'two decks',
    mood,
    bpm ? `${Math.round(bpm)}bpm` : 'unmeasured-bpm',
  ];

  const soundcloudCaption = [
    title,
    '',
    description,
    '',
    'Tracklist',
    tracklist,
    '',
    'Timestamps',
    timestamps,
    '',
    input.notes?.trim() ? `Notes\n${input.notes.trim()}` : '',
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n')
    .trim();

  const coverPrompt =
    'Dark teal mixer, two platters, thin cream type, night desk, no logos, no neon, still photograph, editorial.';

  return {
    title,
    date,
    mood,
    description,
    tracklist,
    timestamps,
    tags,
    soundcloudCaption,
    coverPrompt,
    notes: input.notes?.trim() ?? '',
  };
}

export function receiptToJson(receipt: MixReceipt, extra: Record<string, unknown> = {}): string {
  return JSON.stringify(
    {
      ...receipt,
      ...extra,
      soundcloud: {
        upload: 'manual',
        page: 'https://soundcloud.com/upload',
        note: 'export ready for SoundCloud — no OAuth in v1',
      },
    },
    null,
    2,
  );
}

export function receiptToText(receipt: MixReceipt): string {
  return [
    receipt.title,
    receipt.date,
    `mood: ${receipt.mood}`,
    '',
    receipt.description,
    '',
    'Tracklist',
    receipt.tracklist,
    '',
    'Timestamps',
    receipt.timestamps,
    '',
    `tags: ${receipt.tags.join(', ')}`,
    '',
    'SoundCloud caption',
    receipt.soundcloudCaption,
    '',
    'Cover prompt',
    receipt.coverPrompt,
    receipt.notes ? `\nNotes\n${receipt.notes}` : '',
  ].join('\n');
}
