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
- **Blog articles**: Standalone pages with inline styles (not Tailwind). Each uses `<ScrollUnlock />` to override snap scroll. New posts follow the **Blog Post Style** below.

## Blog Post Style (Substack essay)

The house style for **new** posts is a clean, readable Substack/Stratechery-style essay — prose first, no dashboard chrome. Reference implementation: `app/blog/instant-inference/page.tsx`.

**Layout**
- Light, warm background `#fdfcf9`; centered reading column `max-width: 680px`.
- Body in a **serif** stack (`'Iowan Old Style','Charter',Georgia,Cambria,'Times New Roman',serif`), ~1.1–1.26rem, line-height ~1.78. Small meta/labels/tables in `system-ui` sans.
- Title: serif `<h1>`, bold, dark ink `#1a1815`. Section headings: plain serif `<h2>` (e.g. "The memory wall is the real enemy") — **no** "01 —" mono tracking labels.
- Structure: kicker line (`CATEGORY · DATE · N min read`) → `<h1>` → italic serif dek → `<hr>` → lead paragraph → prose sections → Sources list → back-to-Archive link.
- Allowed accents: one centered serif **pull-quote**, one left-bordered **blockquote**, a light **aside** (`#f5f2ea`, teal left border) for caveats, and **one** minimal table if genuinely needed (sans, hairline `#efeae0` row borders).

**Colors** — single accent only, used sparingly: deep teal `#0a7d76` (the cyan-family color adapted for contrast on light) for links. Ink `#1a1815`, body `#2b2926`, muted `#6b6660`, faint `#9a948c`, rules `#e7e2d8`. (The neon cyan `#00ffea` was the *old* dark theme's accent — do not use it on the light essay pages.)

**Do NOT use** on essay posts: stat walls, card grids, framed ASCII diagrams, the dark `#000` terminal aesthetic, or Barlow Condensed display type. Convert that kind of content into prose, a simple list, or a plain table.

**Writing voice**: plain language — Paul Graham / Julia Evans, not a technical paper. Short sentences (most under 20 words), one idea per paragraph, define a term the first time, concrete over abstract, one metaphor per section. Be factual about vendor claims (attribute numbers, note caveats).

**Register every post** in `lib/translations.ts` → `blog.researchDispatch.posts`, in **both** EN and DE (`{ date, href, title, body }`), newest last.

> Legacy posts (`doublezero`, `validator-anatomy`, `rpc`, `wire`, etc.) still use the older dark "terminal" style. Leave them unless asked to migrate.

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
