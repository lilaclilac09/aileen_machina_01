function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export type ShelfSection = 'listen' | 'watch' | 'read' | 'living';
export type ShelfType = 'podcast' | 'film' | 'interview' | 'book' | 'note' | 'video';
export type ShelfObject = 'cover' | 'cassette' | 'spine' | 'slip';
export type ShelfRow = 'listen' | 'watch' | 'notes' | 'video' | 'living';
export type ShelfCoverKind = 'poster' | 'still' | 'spine' | 'object';

export type ShelfItem = {
  id: string;
  title: string;
  type: ShelfType;
  section: ShelfSection;
  row: ShelfRow;
  creator?: string;
  source?: string;
  note: string;
  tags?: string[];
  href?: string;
  cover?: string;
  coverKind?: ShelfCoverKind;
  featured?: boolean;
  object: ShelfObject;
};

type PodcastRec = {
  title: string;
  shelfTitle: string;
  label: string;
  meta: string;
  href: string;
  body: string;
  why?: string;
  signal?: string;
  tags?: string[];
  featured?: boolean;
  image?: string;
};

/** Kept as named blocks so `scripts/sync-content-memory.ts` can still parse the shelf. */
export const PODCAST_RECS: PodcastRec[] = [
  {
    title: 'Fashion Neurosis with Bella Freud',
    shelfTitle: 'Fashion Neurosis',
    label: 'podcast',
    meta: 'Kate Moss episode',
    href: 'https://open.spotify.com/episode/0ZxMxV8EiZ9DkAPJWU0If7',
    image: '/shelf/fashion-neurosis.jpg',
    body: 'A velvet couch, fashion as anxiety, and taste as confession rather than certainty.',
    why: 'A velvet couch, fashion as anxiety, and taste as confession rather than certainty.',
    tags: ['voice', 'taste', 'anxiety'],
    featured: true,
  },
  {
    title: 'Do You Read Her',
    shelfTitle: 'Do You Read Her',
    label: 'podcast',
    meta: 'episode · women reading women',
    href: 'https://open.spotify.com/episode/0cx1oBoJEwfaKGVbITcD5K',
    body: 'Private canon, women reading women, the voice as a room.',
    signal: 'Private canon, women reading women, the voice as a room.',
    tags: ['voice', 'reading', 'women'],
  },
];

export const DOCUMENTARY_RECS = [
  {
    title: 'Joan Didion: The Center Will Not Hold',
    shelfTitle: 'Joan Didion',
    year: '2018',
    label: 'writer / witness',
    href: 'https://www.rottentomatoes.com/m/joan_didion_the_center_will_not_hold',
    image: '/shelf/didion-center.jpg',
    note: 'Watch the sentence hold together while the world refuses to.',
    body: 'Watch the sentence hold together while the world refuses to.',
    tags: ['seeing', 'women'],
  },
  {
    title: 'Exhibition on Screen: David Hockney RA',
    shelfTitle: 'David Hockney',
    year: '2017',
    label: 'exhibition film',
    href: 'https://en.wikipedia.org/wiki/Exhibition_on_Screen',
    image: '/shelf/hockney-ra.jpg',
    note: 'Colour, scale, and the pleasure of looking slowly.',
    body: 'Colour, scale, and the pleasure of looking slowly.',
    tags: ['colour', 'seeing', 'studio'],
  },
  {
    title: 'A Bigger Splash',
    shelfTitle: 'A Bigger Splash',
    year: '1973',
    label: 'Hockney / pool',
    href: 'https://en.wikipedia.org/wiki/A_Bigger_Splash_(1973_film)',
    image: '/shelf/bigger-splash.jpg',
    note: 'Staged intimacy; the pool as a pose that will not stay still.',
    body: 'Staged intimacy; the pool as a pose that will not stay still.',
    tags: ['seeing'],
  },
];

