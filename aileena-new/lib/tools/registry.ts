export type ToolDefinition = {
  slug: string;
  tag: string;
  title: string;
  body: string;
  href: string;
  status: 'live' | 'beta';
  arcade: {
    glyph: string;
    players: string;
    screenGradient: string;
  };
};

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    slug: 'inkling-clips',
    tag: 'AUDIO · AI',
    title: 'Clip Quest',
    body:
      'Feed a YouTube episode into the machine. Inkling listens, picks highlights, ffmpeg cuts the tape.',
    href: '/tools/inkling-clips',
    status: 'live',
    arcade: {
      glyph: '▶',
      players: '1P',
      screenGradient: 'linear-gradient(160deg, #e7f7f5 0%, #d4efeb 45%, #f4f1ea 100%)',
    },
  },
  {
    slug: 'feed-flash',
    tag: 'RSS · QUIZ',
    title: 'Feed Flash',
    body:
      'Live headlines from the listening shelf — SemiAnalysis vs Asymmetrical Bets. Guess the source.',
    href: '/tools/feed-flash',
    status: 'live',
    arcade: {
      glyph: '☰',
      players: '1P',
      screenGradient: 'linear-gradient(160deg, #f3efe6 0%, #ebe4d6 45%, #fffdf7 100%)',
    },
  },
  {
    slug: 'chip-guess',
    tag: 'SEMIS · QUIZ',
    title: 'Chip Guess',
    body:
      'Read the specs on the cabinet screen. Three lives. Name the SKU before the tape runs out.',
    href: '/tools/chip-guess',
    status: 'live',
    arcade: {
      glyph: '◈',
      players: '1P',
      screenGradient: 'linear-gradient(160deg, #eef1f8 0%, #dde4f2 45%, #f4f1ea 100%)',
    },
  },
  {
    slug: 'pricing-slot',
    tag: 'DATA · SLOT',
    title: 'Pricing Slot',
    body:
      'Spin the reels on the tracked SKU catalogue. Latest per-chip price from data/pricing.jsonl.',
    href: '/tools/pricing-slot',
    status: 'live',
    arcade: {
      glyph: '$',
      players: '1P',
      screenGradient: 'linear-gradient(160deg, #f7f0e4 0%, #efe4d0 45%, #fffdf7 100%)',
    },
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOL_DEFINITIONS.find((t) => t.slug === slug);
}
