# lesson: mobile overflow from desktop absolute layout

date: 2026-08-16
pr: https://github.com/lilaclilac09/aileen_machina_01/pull/429
status: absorbed

## trigger

Home / sound / dispatch cards used desktop absolute / coverflow geometry on narrow viewports. iPhone layout broke: sideways scroll, clipped chrome, console input under the home indicator.

## root cause

Desktop collage and coverflow stages were reused on mobile without a stacked in-flow path. Snap + `overflow: hidden` + raw `100vh` hid the damage instead of fixing stacking. Emergency pass: `aileena-new/docs/MOBILE_EMERGENCY_QA.md`.

## rule added / proposed

- proposed: layout PRs must run `pnpm qa:mobile` (390×844 + `scrollWidth`) before claiming mobile fixed — see `ops/improvement-queue.md` #1
- already in `QA.md`: UI change → screenshots + interaction; Visual stay `object-fit: contain`

## test added / proposed

- added: `cd aileena-new && pnpm qa:mobile` (static CSS + live overflow when a server is up)
- live evidence from #429: `scrollWidth <= clientWidth+2` at 390 and 430

## future instruction

Before claiming mobile fixed: capture 390×844 screenshots and check horizontal overflow. Do not “fix” iPhone by copying desktop absolute collage positions. Do not treat `overflow-x: hidden` on a broken absolute card as the fix.