export const FILM_RECS = [
  {
    title: 'Blue Is the Warmest Color',
    shelfTitle: 'Blue Is the Warmest Color',
    year: '2013',
    label: 'Léa · intimacy',
    href: 'https://en.wikipedia.org/wiki/Blue_Is_the_Warmest_Colour',
    image: '/shelf/blue-is-the-warmest-color.jpg',
    note: 'Honesty in the body — looking that does not flinch.',
    body: 'Honesty in the body — looking that does not flinch.',
    tags: ['seeing'],
  },
  {
    title: 'The French Dispatch',
    shelfTitle: 'The French Dispatch',
    year: '2021',
    label: 'magazine life · Léa',
    href: 'https://en.wikipedia.org/wiki/The_French_Dispatch',
    image: '/shelf/french-dispatch.jpg',
    note: 'The city dressed as a magazine; looking as layout.',
    body: 'The city dressed as a magazine; looking as layout.',
    tags: ['colour'],
  },
  {
    title: 'Spectre / No Time to Die',
    shelfTitle: 'Bond arc',
    year: '2015–21',
    label: 'Bond girl arc',
    href: 'https://en.wikipedia.org/wiki/No_Time_to_Die',
    image: '/shelf/no-time-to-die.jpg',
    note: 'Finish the arc. Clothes as the second script.',
    body: 'Finish the arc. Clothes as the second script.',
  },
  {
    title: 'The Crown',
    shelfTitle: 'The Crown',
    year: 'series',
    label: 'British public life',
    href: 'https://en.wikipedia.org/wiki/The_Crown_(TV_series)',
    image: '/shelf/the-crown.jpg',
    note: 'Power worn until the body is the office.',
    body: 'Power worn until the body is the office.',
  },
  {
    title: 'The Capture',
    shelfTitle: 'The Capture',
    year: 'series',
    label: 'new untrust',
    href: 'https://en.wikipedia.org/wiki/The_Capture_(TV_series)',
    image: '/shelf/the-capture.jpg',
    note: 'A world you cannot trust, framed as evidence.',
    body: 'A world you cannot trust, framed as evidence.',
  },
  {
    title: 'Bodyguard',
    shelfTitle: 'Bodyguard',
    year: '2018',
    label: 'BBC thriller',
    href: 'https://en.wikipedia.org/wiki/Bodyguard_(British_TV_series)',
    image: '/shelf/bodyguard.jpg',
    note: 'Same rooms, hotter pulse. Proximity as plot.',
    body: 'Same rooms, hotter pulse. Proximity as plot.',
  },
  {
    title: 'Miss Sloane',
    shelfTitle: 'Miss Sloane',
    year: '2016',
    label: 'lobby · power',
    href: 'https://en.wikipedia.org/wiki/Miss_Sloane',
    image: '/shelf/miss-sloane.jpg',
    note: 'Strategy as bloodsport. The voice does the cutting.',
    body: 'Strategy as bloodsport. The voice does the cutting.',
    tags: ['voice'],
  },
  {
    title: 'Ladies First',
    shelfTitle: 'Ladies First',
    year: '2026',
    label: 'Pike · Netflix',
    href: 'https://en.wikipedia.org/wiki/Ladies_First_(2026_film)',
    image: '/shelf/ladies-first.jpg',
    note: '',
    body: '',
    tags: ['seeing'],
  },
];

export const EURO_LIFE_GUIDE = [
  {
    title: 'Urban roam, not tourism',
    label: 'walk',
    body: 'Conversation over landmarks.',
    image: '/shelf/living-urban-roam.jpg',
  },
  {
    title: 'See in black and white',
    label: 'eye',
    body: 'Less color, more decision.',
    image: '/shelf/living-black-and-white.jpg',
  },
  {
    title: 'Language scraps',
    label: 'FR / IT',
    body: 'Enough to catch 20% of dialogue.',
    image: '/shelf/living-language.jpg',
  },
  {
    title: 'Wardrobe as Bond cool',
    label: 'cut',
    body: 'Fewer colors, better cut.',
    image: '/shelf/living-wardrobe.jpg',
  },
  {
    title: 'Slow museum',
    label: 'one room',
    body: 'Not the whole building.',
    image: '/shelf/living-museum.jpg',
  },
  {
    title: 'Table as ritual',
    label: 'kitchen',
    body: 'An ordinary meal, staged.',
    image: '/shelf/living-table.jpg',
  },
];

export const LIFESTYLE_RECS = [
  {
    title: 'Urban drift diary',
    label: 'weekly',
    body: 'Walk. Note light. Not a trip.',
    image: '/shelf/living-diary.jpg',
  },
  {
    title: 'One letter or collage page',
    label: 'paper',
    body: 'One page a week.',
    image: '/shelf/living-letter.jpg',
  },
  {
    title: 'Soundtrack as room',
    label: 'listen',
    body: 'Closer to cinema than algorithm pop.',
    image: '/shelf/living-soundtrack.jpg',
  },
  {
    title: 'Watch in pairs, not piles',
    label: 'pace',
    body: 'Texture over binge.',
    image: '/shelf/living-watch-pairs.jpg',
  },
];

