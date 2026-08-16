# Mobile layout emergency QA report

Date: 2026-08-16  
Branch: `cursor/mobile-layout-emergency-02b4`  
PR: https://github.com/lilaclilac09/aileen_machina_01/pull/429  
Env: local `pnpm dev` @ `127.0.0.1:3000` + Playwright Chromium (iPhone UA)

## summary

Site was breaking / misaligned on narrow viewports due to: snap/`overflow:hidden` stacking, missing safe-area on console/chrome, page shells at raw `100vh`, and coverflow stages bleeding sideways.

Fixed with a **mobile layout emergency pass** (no DJ features, no desktop redesign):

- Global mobile unlock deduped; `100dvh` + safe-area CSS vars; `mobile-page` / `mobile-stage-clip`
- Home opening/desk stack: auto height + safe-area padding (desktop collage untouched)
- Console: safe-area on dialog + input chrome
- Sound / Dispatch / Council: `100dvh`, max-width, page X clip after stacking
- Coverflow stages clipped so **page** does not sideways-scroll; cards still swipeable **inside** the stage

**Not** solved by “only overflow-x:hidden on broken absolute cards” — collage remains desktop-only; mobile uses existing stacked desk; stages clip with in-stage swipe still reachable.

## files changed

| File | Purpose |
|------|---------|
| `aileena-new/app/globals.css` | Mobile emergency utilities; dedupe unlock; chrome clearance |
| `aileena-new/app/page.tsx` | Opening shell + desk stack safe padding |
| `aileena-new/components/Header.tsx` | Lang chrome safe-area class |
| `aileena-new/components/AgentChat.tsx` | Console safe-area |
| `aileena-new/app/sound/page.tsx` | Shell dvh / clip / padding |
| `aileena-new/components/DJStation.tsx` | Layout max-width clip only |
| `aileena-new/components/TrackLibraryBrowser.tsx` | Coverflow stage clip |
| `aileena-new/app/dispatch/page.tsx` | Shell + padding |
| `aileena-new/components/SwipeRow.tsx` | Dispatch coverflow stage clip |
| `aileena-new/components/GlassBench.tsx` | Visual safe-area padding |
| `aileena-new/app/council/page.tsx` | Locked page safe padding |

## routes tested

Note: `/visual`, `/magazine`, `/news`, `/woman-in-tech`, `/woman-investing`, `/ask` are **not** separate routes — covered via `/#visual`, `/dispatch` (+ anchors), console event.

| route | viewport | before issue | after result | screenshot |
|-------|----------|--------------|--------------|------------|
| `/` | 390×844 | snap/clip + collage risk | no X overflow; stacked usable | `mobile-home-390.png` |
| `/` | 430×932 | same | ok | `mobile-home-430.png` |
| `/` | 375×667 | same | ok | `mobile-home-375.png` |
| `/` | 393×852 | same | ok (metric) | — |
| `/doors` | 390 / 430 | chrome overlap risk | ok | `mobile-doors.png` |
| `/sound` | 390 / 430 | shell bleed / dense mixer | no page X overflow; stacked decks | `mobile-sound.png` |
| `/#visual` | 390 | clip risk | 1-col natural aspect | `mobile-visual.png` |
| `/dispatch` | 390 / 430 | coverflow bleed | stage clipped; page ok | `mobile-magazine.png` / `mobile-news.png` |
| `/dispatch#woman-in-tech` | 390 | — | ok | `mobile-woman-tech.png` |
| `/dispatch#woman-investing` | 390 | — | ok | `mobile-woman-investing.png` |
| console (open) | 390 | no safe-area | padded; usable | `mobile-console.png` |
| `/council` locked | 390 / 430 | — | stacked, ok | `mobile-council-locked.png` |

Overflow probe (`overflow-report.json`): all listed routes **ok** (scrollWidth ≤ clientWidth+2) at 390 and 430.

## screenshots

Under `/opt/cursor/artifacts/screenshots/mobile-emergency/`:

- mobile-home-390.png · mobile-home-430.png · mobile-home-375.png
- mobile-doors.png · mobile-sound.png · mobile-visual.png
- mobile-magazine.png · mobile-news.png
- mobile-woman-tech.png · mobile-woman-investing.png
- mobile-console.png · mobile-council-locked.png

## checks run

- Scoped eslint on touched TSX: **0 errors** (pre-existing warnings only)
- Playwright viewport overflow probe: **pass**
- `pnpm install` restored missing `@playwright/test` (needed for `tsc` / build)
- `pnpm build`: run after install (see commit)

## remaining risks (real iPhone Safari)

- Soft keyboard vs console input (visualViewport)
- Audio autoplay / orb mic gesture
- Touch drag on DJ (layout only this PR — not mixer UX redesign)
- Home indicator / dynamic toolbar after scroll
- Blur/backdrop performance
- Sound Lab tap targets still dense (usable but not “Pioneer”) — deferred per priority
- Next.js / third-party floating “N” badge may overlap bottom chrome

## merge recommendation

**merge after small fixes** → if build green on this PR tip: **safe to merge** for emergency layout.

Then: **production iPhone Safari hand-test** before Sound Lab mixer work.
