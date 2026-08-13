# QA.md

Verify with commands and this checklist. No evidence → not done.

> **never mark a task complete based only on code inspection.**

App lives in `aileena-new/` (`pnpm`, not repo-root npm). Run only the rows that match the slice. Skip the rest; do not “fix orb” as one pass.

Ship / merge to `main` still follows `AGENTS.md` 施工队安全条例 — localhost is not production proof. Preview Ready ≠ Production Ready.

## Before merge

```bash
cd aileena-new
pnpm lint              # full-repo is red on main (~180). Gate files you touched, not the whole debt.
pnpm exec tsc --noEmit # typecheck. Needs Next generated types (after a build, or ignore missing .next/types)
pnpm build             # required: generates article/data/memory indexes. Bare `next build` fails.
```

Also:

- deploy preview loads
- no failing **required** checks on the PR
- affected route opened
- affected user flow tested
- UI change → screenshots + interaction (`.cursor/rules/ui-step-screenshot.mdc`)
- env/config issues listed as `manual steps`, not hidden as code

When the slice has a dedicated test:

```bash
cd aileena-new
pnpm test:e2e:dnd      # carousel card → Deck A drag
pnpm verify:sound      # /sound + home Visual layout (default production URL)
pnpm verify:doors-nav  # doors back-link chrome
pnpm lead:test         # Resend lead/contact smoke (needs env)
pnpm verify:council-cli # local council CLI gate + redaction (no model)
pnpm council           # owner-only local council (needs OWNER_KEY + model key)
```

## Agent / orb

- transcript visible and scrollable
- voice hears the full sentence (recognition accumulates the turn; not first fragment only)
- voice speaks the full response
- voice pace is calm
- mic blocked state is gentle
- city / language switch works
- public mode respects the message limit
- one orb slice per change set (do not “fix orb” as one task)

## Council

- council mode is **owner-only**
- visitor / public session cannot enter council
- public orb stays `agentMode: public`
- owner session is the only path into `/council`
- council CLI (local): `pnpm council` is owner-only; missing OWNER_KEY fails; no public route

## Contact

- leave-a-note submits successfully
- Resend email received at `CONTACT_TO` (not cafe@)
- transcript included in the mail body
- missing env shows a private / dev-safe error
- public UI does not expose scary backend errors
- missing `RESEND_API_KEY` / `CONTACT_TO` → env `manual steps`, not a new mailer

## Visual / collage

- images are not cropped (`object-fit: contain`, natural aspect — never cover-crop)
- links work
- drag behavior works if enabled
- layout responsive (desktop cluster + 390×844)
- home clipping desk stays collage, not a gallery grid

## Doors / navigation

- every subpage has a back link
- doors routes work (`/doors`, DJ, Shelf, Metal & Pages, Dispatch, Tools)
- `pnpm verify:doors-nav` when chrome / back links changed
- no orphaned important page

## DJ

- add song
- appears in carousel
- drag to deck A
- play / pause works
- deck B works if touched
- mixer controls affect actual audio if touched
- Visual / `#glass-bench` is **not** on `/sound`

## Not code failures

Do **not** treat these as a patch-the-app signal:

- Bugbot / Cursor usage-limit
- full-repo `pnpm lint` already red on `main`
- `allow_auto_merge` false / empty rulesets (`docs/AI_AUTOMERGE.md`) — human admin
- Spotify oEmbed / `api.song.link` “Host not in allowlist” — use placeholder thumb; do not invent a scraper
- missing `RESEND_API_KEY` / `CONTACT_TO` — env `manual steps`, not a new mailer

## Evidence closer

Copy into the task reply:

```txt
root cause:
files changed:
checks run:
manual QA:
verification:
remaining risks:
manual steps:
safe to merge:
```
