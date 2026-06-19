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
  id: string;          // stable, e.g. "ai-pcb" — used as the localStorage key
  title: string;
  author?: string;     // rendered after the " | " separator (kept for non-article notes; dispatch items omit it)
  url?: string;        // optional clickable link
  theme?: string;      // optional sub-heading the renderer groups by (e.g. "AI hardware")
};

export type NotesCategory = {
  slug: string;        // "solana" — also the localStorage prefix
  label: string;       // sidebar label, e.g. "Solana"
  items: NoteItem[];
};
