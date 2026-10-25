# Owner shelf EPUB reader

Private, owner-only reading for books on `/blog/watch-listening-shelf`.

## Rules

- Copyrighted EPUBs never go in git and never under `public/`.
- Visitors keep the existing shelf (spine / cover + synopsis). They never receive EPUB URLs.
- Bytes are streamed only from `GET /api/owner/shelf/epub/[slug]` after `__aileena_pass` owner session (`requireOwnerFromRequest`). Non-owners get **403**.
- Progress / favorites / currently-reading use `GET|PUT /api/owner/shelf/reading` (same owner gate; Redis when configured, otherwise in-memory + client `localStorage` fallback).

## Add an EPUB for a shelf book

1. Find the shelf item id (slug of `BOOK_RECS[].shelfTitle` in `lib/watchListeningShelf.ts`).
   - Example: **Didion & Babitz** → `didion-babitz`
2. Drop the file on the deploy host / local box:

```bash
mkdir -p aileena-new/.data/shelf-epubs
cp "/path/to/Didion & Babitz.epub" aileena-new/.data/shelf-epubs/didion-babitz.epub
```

3. Optional: set `SHELF_EPUB_DIR` to another absolute directory (checked first).
4. Unlock as owner, open the shelf, select the book → **read**.

Placeholder (local QA only):

```bash
pnpm exec tsx scripts/make-shelf-epub-placeholder.ts didion-babitz
```

## Owner UI

- Right pane becomes an iBooks-inspired paginated reader (site `--arc-serif` stack; no separate ebook font).
- Left shelf stays visible.
- Favorite / currently reading toggles; page + percent update on turn and resume on revisit.
