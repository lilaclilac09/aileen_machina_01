# Tools Arcade — adding a mini-game

Public browser mini-games live under **`/tools`**. The hub is an arcade lobby (CRT, marquee, cabinet cards). Each game is one cabinet + one route.

**Live example:** [Clip Quest](/tools/inkling-clips) — Inkling listens to YouTube audio and returns cut timestamps.

---

## Architecture (3 layers)

| Layer | Path | Role |
|-------|------|------|
| **Registry** | `lib/tools/registry.ts` | Cabinet metadata → hub grid |
| **Page** | `app/tools/<slug>/page.tsx` | Thin wrapper → game component |
| **UI** | `components/tools/<Game>Tool.tsx` | Playable surface (use `ArcadeLayout`) |
| **API** (optional) | `app/api/tools/<slug>/…` | Server work the browser cannot do |
| **i18n** | `lib/translations.ts` | EN + DE — **same shape in both blocks** |
| **Styles** | `components/tools/arcade.css` | Shared CRT / cabinet / marquee (imported via `app/tools/layout.tsx`) |

Shared shell:

- `components/tools/ArcadeLayout.tsx` — header, marquee, page chrome
- `components/tools/ArcadeCabinetFrame.tsx` (exported from `ArcadeLayout.tsx`) — in-game cabinet bezel
- `components/tools/ToolsArcadePage.tsx` — hub; reads `TOOL_DEFINITIONS`

---

## Checklist — ship a new cabinet

Copy this list for every new mini-game.

### 1. Register the cabinet

Edit [`lib/tools/registry.ts`](../lib/tools/registry.ts):

```ts
{
  slug: 'chip-guess',           // URL segment: /tools/chip-guess
  tag: 'SEMIS · QUIZ',
  title: 'Chip Guess',
  body: 'One-line pitch on the hub card.',
  href: '/tools/chip-guess',
  status: 'live',             // or 'beta'
  arcade: {
    glyph: '◈',               // single char shown on cabinet screen
    players: '1P',
    screenGradient: 'linear-gradient(180deg, #1a2035 0%, #0a0c14 100%)',
  },
},
```

The hub card copy can be overridden per language in translations (step 3).

### 2. Route + component

```ts
// app/tools/chip-guess/page.tsx
import ChipGuessTool from '../../../components/tools/ChipGuessTool';

export default function ChipGuessPage() {
  return <ChipGuessTool />;
}
```

Build the game in `components/tools/ChipGuessTool.tsx`:

```tsx
'use client';

import ArcadeLayout, { ArcadeCabinetFrame, mono } from './ArcadeLayout';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import { getToolBySlug } from '../../lib/tools/registry';

export default function ChipGuessTool() {
  const { language } = useLanguage();
  const tx = t[language].tools.chipGuess; // game-specific block
  const tool = getToolBySlug('chip-guess');

  return (
    <ArcadeLayout tag={tx.tag} title={tx.heading} subtitle={tx.body} backLabel={tx.backToTools}>
      <ArcadeCabinetFrame
        glyph={tool?.arcade.glyph ?? '?'}
        screenGradient={tool?.arcade.screenGradient ?? 'linear-gradient(180deg,#111,#000)'}
      >
        {/* game UI */}
      </ArcadeCabinetFrame>
    </ArcadeLayout>
  );
}
```

**UX conventions (match Clip Quest):**

- Back link → `/tools` (`backToTools: '← Arcade'`)
- Primary action → `className="arcade-start-btn"`
- Loading → `arcade-wave` + stage labels (`STAGE 1 · …`)
- Results → `arcade-score-card` with stagger (`animationDelay`)
- Mono labels → `fontFamily: mono` from `ArcadeLayout`

### 3. Translations (EN + DE)

In [`lib/translations.ts`](../lib/translations.ts), extend **`tools`** in **both** `EN` and `DE`:

```ts
tools: {
  // … existing hub strings …
  items: {
    'inkling-clips': { … },
    'chip-guess': {                    // key MUST match registry slug
      tag: 'SEMIS · QUIZ',
      title: 'Chip Guess',
      body: 'Hub card blurb.',
    },
  },
  chipGuess: {                         // camelCase slug for game page copy
    tag: 'CHIP GUESS',
    heading: 'Chip Guess',
    body: '…',
    backToTools: '← Arcade',
    submit: 'Press start',
    // …
  },
},
```

