# AILEENA MACHINA

Personal portfolio and creative landing page.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, inline styles for blog pages
- **Animation**: Framer Motion, GSAP
- **Audio**: Custom DJStation component (two-deck player)
- **i18n**: EN + DE via `lib/translations.ts` (type-safe, no runtime lib)
- **Email**: Resend API (`/api/send`)
- **Deploy**: Vercel (auto-deploy on push to main)

## Project Structure

```
app/
  page.tsx              # Main landing — 9 fullscreen snap-scroll sections
  blog/                 # Individual article pages (robots, clob, lion, misread, harassment)
  api/send/             # Contact form email endpoint
components/
  SnapScroll.tsx         # Snap container + section with IntersectionObserver
  DJStation.tsx          # Audio player with two decks
  Header.tsx             # Top nav with language toggle
  LoadingScreen.tsx      # Intro animation
  LanguageProvider.tsx   # i18n context
lib/
  translations.ts        # All UI strings (EN + DE)
public/
  bg_pic/               # Hero/gallery images and video
  projects/             # Featured repo screenshots
```

## Architecture Notes

- **Snap scroll**: `.snap-section` has `overflow: hidden` + `height: 100dvh`. Inner content that needs scrolling must use `flex h-full flex-col` parent + `flex-1 overflow-y-auto` on the scrollable container only.
- **Translations**: `satisfies Record<Language, unknown>` pattern. Both EN and DE must have identical structure. Add `image`, `pdfHref` etc. to both languages when extending.
- **Blog articles**: Standalone pages with inline styles (not Tailwind). Each uses `<ScrollUnlock />` to override snap scroll.

## Writing Style — blog / dispatch articles

Two non-negotiables for every article:

1. **It must be understandable to a non-expert.** Plain language first. Explain the idea and the
   mechanism, not just the name. Gloss every piece of jargon in-line, in plain words, on first use.
   Reach for an analogy when a concept is abstract. Short, active sentences; second person where it
   helps. Keep code blocks and concrete examples — they aid understanding. A smart reader who is not
   in this niche should be able to follow the whole thing top to bottom.

2. **Every number must be precise and correct.** Don't bury the reader in walls of statistics — but
   any number you DO use must be exact and verified. Never replace a known figure with vague words
   ("about", "roughly", "a few", "once a minute") when the real value is knowable — give the real
   value. Never hedge a real figure with "~". Never invent or guess one. If you are unsure of the
   exact value, verify it (web search / primary source) or leave the claim out entirely — do not
   approximate. A genuinely uncertain estimate may be stated only if dated and attributed to its
   source.

Voice: conversational; keep technical terms but always gloss them.

### Explaining clearly — the Helius standard

The model for clear technical writing is Helius's Solana explainers. Concrete moves to copy:

- **One narrative spine.** Pick a single lens and run the whole piece along it (e.g. follow one
  transaction/object through the system) so sections build on each other instead of reading like
  disconnected reference entries.
- **Concrete hook, not a mission statement.** Open with a hard number or a vivid specific, not "X is
  a system that…".
- **One sticky analogy per hard concept.** Anchor each abstract mechanism to a vivid everyday image
  (a VIP line, video frames, a phone tree) *before* the mechanics.
- **Define on first use, inline.** Every term and acronym explained in parentheses where it first
  appears — never a bare initialism.
- **Progressive disclosure.** Give the one-sentence plain-English version first, then the deep
  mechanics. The reader can stop at any depth.
- **Explain by contrast.** Define the unfamiliar by how it differs from what the reader already knows.
- **Every mechanism ends on "why it matters."** Close each mechanic with its consequence/stakes;
  never leave a "so what?".
- **Show the arithmetic.** For any quantitative claim, show the worked example the reader can
  re-derive (fee = base + cu × price = …).
- **Quantify the abstract.** Turn "voting is expensive" into the actual per-day / per-year figure.
- **Structure flows as named, numbered stages or tables**, not walls of prose. Separate theory from
  real-world practice and call out where they diverge.

Failure mode to avoid: technically correct and comprehensive but un-memorable — because nothing was
concretized, contrasted, or tied to stakes.

Exception — rewrites: when restyling an existing article, preserve its numbers exactly unless told
otherwise.

## Dev Commands

```bash
npm run dev          # Start dev server (port 3000, use NEXT_TURBOPACK=0 if issues)
npm run build        # Production build
npm run lint         # ESLint
```

## Slash Commands

Custom commands live in `.claude/commands/`.

- **`/addmusic <spotify-track-url> [| title | bpm | key | seconds]`** — add a Spotify track to
  the DJ-set carousel. Just drop a track link; it extracts the id, **searches for the real song +
  cover art** (Odesli/song.link → Spotify oEmbed, via `curl` or `WebFetch`), appends an entry to
  the `TRACKS` array in `components/DJStation.tsx`, builds, and ships via PR. Optional `|`-separated
  fields override the title / bpm / key / duration. If the network allowlist blocks the lookup
  (`open.spotify.com` / `api.song.link` → "Host not in allowlist"), it falls back to
  `PLACEHOLDER_THUMB` (the deck's Spotify iframe still shows real art at play time).

### DJ track catalogue

`components/DJStation.tsx` holds the `TRACKS` array — the single source for both the two-deck player
and the carousel (`components/TrackLibraryBrowser.tsx`). Each entry is
`{ id, title, bpm, key, dur, thumb }`. `thumb` may be a real cover URL or `PLACEHOLDER_THUMB`
(exported from `TrackLibraryBrowser.tsx`); the carousel `<img>` falls back to the placeholder on any
load error, so a missing/404 cover never shows a broken image.

## Git Workflow

No direct push to main. All changes go through:

```bash
git checkout -b feat/xxx
# make changes
git add <files>
git commit -m "feat: description"
git push -u origin feat/xxx
gh pr create --base main
gh pr merge --squash --delete-branch
```

## Key URLs

- **Production**: https://aileena.xyz (Vercel)
- **MEV Dashboard**: https://mev.aileena.xyz
- **Finance**: https://finance.aileena.xyz
- **GitHub**: https://github.com/lilaclilac09
