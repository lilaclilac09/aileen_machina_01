## summary

## files changed

## root cause / reason

## checks run

App is `aileena-new/` (`pnpm`). Gate files you touched; full-repo lint is already red on `main`.

- [ ] lint (`cd aileena-new && pnpm lint` on files touched)
- [ ] typecheck (`cd aileena-new && pnpm exec tsc --noEmit`)
- [ ] build (`cd aileena-new && pnpm build`)
- [ ] deploy preview checked

## manual QA

- [ ] affected route opened
- [ ] affected user flow tested
- [ ] screenshots attached if UI changed
- [ ] production / env steps listed if needed

Slice checklists live in [`QA.md`](../QA.md) (orb, council, contact, visual/collage, doors, DJ, landing experiment).

Landing experiment (`/` · `LandingMarquee`): cinematic opening + marquee only. `.cursor/rules/landing-experiment-gate.mdc`. **no screenshots = no merge recommendation.**

After merge (or a blocked gate): [`ops/post-pr-review.md`](../ops/post-pr-review.md). Do not promote lessons into `AGENTS.md` without owner approval.

## risks

## safe to merge?

- [ ] yes
- [ ] no
- [ ] yes after manual env/config step

Do not mark ready based only on code inspection.
never mark a task complete based only on code inspection.
