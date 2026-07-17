# Skill — add a Tools Arcade mini-game

## What it is

`/tools` is a **public arcade lobby** (cabinet cards, CRT styling). Each mini-game is:

1. One row in `lib/tools/registry.ts` (`TOOL_DEFINITIONS`)
2. One route `app/tools/<slug>/page.tsx` → `components/tools/<Name>Tool.tsx`
3. i18n in `lib/translations.ts` — **EN + DE**, same keys:
   - `tools.items['<slug>']` — hub card
   - `tools.<camelCaseSlug>` — in-game copy
4. Optional API under `app/api/tools/<slug>/` + rate limit in `lib/api/ratelimit.ts`

Full checklist + backlog ideas: **`aileena-new/docs/TOOLS_ARCADE.md`**

Reference implementation: **Clip Quest** (`inkling-clips`) — `components/tools/InklingClipTool.tsx`, `docs/INKLING_CLIPS.md`.

## UI rules (do not break arcade feel)

- Wrap pages in `ArcadeLayout` + `ArcadeCabinetFrame` from `components/tools/ArcadeLayout.tsx`
- Shared CSS: `components/tools/arcade.css` (via `app/tools/layout.tsx`)
- Primary CTA: `className="arcade-start-btn"`
- Progress: stage labels + `arcade-wave`; results: `arcade-score-card`
- Back link copy: `← Arcade` / hub `/tools`

## Registry entry shape

```ts
{
  slug: 'my-game',
  tag: '…',
  title: '…',
  body: '…',
  href: '/tools/my-game',
  status: 'live' | 'beta',
  arcade: { glyph: '◆', players: '1P', screenGradient: 'linear-gradient(...)' },
}
```

## Data & RSS rule

Mini-games **must** use site corpora:

- `data/skus.json`, `data/pricing.jsonl`, `data/news.jsonl` via `/api/v1/*`
- Listening-shelf RSS: SemiAnalysis + Asymmetrical Bets via `/api/tools/feeds` (`lib/tools/feeds.ts`)

Do not invent parallel datasets. If the catalogue is sample-thin, say so in the disclaimer and expand `data/` instead.

## Backlog (Aileen / agent — pick when asked)

| slug | title | idea |
|------|-------|------|
| ~~`feed-flash`~~ | Feed Flash | ✅ shipped — `/tools/feed-flash` |
| ~~`chip-guess`~~ | Chip Guess | ✅ shipped — `/tools/chip-guess` |
| ~~`pricing-slot`~~ | Pricing Slot | ✅ shipped — `/tools/pricing-slot` |
| `news-ticker` | News Ticker | Match `data/news.jsonl` title → vendor |
| `dispatch-dash` | Dispatch Dash | Timed headline → article slug match |
| `memory-match` | Memory Match | Flip cards: projects vs one-line descriptions |

## Agent rule

When user says "add a mini-game" / "new arcade cabinet" / "second tool":

1. Read `docs/TOOLS_ARCADE.md`
2. Add registry + page + component + translations (EN+DE)
3. Add API + rate limit only if the game needs server-side work
4. Run `npm run lint` + `npm run build`
5. Append row to **Shipped cabinets** table in `TOOLS_ARCADE.md`

Do **not** build a separate tools hub or non-arcade layout unless explicitly requested.
