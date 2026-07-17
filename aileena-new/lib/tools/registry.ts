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
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOL_DEFINITIONS.find((t) => t.slug === slug);
}