export const CHANNEL_RECS = [
  {
    title: 'Asymmetrical Bets',
    shelfTitle: 'Asymmetrical Bets',
    label: 'markets',
    href: 'https://asymmetricalbets.substack.com',
    body: 'Narrative-driven market reading.',
    image: '/shelf/spine-asymmetrical-bets.png',
  },
  {
    title: 'SemiAnalysis',
    shelfTitle: 'SemiAnalysis',
    label: 'semis',
    href: 'https://www.semianalysis.com',
    body: 'Chips, clusters, bottlenecks.',
    image: '/shelf/spine-semianalysis.png',
  },
  {
    title: 'Branch Education',
    shelfTitle: 'Branch Education',
    label: 'YouTube',
    href: '/blog/semi-basics-review',
    body: 'Cache, PCB, GPU — five-minute review.',
    kind: 'video' as const,
  },
  {
    title: 'TPU & CPO (high-signal YouTube)',
    shelfTitle: 'TPU & CPO',
    label: 'video',
    href: '/blog/semi-watch-tpu-cpo',
    body: 'Ironwood, systolic array, CPO.',
    kind: 'video' as const,
  },
  {
    title: 'Software YouTube — MCP',
    shelfTitle: 'MCP',
    label: 'agents',
    href: '/blog/software-watch',
    body: 'What MCP is, then MCP vs API.',
    kind: 'video' as const,
  },
  {
    title: 'Post-Training Path',
    shelfTitle: 'Post-Training Path',
    label: 'SFT',
    href: '/blog/post-training-path',
    body: 'Rust, CLI, holdout, LoRA.',
    image: '/shelf/spine-post-training.png',
  },
  {
    title: 'Know Good Code. Own the Repo.',
    shelfTitle: 'Own the Repo',
    label: 'taste',
    href: '/blog/own-your-stack',
    body: 'Own the repo before you build.',
    image: '/shelf/spine-own-the-repo.png',
  },
];

/** First-laid clips as photo-real disc spines — notes later. Films stay posters. */
export const VIDEO_RECS = [
  {
    title: 'How does Computer Cache, Memory, and Storage Work?',
    shelfTitle: 'Cache',
    label: 'Branch Education',
    href: '/blog/semi-basics-review',
    image: '/shelf/spine-video-cache.png',
    note: '',
  },
  {
    title: 'What are PCBs? How do PCBs Work?',
    shelfTitle: 'PCB',
    label: 'Branch Education',
    href: '/blog/semi-basics-review',
    image: '/shelf/spine-video-pcb.png',
    note: '',
  },
  {
    title: 'How do Graphics Cards Work? Exploring GPU Architecture',
    shelfTitle: 'GPU',
    label: 'Branch Education',
    href: '/blog/semi-basics-review',
    image: '/shelf/spine-video-gpu.png',
    note: '',
  },
  {
    title: 'NVIDIA official deep dive — CPO switch',
    shelfTitle: 'NVIDIA CPO',
    label: 'TPU & CPO',
    href: '/blog/semi-watch-tpu-cpo',
    image: '/shelf/spine-video-nvidia-cpo.png',
    note: '',
  },
  {
    title: 'Broadcom CPO technology breakthrough (official)',
    shelfTitle: 'Broadcom CPO',
    label: 'TPU & CPO',
    href: '/blog/semi-watch-tpu-cpo',
    image: '/shelf/spine-video-broadcom-cpo.png',
    note: '',
  },
  {
    title: 'Ironwood (7th-gen TPU) — official unbox + lab footage',
    shelfTitle: 'Ironwood',
    label: 'TPU & CPO',
    href: '/blog/semi-watch-tpu-cpo',
    image: '/shelf/spine-video-ironwood.png',
    note: '',
  },
  {
    title: 'What is the Model Context Protocol (MCP)?',
    shelfTitle: 'MCP',
    label: 'Software YouTube',
    href: '/blog/software-watch',
    image: '/shelf/spine-video-mcp.png',
    note: '',
  },
];

export const SHELF_GROUPS: {
  section: ShelfSection;
  label: string;
  anchors: string[];
}[] = [
  { section: 'listen', label: 'listen', anchors: ['featured-listen', 'podcasts'] },
  { section: 'watch', label: 'watch', anchors: ['watch', 'films', 'documentaries'] },
  { section: 'read', label: 'read', anchors: ['channels', 'video'] },
  { section: 'living', label: 'living', anchors: ['euro-life', 'lifestyle'] },
];

