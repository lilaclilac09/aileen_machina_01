/**
 * Notes-style dispatch — typed shape for one item.
 *
 * Categories ("Dispatch", "Solana", "Berlin", "Playlists") each carry an
 * array of these. Hand-authored in /aileena-new/data/notes/{slug}.json
 * (except Dispatch which is synthesised from translations.ts).
 *
 * Format mirrors Apple Notes' checklist style:
 *   ○ Title | Author
 *   ● Title | Author     (checked, persisted in localStorage per-visitor)
 */

export type NoteItem = {
  id: string;          // stable, e.g. "helius-docs" — used as the localStorage key
  title: string;
  author?: string;     // rendered after the " | " separator (author / source / date)
  url?: string;        // optional clickable link
};

export type NotesCategory = {
  slug: string;        // "solana" — also the localStorage prefix
  label: string;       // sidebar label, e.g. "Solana"
  items: NoteItem[];
};
