# Owner shelf EPUB reader

Private, owner-only reading for books on `/blog/watch-listening-shelf`.

## Rules

- Copyrighted EPUBs never go in git of the **public** site repo and never under `public/`.
- Visitors keep the existing shelf (spine / cover + synopsis). They never receive EPUB URLs.
- Bytes are streamed only from `GET /api/owner/shelf/epub/[slug]` after `__aileena_pass` owner session (`requireOwnerFromRequest`). Non-owners get **403**.
- Progress / favorites / currently-reading use `GET|PUT /api/owner/shelf/reading` (same owner gate; Redis when configured, otherwise in-memory + client `localStorage` fallback).

## Where bytes live (production)

Vercel has no persistent disk. Production reads from the **private** GitHub repo:

- Repo: [`lilaclilac09/aileena-owner-epubs`](https://github.com/lilaclilac09/aileena-owner-epubs) (PRIVATE)
- Files at repo root: `{slug}.epub` (slug = `slugify(BOOK_RECS[].shelfTitle)`)
- Site fetches via GitHub Contents API (`Accept: application/vnd.github.raw`) when local `.data/shelf-epubs` misses

### Vercel env

| Var | Required | Notes |
| --- | --- | --- |
| `SHELF_EPUB_GITHUB_TOKEN` | preferred | Fine-grained or classic PAT with **Contents: Read** on `aileena-owner-epubs` only |
| `AGENT_CODE_GITHUB_TOKEN` / `GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_MCP_TOKEN` | fallback | Used if `SHELF_EPUB_GITHUB_TOKEN` unset — must still have Contents:Read on the **private** epub repo |
| `SHELF_EPUB_GITHUB_REPO` | optional | Default `lilaclilac09/aileena-owner-epubs` |
| `SHELF_EPUB_GITHUB_REF` | optional | Default `main` |
| `SHELF_EPUB_DIR` | optional | Absolute local dir checked before GitHub (dev / sticky host) |

If the token is scoped only to the public site repo, catalog/stream return empty / 404 for owners even though files exist. Fix: add `aileena-owner-epubs` to the fine-grained token’s repository list, or set `SHELF_EPUB_GITHUB_TOKEN`.

## Add / update an EPUB

1. Find the shelf item id (slug of `BOOK_RECS[].shelfTitle` in `lib/watchListeningShelf.ts`).
   - Examples: **Bad Feminist** → `bad-feminist`, **Crying in H Mart** → `crying-in-h-mart`, **On Earth We’re Briefly Gorgeous** → `on-earth-we-re-briefly-gorgeous`, **Still Born** → `still-born`
2. Push to the private repo (never the public site):

```bash
# from a private clone of lilaclilac09/aileena-owner-epubs
cp "/path/to/Book.epub" ./bad-feminist.epub
git add bad-feminist.epub && git commit -m "shelf: bad-feminist" && git push
```

3. Local / sticky host (optional, checked first):

```bash
mkdir -p aileena-new/.data/shelf-epubs
cp "/path/to/Book.epub" aileena-new/.data/shelf-epubs/bad-feminist.epub
```

4. Unlock as owner, open `/blog/watch-listening-shelf`, select the book → **read**.

Placeholder (local QA only — do not ship fake books to the private repo or production):

```bash
pnpm exec tsx scripts/make-shelf-epub-placeholder.ts bad-feminist
```

## Owner UI

- Right pane becomes an iBooks-inspired paginated reader (site `--arc-serif` stack; no separate ebook font).
- Left shelf stays visible.
- Favorite / currently reading toggles; page + percent update on turn and resume on revisit.
