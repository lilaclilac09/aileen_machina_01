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
];

export const BLOG_SECTIONS = ['researchDispatch', 'investing', 'womanInTech', 'marsAndMoon'] as const;

export type BlogPostEntry = { href: string; title: string; description: string; date: string; section: string };

/** All internal /blog posts from the Dispatch rails, de-duplicated by href. */
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
