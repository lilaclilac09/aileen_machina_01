/**
 * SEO helpers: canonical base, default copy, JSON-LD, and per-page metadata
 * for client pages (which cannot export `metadata` themselves). Copy here is
 * taken from existing site text (public/llms.txt, translations, tool registry).
 * Not imported by any /api route, so the Machina prompt prefix is unaffected.
 */
import type { Metadata } from 'next';
import { t } from './translations';
import { getToolBySlug } from './tools/registry';
import { DEFAULT_OG_IMAGE, isoDate } from './jsonLd';

export * from './jsonLd';

/** Public, indexable pages only. Noindex pages, redirects and canonical-elsewhere routes stay out. */
export const STATIC_PATHS = [
  '/',
  '/dispatch',
  '/sound',
  '/works',
  '/tools',
  '/tools/tamper-check',
  '/tools/cafe-recap',
  '/tools/ai-factory-sim',
  '/tools/intent',
  '/tools/machina-college',
  '/tools/agent-gateway',
  '/tools/agent-gateway/use',
  '/tools/computer',
  '/audio-clipping',
  '/api-docs',
  '/privacy',
  '/daily',
  '/updates',
  '/doors',
  '/prophecy',
];

export const BLOG_SECTIONS = ['researchDispatch', 'investing', 'womanInTech', 'marsAndMoon'] as const;

export type BlogPostEntry = { href: string; title: string; description: string; date: string; section: string };

/**
 * Public /blog posts that are not on a Dispatch rail. Title, dek and date are
 * copied from each page's own <SubstackShell> props (dek as plain text).
 */
export const EXTRA_POSTS: BlogPostEntry[] = [
  {
    href: '/blog/cex-dex-dashboard',
    title: 'The Darkest Dashboard',
    description:
      'The companion piece to The Darkest Trade — the SQL side. Public dashboards give you the headline number; this is how you build one that answers your own question. Block-level profit queries, markout methodology, searcher clustering, the Solana variant, and what no query on earth can show you about the off-chain leg.',
    date: '2026.05.21',
    section: 'other',
  },
  {
    href: '/blog/console-orb',
    title: 'How the Console Speaks',
    description:
      'The orb is a microphone with manners. The brain stays DeepSeek. Soft hints stay kind. Code proposals never touch the disk — and iPhone Safari taught us which laws are real.',
    date: '2026.08.05',
    section: 'other',
  },
  {
    href: '/blog/degen',
    title: 'The SF Degen Playbook',
    description:
      'In SF, the best traders are the ones who write their own tools. Wallet tracking, MEV exposure mapping, liquidity skew detection — not alpha you buy, alpha you build.',
    date: '2026.05.18',
    section: 'other',
  },
  {
    href: '/blog/machina-computer',
    title: 'Computer Lives in the Dialog',
    description:
      'The site agent already has a mouth. Computer is a tool in that same Console — not a second window, not a typed owner secret, not Cloudflare Computer, and never a merge. The door is KeyShield.',
    date: '2026.08.26',
    section: 'other',
  },
  {
    href: '/blog/machina-memory',
    title: 'How the Site Remembers',
    description:
      'Not a vector warehouse. Markdown in git, TF-IDF at build, soft Redis per visitor, Dreaming on a timer — and the real console questions that broke it until we fixed the route.',
    date: '2026.07.29',
    section: 'other',
  },
  {
    href: '/blog/pate-de-verre',
    title: 'How I Made These — Glass, Powder by Powder',
    description:
      "These little squares are pâte de verre — 'paste of glass.' No pouring, no blowing. Just colored glass powder, packed into a mold by hand, and a kiln you have to trust. Here's the whole process, step by step, the way I actually do it.",
    date: '2026.05.30',
    section: 'other',
  },
  {
    href: '/blog/wire-speed',
    title: 'Solana at Wire Speed',
    description:
      'A Jupiter swap, an NFT mint, a $40k liquidation — all of it crosses through a validator in 400 milliseconds. Four open-source projects are racing to make that machine faster, surgically modifiable, rewindable, and dissectible on a laptop.',
    date: '2026.05.20',
    section: 'other',
  },
];

/** All internal /blog posts: Dispatch rails first, then EXTRA_POSTS; de-duplicated by href. */
export function blogPosts(): BlogPostEntry[] {
  const seen = new Set<string>();
  const out: BlogPostEntry[] = [];
  for (const section of BLOG_SECTIONS) {
    for (const p of t.EN.blog[section].posts) {
      if (!p.href.startsWith('/blog/') || seen.has(p.href)) continue;
      seen.add(p.href);
      out.push({ href: p.href, title: p.title, description: p.body, date: p.date, section });
    }
  }
  for (const p of EXTRA_POSTS) {
    if (seen.has(p.href)) continue;
    seen.add(p.href);
    out.push(p);
  }
  return out;
}

/** Metadata for app/blog/<slug>/layout.tsx. Explainer subpages inherit this canonical. */
export function postMetadata(href: string): Metadata {
  const post = blogPosts().find((p) => p.href === href);
  if (!post) return { alternates: { canonical: href } };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: href },
    openGraph: { type: 'article', title: post.title, description: post.description, url: href, publishedTime: isoDate(post.date), images: [DEFAULT_OG_IMAGE] },
    twitter: { card: 'summary_large_image', title: post.title, description: post.description, images: [DEFAULT_OG_IMAGE] },
  };
}

/** Metadata for /tools/<slug> from the tool registry copy. */
export function toolMetadata(slug: string, extra: Metadata = {}): Metadata {
  const tool = getToolBySlug(slug);
  return {
    ...(tool ? { title: tool.title, description: tool.body } : {}),
    ...extra,
  };
}

export const NOINDEX: Metadata['robots'] = { index: false, follow: true };
