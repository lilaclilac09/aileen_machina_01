# Tools hub — adding a tool

Public utilities live under **`/tools`**. Flat geometric tiles (no borders / arcade chrome). Each tool is one registry entry + one route.

**Reference:** [Audio Clipping](/tools/inkling-clips) — YouTube → Inkling → ffmpeg cuts.

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
  body: 'One-line pitch on the hub.',
  href: '/tools/chip-guess',
  status: 'live',
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
| `inkling-clips` | `/tools/inkling-clips` | **Live** — CLI command builder (local run) |
| `cafe-cursor` | `https://cursor-cafe.aileena.xyz/` | **Live** — external Cafe Cursor credits redeem |
| `feed-flash` | `/tools/feed-flash` | TBC on hub |
| `chip-guess` | `/tools/chip-guess` | TBC on hub |
| `pricing-slot` | `/tools/pricing-slot` | TBC on hub |

Nav: homepage dock `{ label: 'tools', href: '/tools' }`.

Procedural skill: `aileena_second_brain/memories/procedural/skills/tools-arcade-mini-game.md`
