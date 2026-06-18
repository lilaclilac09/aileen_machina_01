# Notes data — categories for the redesigned `/dispatch` page

Apple Notes–style list. Each JSON file under this directory becomes one tab in the sidebar.

## File layout

```
data/notes/
  solana.json
  berlin.json
  playlists.json
  ... add more here
```

Plus a synthesised `Dispatch` tab populated automatically from `lib/translations.ts` (so research-dispatch articles stay in sync without touching this directory).

## Shape

```ts
type NoteItem = {
  id: string;       // stable, e.g. "helius-blog" — used as the localStorage key
  title: string;
  author?: string;  // rendered after " | " (author / source / date)
  url?: string;     // optional clickable link
};
```

Each JSON file is just `NoteItem[]`.

## Adding a new category (tab)

1. Drop the JSON file under `data/notes/{slug}.json`
2. Add one import + one line to `lib/notes/items.ts`:
   ```ts
   import readingItems from '../../data/notes/reading.json';
   // ...
   { slug: 'reading', label: 'Reading', items: readingItems as NoteItem[] },
   ```
3. That's it. No build script, no indexer. Edit JSON, reload.

## Visitor "save" state

Each visitor's checked items live in their own browser `localStorage` under the key `aileena-notes-checked` as `{ "<slug>:<id>": true }`. Clearing site data resets it. Nothing flows back to a server.

## Sort order

Each tab's items render in the order they appear in the JSON file. Want chronological? Sort the JSON yourself.