Rules:

- `tools.items[<slug>]` — hub card only
- `tools.<camelCaseSlug>` — full in-game strings (errors, labels, stage names)
- Never add EN-only keys; DE must mirror structure

### 4. API (only if needed)

Pure client games (quiz from static data, canvas toys) need **no** API.

Server-backed games (LLM, ffmpeg, scraping):

```
app/api/tools/<slug>/route.ts       POST start / GET poll
app/api/tools/<slug>/clip/route.ts  optional sub-routes
```

Patterns to copy:

- [`app/api/tools/inkling-clips/route.ts`](../app/api/tools/inkling-clips/route.ts) — `after()` background job, job store
- [`lib/inkling/jobs.ts`](../lib/inkling/jobs.ts) — Upstash Redis or in-memory fallback
- [`lib/api/ratelimit.ts`](../lib/api/ratelimit.ts) — add a tier, e.g. `TOOLS_<NAME>_RATE`

```ts
export const runtime = 'nodejs';
export const maxDuration = 300; // if long-running
```

Use `checkRateLimit(req, TOOLS_INKLING_RATE, 'scope')` or a new tier for expensive games.

### 5. Verify

```bash
cd aileena-new
npm run lint -- components/tools app/tools/<slug> lib/tools
npm run build
```

Manual: open `/tools` → new cabinet visible → **Press Start** → play once end-to-end.

### 6. Docs + memory (this file)

When shipping a game, add a one-line entry under **Shipped cabinets** below and link any game-specific doc (like [`INKLING_CLIPS.md`](./INKLING_CLIPS.md)).

---

## Data & RSS rule (non-negotiable)

Arcade games must consume **existing site corpora**, not invented catalogues:

| Source | Path / URL | Used by |
|--------|------------|---------|
| Chip specs | `data/skus.json` → `/api/v1/chips` | Chip Guess, Pricing Slot |
| Prices | `data/pricing.jsonl` → `/api/v1/pricing/{sku}/latest` | Pricing Slot |
| News trackers | `data/news.jsonl` → `/api/v1/news` | (backlog) |
| Listening shelf RSS | SemiAnalysis + Asymmetrical Bets | Feed Flash via `/api/tools/feeds` |

Feed URLs (same as homepage / watch-listening-shelf):

- `https://www.semianalysis.com/feed/`
- `https://asymmetricalbets.substack.com/feed`

## Shipped cabinets

| Slug | Route | Data |
|------|-------|------|
| `inkling-clips` | `/tools/inkling-clips` | YouTube + Inkling API ([INKLING_CLIPS.md](./INKLING_CLIPS.md)) |
| `feed-flash` | `/tools/feed-flash` | Live RSS via `/api/tools/feeds` |
| `chip-guess` | `/tools/chip-guess` | `/api/v1/chips` (`data/skus.json` — still sample-thin) |
| `pricing-slot` | `/tools/pricing-slot` | `/api/v1/chips` + `/api/v1/pricing/.../latest` |

---

## Backlog — candidate mini-games

| Slug (proposed) | Working title | Hook | Data / API |
|-----------------|---------------|------|------------|
| ~~`feed-flash`~~ | **Feed Flash** | ✅ Shipped | `/api/tools/feeds` |
| ~~`chip-guess`~~ | **Chip Guess** | ✅ Shipped — expand `data/skus.json` | `/api/v1/chips` |
| ~~`pricing-slot`~~ | **Pricing Slot** | ✅ Shipped | `/api/v1/pricing` |
| `news-ticker` | **News Ticker** | Match tracker → vendor | `/api/v1/news` |
| `dispatch-dash` | **Dispatch Dash** | Headline → blog slug | `lib/agentArticleIndex.json` |
| `memory-match` | **Memory Match** | Project ↔ description | `lib/translations.ts` / `pow` |

---

## Nav

Homepage atrium dock: `app/page.tsx` → `socialLinks` includes `{ label: 'arcade', href: '/tools' }`.

Footer EXPLORE column: `tools` block in translations → `{ label: 'Arcade', href: '/tools' }` (wired when footer component uses it).

---

## Agent note

Procedural skill for retrieval: `aileena_second_brain/memories/procedural/skills/tools-arcade-mini-game.md`

When asked to add a mini-game: read that skill + this doc, follow the checklist, do not invent a second hub pattern.
