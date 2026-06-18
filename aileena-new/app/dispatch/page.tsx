'use client';

import { useLanguage } from '../../components/LanguageProvider';
import { getCategories } from '../../lib/notes/items';
import NotesView from '../../components/NotesView';
import ScrollUnlock from '../blog/ScrollUnlock';

/**
 * /dispatch — Apple Notes–style category list.
 *
 *   left:  sidebar of categories (Dispatch | Solana | Berlin | Playlists)
 *   right: items in the active category, each with a checkbox to save it
 *
 * Dispatch is auto-populated from translations.ts research-dispatch posts.
 * Everything else is hand-authored under /aileena-new/data/notes/{slug}.json.
 * To add a category: drop a JSON file + one import in lib/notes/items.ts.
 *
 * Save state (per visitor) lives in localStorage under aileena-notes-checked.
 */
export default function DispatchNotes() {
  const { language } = useLanguage();
  const categories = getCategories(language);

  return (
    <>
      <ScrollUnlock />
      <NotesView categories={categories} />
    </>
  );
}
