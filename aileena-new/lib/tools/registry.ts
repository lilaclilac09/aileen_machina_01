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

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    slug: 'inkling-clips',
    tag: 'AUDIO',
    title: 'Audio Clipping',
    body:
      'YouTube → Inkling → ffmpeg. Browser Run when host is ready; CLI always available.',
    href: '/tools/inkling-clips',
    status: 'live',
    arcade: {
      glyph: '▶',
      screenGradient: '#d8eeeb',
    },
  },
  {
    slug: 'cafe-cursor',
    tag: 'EVENT',
    title: 'Cafe Cursor',
    body: 'Claim Cursor credits for Cafe Cursor Shanghai — checked-in guests only.',
    href: 'https://cursor-cafe.aileena.xyz/',
    status: 'live',
    arcade: {
      glyph: '◎',
      screenGradient: '#dde8e4',
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
