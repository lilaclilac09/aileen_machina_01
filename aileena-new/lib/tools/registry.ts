export type ToolDefinition = {
  slug: string;
  tag: string;
  title: string;
  body: string;
  href: string;
  status: 'live' | 'beta';
};

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    slug: 'inkling-clips',
    tag: 'AUDIO · AI',
    title: 'Inkling Clip Finder',
    body:
      'Paste a YouTube URL. Inkling listens to the full episode, picks the best moments (or searches a topic), refines cut points, and returns shareable clips.',
    href: '/tools/inkling-clips',
    status: 'live',
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOL_DEFINITIONS.find((t) => t.slug === slug);
}
