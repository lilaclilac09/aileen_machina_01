/**
 * Daily draw deck — site lines, not astrology.
 * Recite only. Each card links a real desk / room on aileena.xyz.
 */

export type DrawRoom = 'kiln' | 'shelf' | 'wire' | 'desk' | 'door';

export type DrawCard = {
  id: string;
  room: DrawRoom;
  title: string;
  recitation: string;
  href: string;
};

const ORIGIN = 'https://aileena.xyz';

export const DRAW_DECK: readonly DrawCard[] = [
  // kiln
  {
    id: 'kiln-heat',
    room: 'kiln',
    title: 'Kiln heat',
    recitation: 'The kiln is still warm. Colour, powder, patience — sit with the bench.',
    href: `${ORIGIN}/#glass-bench`,
  },
  {
    id: 'kiln-pate',
    room: 'kiln',
    title: 'Pâte de verre',
    recitation: 'Glass wants a slow fire. Keep the question small; the form will cool.',
    href: `${ORIGIN}/blog/pate-de-verre`,
  },
  {
    id: 'kiln-light',
    room: 'kiln',
    title: 'Let there be light',
    recitation: 'Light is a material here. Follow it to the bench, not to a slogan.',
    href: `${ORIGIN}/blog/let-there-be-light`,
  },
  {
    id: 'kiln-pages',
    room: 'kiln',
    title: 'Metal & Pages',
    recitation: 'Fired work lives with the pages. The kiln and the desk share one shelf.',
    href: `${ORIGIN}/updates`,
  },
  {
    id: 'kiln-clear',
    room: 'kiln',
    title: 'Clear bench',
    recitation: 'Clear the bench before the next fire. One object. One heat.',
    href: `${ORIGIN}/#glass-bench`,
  },
  {
    id: 'kiln-powder',
    room: 'kiln',
    title: 'Powder first',
    recitation: 'Powder before flame. Sequence is the craft.',
    href: `${ORIGIN}/blog/pate-de-verre`,
  },
  {
    id: 'kiln-cool',
    room: 'kiln',
    title: 'Cool slowly',
    recitation: 'Do not rush the cool-down. The piece remembers haste.',
    href: `${ORIGIN}/#glass-bench`,
  },
  {
    id: 'kiln-trust',
    room: 'kiln',
    title: 'Kiln trust',
    recitation: 'Trust the fire you already set. Check the bench; then leave it to work.',
    href: `${ORIGIN}/updates`,
  },
  // shelf
  {
    id: 'shelf-listen',
    room: 'shelf',
    title: 'Listening shelf',
    recitation: 'The shelf is films, podcasts, living notes — not a moodboard dump.',
    href: `${ORIGIN}/blog/watch-listening-shelf`,
  },
  {
    id: 'shelf-set',
    room: 'shelf',
    title: 'DJ set',
    recitation: 'The set is on the sound desk. One track, then the next. No shuffle sermon.',
    href: `${ORIGIN}/sound#dj-set`,
  },
  {
    id: 'shelf-didion',
    room: 'shelf',
    title: 'Didion seat',
    recitation: 'A Didion sentence is already on the shelf. Read it once, slowly.',
    href: `${ORIGIN}/blog/watch-listening-shelf`,
  },
  {
    id: 'shelf-hockney',
    room: 'shelf',
    title: 'Hockney light',
    recitation: 'Hockney light is on the shelf. Look, then go back to your own colour.',
    href: `${ORIGIN}/blog/watch-listening-shelf`,
  },
  {
    id: 'shelf-memory',
    room: 'shelf',
    title: 'How the site remembers',
    recitation: 'Memory lives in files, not in a vibe. The shelf is indexed; retrieve, do not guess.',
    href: `${ORIGIN}/blog/machina-memory`,
  },
  {
    id: 'shelf-track',
    room: 'shelf',
    title: 'Track waiting',
    recitation: 'A track is waiting on the deck. Play it. Do not curate the whole night first.',
    href: `${ORIGIN}/sound#dj-set`,
  },
  {
    id: 'shelf-film',
    room: 'shelf',
    title: 'One film',
    recitation: 'Pick one film from the shelf. Finish it. The rest can wait.',
    href: `${ORIGIN}/blog/watch-listening-shelf`,
  },
  {
    id: 'shelf-repeat',
    room: 'shelf',
    title: 'Soft repeat',
    recitation: 'Repeat is allowed. The shelf does not punish a second listen.',
    href: `${ORIGIN}/sound#dj-set`,
  },
  // wire
  {
    id: 'wire-cli',
    room: 'wire',
    title: 'Thin CLI',
    recitation: 'A thin CLI does almost nothing itself. That is the point. Wire, then stop.',
    href: `${ORIGIN}/blog/cli`,
  },
  {
    id: 'wire-line',
    room: 'wire',
    title: 'The wire',
    recitation: 'Two CLIs, one prompt. Keep the wire short.',
    href: `${ORIGIN}/blog/wire`,
  },
  {
    id: 'wire-speed',
    room: 'wire',
    title: 'Wire speed',
    recitation: 'Packets first, runtime second. The interesting work is on the wire.',
    href: `${ORIGIN}/blog/wire-speed`,
  },
  {
    id: 'wire-tiles',
    room: 'wire',
    title: 'Validator tiles',
    recitation: 'Tiles on the wire. Scope the one you can name.',
    href: `${ORIGIN}/blog/validator-clients`,
  },
  {
    id: 'wire-stack',
    room: 'wire',
    title: 'Own the stack',
    recitation: 'Name the stack you actually run. Borrowed brains do not count as owned.',
    href: `${ORIGIN}/blog/own-your-stack`,
  },
  {
    id: 'wire-local',
    room: 'wire',
    title: 'Local models',
    recitation: 'A small local model is a measurement, not a personality. Keep the loop honest.',
    href: `${ORIGIN}/blog/local-models`,
  },
  {
    id: 'wire-orb',
    room: 'wire',
    title: 'Console orb',
    recitation: 'Voice is the wire. The dialog is where answers land. Nothing writes the disk.',
    href: `${ORIGIN}/blog/console-orb`,
  },
  // desk
  {
    id: 'desk-upstairs',
    room: 'desk',
    title: 'Desk upstairs',
    recitation: 'The desk upstairs is the entrance. One honest paragraph, then the rest of the house.',
    href: `${ORIGIN}/`,
  },
  {
    id: 'desk-work',
    room: 'desk',
    title: 'Selected work',
    recitation: 'The work is listed. Pick one repo. Do not tour all six.',
    href: `${ORIGIN}/works`,
  },
  {
    id: 'desk-dispatch',
    room: 'desk',
    title: 'Dispatch',
    recitation: 'Dispatch is the research desk. Read the latest note; skip the archive binge.',
    href: `${ORIGIN}/dispatch`,
  },
  {
    id: 'desk-memory',
    room: 'desk',
    title: 'Files on the desk',
    recitation: 'What the site remembers is on the desk as Markdown. Retrieve, then speak.',
    href: `${ORIGIN}/blog/machina-memory`,
  },
  {
    id: 'desk-research',
    room: 'desk',
    title: 'Research rack',
    recitation: 'The magazine rack is one question per issue. Do not open every drawer.',
    href: `${ORIGIN}/research`,
  },
  {
    id: 'desk-sentence',
    room: 'desk',
    title: 'First sentence',
    recitation: 'Desk weather clears after one sentence. Start there.',
    href: `${ORIGIN}/`,
  },
  {
    id: 'desk-note',
    room: 'desk',
    title: 'Leave a note',
    recitation: 'If it is for her, leave a note. The transcript travels with it.',
    href: `${ORIGIN}/`,
  },
  // door
  {
    id: 'door-directory',
    room: 'door',
    title: 'Doors',
    recitation: 'The directory is the map. One door is enough.',
    href: `${ORIGIN}/doors`,
  },
  {
    id: 'door-threshold',
    room: 'door',
    title: 'Threshold',
    recitation: 'You are already on the threshold. One step. No speech required.',
    href: `${ORIGIN}/doors`,
  },
  {
    id: 'door-hall',
    room: 'door',
    title: 'Prophecy hall',
    recitation: 'The hall is a room, not a forecast. Touch one orb; come back to the desk.',
    href: `${ORIGIN}/prophecy`,
  },
  {
    id: 'door-updates',
    room: 'door',
    title: 'Updates door',
    recitation: 'What changed is behind this door. Read the shelf; do not invent old posts.',
    href: `${ORIGIN}/updates`,
  },
  {
    id: 'door-tools',
    room: 'door',
    title: 'Tools door',
    recitation: 'Tools live on their own page. Use one. Leave the rest on the hook.',
    href: `${ORIGIN}/tools`,
  },
  {
    id: 'door-sound',
    room: 'door',
    title: 'Sound door',
    recitation: 'Sound is its own room. The kiln is not here — visual stays on home.',
    href: `${ORIGIN}/sound`,
  },
] as const;

export const DRAW_DECK_SIZE = DRAW_DECK.length;

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function cardById(id: string): DrawCard | undefined {
  return DRAW_DECK.find((c) => c.id === id);
}

/** Stable card for a Taipei civil day (+ optional visitor salt). */
export function pickDrawCard(day: string, visitorSalt = ''): DrawCard {
  const idx = djb2(`${day}:${visitorSalt}`) % DRAW_DECK.length;
  return DRAW_DECK[idx];
}

export function reciteDrawCard(card: DrawCard): string {
  return `${card.title} — ${card.room}.\n${card.recitation}\n${card.href}`;
}
