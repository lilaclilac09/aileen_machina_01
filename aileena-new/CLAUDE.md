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

Exception — rewrites: when restyling an existing article, preserve its numbers exactly unless told
otherwise.

## Dev Commands

```bash
npm run dev          # Start dev server (port 3000, use NEXT_TURBOPACK=0 if issues)
npm run build        # Production build
npm run lint         # ESLint
```

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
