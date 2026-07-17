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
      screenGradient: 'linear-gradient(180deg, #12352f 0%, #071816 55%, #020807 100%)',
    },
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOL_DEFINITIONS.find((t) => t.slug === slug);
}
