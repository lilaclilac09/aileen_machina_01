/**
 * Aggregates every notes category for the redesigned /dispatch page.
 *
 * Every category is one of Aileen's own published rails — no external
 * links, no placeholders. Sourced from translations.ts so the lists stay
 * in lockstep with the rest of the site as articles are added.
 *
 * To add a new tab built from her own articles: extend translations.ts
 * with a new rail, then add one block below.
 */

import type { NoteItem, NotesCategory } from './types';
import { t, type Language } from '../translations';

type Post = { title: string; href: string; date: string };

function postsToItems(posts: readonly Post[]): NoteItem[] {
  return [...posts].reverse().map((post) => ({
    id: post.href.replace(/^\/blog\//, '') || post.title.toLowerCase().replace(/\s+/g, '-'),
    title: post.title,
    author: post.date,
    url: post.href,
  }));
}

export function getCategories(language: Language): NotesCategory[] {
  const tx = t[language];

  return [
    { slug: 'dispatch', label: 'Dispatch', items: postsToItems(tx.blog.researchDispatch.posts) },
    { slug: 'investing', label: 'Investing', items: postsToItems(tx.blog.investing.posts) },
    { slug: 'perspective', label: 'Perspective', items: postsToItems(tx.blog.womanInTech.posts) },
  ];
}
