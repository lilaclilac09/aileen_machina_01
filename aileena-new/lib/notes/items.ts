/**
 * Aggregates every notes category for the redesigned /dispatch page.
 *
 *  - "Dispatch" is synthesised at request time from translations.ts so it
 *    stays in lockstep with the rest of the site as articles are added.
 *  - Everything else ("Solana", "Berlin", "Playlists", whatever Aileen
 *    adds later) reads from /aileena-new/data/notes/{slug}.json.
 *
 * To add a new category: drop a JSON file under data/notes/ matching the
 * NoteItem shape (see types.ts), then add one import + one push() below.
 */

import type { NoteItem, NotesCategory } from './types';
import solanaItems from '../../data/notes/solana.json';
import berlinItems from '../../data/notes/berlin.json';
import playlistsItems from '../../data/notes/playlists.json';
import { t, type Language } from '../translations';

export function getCategories(language: Language): NotesCategory[] {
  const tx = t[language];

  // Dispatch — Aileen's own published research dispatch articles.
  // Synthesised so the tab stays current as posts are added/removed in
  // translations.ts; visitors never see a stale list.
  const dispatchItems: NoteItem[] = [...tx.blog.researchDispatch.posts]
    .reverse()
    .map((post) => ({
      id: post.href.replace(/^\/blog\//, '') || post.title.toLowerCase().replace(/\s+/g, '-'),
      title: post.title,
      author: post.date,
      url: post.href,
    }));

  return [
    { slug: 'dispatch', label: 'Dispatch', items: dispatchItems },
    { slug: 'solana', label: 'Solana', items: solanaItems as NoteItem[] },
    { slug: 'berlin', label: 'Berlin', items: berlinItems as NoteItem[] },
    { slug: 'playlists', label: 'Playlists', items: playlistsItems as NoteItem[] },
  ];
}
