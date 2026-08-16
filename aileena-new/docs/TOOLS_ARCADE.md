# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

# Tools hub — adding a tool

Public utilities live under **`/tools`**. Flat geometric tiles (no borders / arcade chrome). Each tool is one registry entry + one route.

**Reference:** [Audio Clipping](/tools/inkling-clips) — YouTube → silence cuts / optional Inkling.  
Also on the hub: [Cafe Recap Edit](/tools/cafe-recap) — local JSON→ffmpeg event recap (Mac CLI; experiment, not better than CapCut yet).

---

## Architecture

| Layer | Path | Role |
|-------|------|------|
| **Registry** | `lib/tools/registry.ts` | Tool metadata → hub grid |
| **Page** | `app/tools/<slug>/page.tsx` | Thin wrapper → tool component |
| **UI** | `components/tools/<Name>Tool.tsx` | Surface (use `ArcadeLayout` shell) |
| **API** (optional) | `app/api/tools/<slug>/…` | Server work the browser cannot do |
| **i18n** | `lib/translations.ts` | EN + DE — **same shape in both blocks** |
| **Styles** | `components/tools/arcade.css` | Shared flat tiles / marquee (via `app/tools/layout.tsx`) |

Shared shell:

- `ArcadeLayout.tsx` — header, marquee, page chrome
- `ArcadeCabinetFrame` — flat color block + panel (no border chrome)
- `ToolsArcadePage.tsx` — hub; reads `TOOL_DEFINITIONS`

---

## Checklist — ship a new tool

### 1. Register

```ts
{
  slug: 'chip-guess',
  tag: 'SEMIS',
  title: 'Chip Guess',
  body: 'What it does.',
  why: 'Why it exists.',
  verdict: 'Current honest verdict.',
  href: '/tools/chip-guess',
  status: 'useful', // useful | experiment | paused — never mark unfinished work live
  tier: 'utility', // featured | utility | experiment | paused
  arcade: {
    glyph: '◇',
    screenGradient: '#e4e8f0', // flat fill, not a bordered card
  },
},
```

### 2. Route + component

Use `ArcadeLayout` + `ArcadeCabinetFrame`. Primary CTA: `className="arcade-start-btn"`.

Back link: `← Tools` → `/tools`.

### 3. i18n

Add EN + DE under `t.*.tools` — hub `items[slug]` + tool-specific block.

### 4. Data / RSS rule

Tools must consume **existing site corpora**, not invented catalogues:

| Source | Use for |
|--------|---------|
| Listening-shelf RSS (`lib/tools/feeds.ts` → `/api/tools/feeds`) | Headline / desk tools |
| `data/skus.json` → `/api/v1/chips` | Chip catalogue |
| `data/pricing.jsonl` → `/api/v1/pricing/{sku}/latest` | Prices |
| `data/news.jsonl` → `/api/v1/news` | News ticker-style tools |

### 5. Verify

Open `/tools` → new tile visible → open tool once end-to-end.

---

## Shipped tools

| Slug | Route | Status |
|------|-------|--------|
| `cafe-cursor` | `https://cursor-cafe.aileena.xyz/` | **Useful** — redeem for checked-in Cafe Cursor guests |
| `inkling-clips` | `/tools/inkling-clips` | **Useful** — YouTube → clips, free-mode workaround |
| `cafe-recap` | `/tools/cafe-recap` | **Experiment** — local JSON→ffmpeg; not better than CapCut yet |
| `feed-flash` | `/tools/feed-flash` | Paused on hub |
| `chip-guess` | `/tools/chip-guess` | Paused on hub |
| `pricing-slot` | `/tools/pricing-slot` | Paused on hub |

Nav: homepage dock `{ label: 'tools', href: '/tools' }`.

Procedural skill: `aileena_second_brain/memories/procedural/skills/tools-arcade-mini-game.md`
