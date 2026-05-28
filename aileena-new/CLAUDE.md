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

When writing or editing the prose of blog articles, **do not lean on numbers.** Default to explaining the idea and the mechanism in plain language, not stacking statistics for density.

- Don't pad prose with specific figures, dollar amounts, percentages, dates, or counts. They clutter the read and invite accuracy errors.
- Include a number **only when it is genuinely load-bearing** — when the exact figure *is* the point. Otherwise describe magnitude in words ("a few minutes", "most of the supply", "several-fold", "thin", "cheap").
- Never invent or guess a precise figure. If a real source isn't confident, don't state it as fact (and prefer to drop it rather than hedge with "~").
- Voice: conversational, keep technical terms but gloss each in plain language on first use; shorter active sentences; second person where it helps.
- Exception — **rewrites**: when asked to rewrite/restyle an *existing* article, preserve the numbers already in it byte-identical unless told otherwise. This rule governs *new* writing and what you choose to add.

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
