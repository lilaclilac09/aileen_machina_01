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
    slug: 'ai-factory-sim',
    tag: 'SIM',
    title: 'AI Factory Sim',
    body: 'DSX shell with SemiAnalysis-style power, cooling and gap stressors.',
    why: 'Omniverse DSX is too heavy for a personal page; this keeps the twin idea visible in-browser.',
    verdict: 'Experiment. 800VDC, VR NVL72 and flaw toggles, no fake Omniverse stream.',
    href: '/tools/ai-factory-sim',
    status: 'experiment',
    tier: 'experiment',
    arcade: {
      glyph: '▦',
      screenGradient: '#d8eeeb',
    },
  },
  {
    slug: 'machina-college',
    tag: 'DESK',
    title: 'Machina College',
    body: 'Hear the sentence, then one book. Not a diagnosis. Not a therapist.',
    why: 'The console already had the shelf. The tools hub had no door for it.',
    verdict: 'Psychoeducation. One school, one title. Maps are not a license.',
    href: '/tools/machina-college',
    status: 'useful',
    tier: 'utility',
    arcade: {
      glyph: '¶',
      screenGradient: '#e7efe8',
    },
  },
  {
    slug: 'agent-gateway',
    tag: 'OSS',
    title: 'Agent-Gateway',
    body: 'Official keys stay on your box. Agents get a gateway key.',
    why: 'One local door for a person or a small team, without sharing console keys.',
    verdict: 'Runs on your machine. This page does not host the gateway.',
    href: '/tools/agent-gateway',
    status: 'useful',
    tier: 'utility',
    arcade: {
      glyph: '⇄',
      screenGradient: '#d8eeeb',
    },
  },
  {
    slug: 'computers',
    tag: 'AGENT',
    title: 'Computers',
    body: 'Two machines for the site agent. Cloudflare worker-shell, and a Railway sandbox over SSH.',
    why: 'The dialog had one computer. Railway SSH is a second VM, opened with ssh sandbox@railway.new.',
    verdict: 'Experiment. The page does not open a shell. Say railway vm in the owner dialog.',
    href: '/tools/computers',
    status: 'experiment',
    tier: 'experiment',
    arcade: {
      glyph: '⌨',
      screenGradient: '#e7efe8',
    },
  },
  {
    slug: 'computer',
    tag: 'AGENT',
    title: 'Computer',
    body: 'Owner computer in the site-agent dialog. Same window as chat. Not a second harness page.',
    why: 'Heavy work was growing a window next to Console. The dialog already had a mouth.',
    verdict: 'Experiment. Local shim. Not Cloudflare Computer. Merge stays blocked.',
    href: '/tools/computer',
    status: 'experiment',
    tier: 'experiment',
    arcade: {
      glyph: '⌘',
      screenGradient: '#dceee9',
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
