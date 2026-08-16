# iOS / mobile layout pass QA

Date: 2026-08-16  
Branch: `cursor/ios-mobile-layout-628e`  
PR: https://github.com/lilaclilac09/aileen_machina_01/pull/433  
Env: local `pnpm dev` @ `127.0.0.1:3000` + Playwright Chromium (iPhone UA)

Separate from DJ mixer engine. Desktop collage / desk visual direction unchanged.

## what this pass added on top of PR #429

- `viewport-fit=cover` so `env(safe-area-inset-*)` can apply on iPhone
- Console pinned to `visualViewport` (keyboard)
- Leave-a-note scrolls; orb stays in the dialog
- Sound Lab CSS stack + `.dj-tap` ≥44px before hydration
- EN / DE / city / chrome taps ≥44px
- Mobile chrome: no heavy `backdrop-filter`
- Inputs ≥16px (no iOS focus-zoom)

## overflow probe

`pnpm exec tsx scripts/verify-mobile-layout.ts` — **0 failures** at 390×844, 393×852, 430×932, 375×667 for `/`, `/doors`, `/sound`, `/#visual`, `/dispatch`, writing, `/council`.

Report: `/opt/cursor/artifacts/mobile-ios/overflow-report.json`

## e2e

`pnpm test:e2e:mobile` — 3 passed (home overflow, Sound Lab play ≥44px, console + leave-a-note).

## remaining (real iPhone Safari)

- Soft keyboard vs `visualViewport` still needs a hand test (Chromium does not shrink visual viewport)
- Next.js “N” overlay can cover bottom chrome in `next dev`
- Sound Lab knobs are larger but still dense; no Web Audio record/export on this branch
- Production proof is not this localhost run
