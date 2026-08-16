export type ToolMaturity = 'useful' | 'experiment' | 'paused';

export type ToolTier = 'featured' | 'utility' | 'experiment' | 'paused';

export type ToolDefinition = {
  slug: string;
  tag: string;
  title: string;
  body: string;
  why: string;
  verdict: string;
  href: string;
  /** Honest maturity — do not mark unfinished work as live. */
  status: ToolMaturity;
  tier: ToolTier;
  /** Existing public asset only. Omit when none exists. */
  screenshot?: string;
  arcade: {
    glyph: string;
    /** Flat fill for the geometric block (no border chrome). */
    screenGradient: string;
  };
};

/** Canonical Cafe Cursor redeem site (Shanghai credits). */
export const CAFE_CURSOR_URL = 'https://cursor-cafe.aileena.xyz/';

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    slug: 'cafe-cursor',
    tag: 'EVENT',
    title: 'Cafe Cursor',
    body: 'Claim Cursor credits for Cafe Cursor Shanghai — checked-in guests only.',
    why: 'The room needed a redeem path that was not a spreadsheet.',
    verdict: 'Actually useful when the room is real.',
    href: CAFE_CURSOR_URL,
    status: 'useful',
    tier: 'featured',
    arcade: {
      glyph: '◎',
      screenGradient: '#dde8e4',
    },
  },
  {
    slug: 'inkling-clips',
    tag: 'AUDIO',
    title: 'Audio Clipping',
    body: 'YouTube → short clips. No Inkling API, free-mode workaround.',
    why: 'Needed a cut without paying a listening API.',
    verdict: 'Small, ugly, useful.',
    href: '/tools/inkling-clips',
    status: 'useful',
    tier: 'utility',
    arcade: {
      glyph: '▶',
      screenGradient: '#d8eeeb',
    },
  },
  {
    slug: 'cafe-recap',
    tag: 'VIDEO',
    title: 'Cafe Recap Edit',
    body: 'Local JSON → ffmpeg recap loop. Plan, cut, verify.',
    why: 'A receipt from trying to edit an IRL night without opening CapCut first.',
    verdict: 'Not better than CapCut yet. Kept as an experiment.',
    href: '/tools/cafe-recap',
    status: 'experiment',
    tier: 'experiment',
    arcade: {
      glyph: '▣',
      screenGradient: '#e8efe8',
    },
  },
  {
    slug: 'feed-flash',
    tag: 'RSS',
    title: 'Feed Flash',
    body: 'Headline desk, not shipped.',
    why: 'Wanted a thin RSS surface on the same stack.',
    verdict: 'Paused. Not a product yet.',
    href: '/tools/feed-flash',
    status: 'paused',
    tier: 'paused',
    arcade: {
      glyph: '☰',
      screenGradient: '#ebe6db',
    },
  },
  {
    slug: 'chip-guess',
    tag: 'SEMIS',
    title: 'Chip Guess',
    body: 'Guess-the-die, not shipped.',
    why: 'A desk toy against the chip catalogue.',
    verdict: 'Paused. Not a product yet.',
    href: '/tools/chip-guess',
    status: 'paused',
    tier: 'paused',
    arcade: {
      glyph: '◇',
      screenGradient: '#e4e8f0',
    },
  },
  {
    slug: 'pricing-slot',
    tag: 'DATA',
    title: 'Pricing Lookup',
    body: 'SKU lookup, not shipped.',
    why: 'A slot for prices already in the site corpus.',
    verdict: 'Paused. Not a product yet.',
    href: '/tools/pricing-slot',
    status: 'paused',
    tier: 'paused',
    arcade: {
      glyph: '▢',
      screenGradient: '#efe6d6',
    },
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOL_DEFINITIONS.find((t) => t.slug === slug);
}
