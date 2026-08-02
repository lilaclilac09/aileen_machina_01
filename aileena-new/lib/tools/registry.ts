export type ToolDefinition = {
  slug: string;
  tag: string;
  title: string;
  body: string;
  href: string;
  status: 'live' | 'beta' | 'tbc';
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
    href: CAFE_CURSOR_URL,
    status: 'live',
    arcade: {
      glyph: '◎',
      screenGradient: '#dde8e4',
    },
  },
  {
    slug: 'inkling-clips',
    tag: 'AUDIO',
    title: 'Audio Clipping',
    body:
      'YouTube → short clips. No Inkling API needed — free silence cuts.',
    href: '/tools/inkling-clips',
    status: 'live',
    arcade: {
      glyph: '▶',
      screenGradient: '#d8eeeb',
    },
  },
  {
    slug: 'feed-flash',
    tag: 'RSS',
    title: 'Feed Flash',
    body: 'TBC',
    href: '/tools/feed-flash',
    status: 'tbc',
    arcade: {
      glyph: '☰',
      screenGradient: '#ebe6db',
    },
  },
  {
    slug: 'chip-guess',
    tag: 'SEMIS',
    title: 'Chip Guess',
    body: 'TBC',
    href: '/tools/chip-guess',
    status: 'tbc',
    arcade: {
      glyph: '◇',
      screenGradient: '#e4e8f0',
    },
  },
  {
    slug: 'pricing-slot',
    tag: 'DATA',
    title: 'Pricing Lookup',
    body: 'TBC',
    href: '/tools/pricing-slot',
    status: 'tbc',
    arcade: {
      glyph: '▢',
      screenGradient: '#efe6d6',
    },
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOL_DEFINITIONS.find((t) => t.slug === slug);
}