export const SHELF_ITEMS: ShelfItem[] = [
  ...PODCAST_RECS.map((item) => ({
    id: slugify(item.shelfTitle),
    title: item.shelfTitle,
    type: 'podcast' as const,
    section: 'listen' as const,
    row: 'listen' as const,
    creator: item.meta,
    source: item.title,
    note: item.why ?? item.signal ?? item.body,
    tags: item.tags,
    href: item.href,
    cover: item.image,
    coverKind: item.image ? ('poster' as const) : undefined,
    featured: Boolean(item.featured),
    object: item.image ? ('cover' as const) : ('cassette' as const),
  })),
  ...DOCUMENTARY_RECS.map((item) => ({
    id: slugify(item.shelfTitle),
    title: item.shelfTitle,
    type: 'film' as const,
    section: 'watch' as const,
    row: 'watch' as const,
    creator: item.label,
    source: `${item.title} · ${item.year}`,
    note: item.note,
    tags: item.tags,
    href: item.href,
    cover: item.image,
    coverKind: 'poster' as const,
    object: 'cover' as const,
  })),
  ...FILM_RECS.map((item) => ({
    id: slugify(item.shelfTitle),
    title: item.shelfTitle,
    type: 'film' as const,
    section: 'watch' as const,
    row: 'watch' as const,
    creator: item.label,
    source: `${item.title} · ${item.year}`,
    note: item.note,
    tags: item.tags,
    href: item.href,
    cover: item.image,
    coverKind: 'poster' as const,
    object: 'cover' as const,
  })),
  ...CHANNEL_RECS.filter((item) => item.kind !== 'video').map((item) => ({
    id: slugify(item.shelfTitle),
    title: item.shelfTitle,
    type: 'note' as const,
    section: 'read' as const,
    row: 'notes' as const,
    creator: item.label,
    source: item.title,
    note: item.body,
    href: item.href,
    cover: item.image,
    coverKind: item.image ? ('spine' as const) : undefined,
    object: item.image ? ('cover' as const) : ('spine' as const),
  })),
  ...VIDEO_RECS.map((item) => ({
    id: slugify(item.shelfTitle),
    title: item.shelfTitle,
    type: 'video' as const,
    section: 'read' as const,
    row: 'video' as const,
    creator: item.label,
    source: item.title,
    note: item.note,
    href: item.href,
    cover: item.image,
    coverKind: 'spine' as const,
    object: 'cover' as const,
  })),
  ...EURO_LIFE_GUIDE.map((item) => ({
    id: slugify(item.title),
    title: item.title,
    type: 'note' as const,
    section: 'living' as const,
    row: 'living' as const,
    creator: item.label,
    note: item.body,
    cover: item.image,
    coverKind: 'object' as const,
    object: 'cover' as const,
  })),
  ...LIFESTYLE_RECS.map((item) => ({
    id: slugify(item.title),
    title: item.title,
    type: 'note' as const,
    section: 'living' as const,
    row: 'living' as const,
    creator: item.label,
    note: item.body,
    cover: item.image,
    coverKind: 'object' as const,
    object: 'cover' as const,
  })),
];

export const FEATURED_SHELF_ID =
  SHELF_ITEMS.find((item) => item.featured)?.id ?? SHELF_ITEMS[0].id;

export const SHELF_HASH_ALIASES: Record<string, string> = {
  'featured-listen': FEATURED_SHELF_ID,
  podcasts: FEATURED_SHELF_ID,
  listen: FEATURED_SHELF_ID,
  watch: 'joan-didion',
  documentaries: 'joan-didion',
  films: 'blue-is-the-warmest-color',
  channels: 'asymmetrical-bets',
  read: 'asymmetrical-bets',
  video: 'cache',
  'euro-life': 'urban-roam-not-tourism',
  lifestyle: 'urban-drift-diary',
};

export const SHELF_ROW_LABEL: Partial<Record<ShelfRow, string>> = {
  notes: 'notes',
  video: 'video',
};

export function shelfRowsInSection(section: ShelfSection): { row: ShelfRow; label: string | null; items: ShelfItem[] }[] {
  const rows: { row: ShelfRow; label: string | null; items: ShelfItem[] }[] = [];
  for (const item of SHELF_ITEMS.filter((entry) => entry.section === section)) {
    const last = rows[rows.length - 1];
    if (last && last.row === item.row) {
      last.items.push(item);
      continue;
    }
    rows.push({
      row: item.row,
      label: SHELF_ROW_LABEL[item.row] ?? null,
      items: [item],
    });
  }
  return rows;
}

export function shelfItemById(id: string): ShelfItem | undefined {
  return SHELF_ITEMS.find((item) => item.id === id);
}

export function resolveShelfHash(hash: string): string {
  const raw = decodeURIComponent(hash.replace(/^#/, '')).trim();
  if (!raw) return FEATURED_SHELF_ID;
  if (shelfItemById(raw)) return raw;
  return SHELF_HASH_ALIASES[raw] ?? FEATURED_SHELF_ID;
}
