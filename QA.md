# QA.md

Verify with commands and this checklist. No evidence → not done. App lives in `aileena-new/` (`pnpm`, not repo-root npm).

## Toolchain

```bash
cd aileena-new
pnpm lint              # full-repo is red on main (~180). Gate files you touched, not the whole debt.
pnpm exec tsc --noEmit # needs Next generated types (after a build, or ignore missing .next/types)
pnpm build             # required: generates article/data/memory indexes. Bare `next build` fails.
```

When the slice has a test:

```bash
cd aileena-new
pnpm test:e2e:dnd      # carousel card → Deck A drag
pnpm verify:sound      # /sound + home Visual layout (default production URL)
pnpm verify:doors-nav  # doors back-link chrome
pnpm lead:test         # Resend lead/contact smoke (needs env)
```

Ship / merge to `main` still follows `AGENTS.md` 施工队安全条例 — localhost is not production proof.

## Product checklist

Run the rows that match the slice. Skip the rest; do not “fix orb” as one pass.

| Slice | Pass when |
|-------|-----------|
| contact sends email | Resend delivers to `CONTACT_TO` (not cafe@) |
| transcript included | mail body contains the chat / note transcript |
| orb hears full sentence | recognition accumulates the turn; not first fragment only |
| orb speaks full response slowly | TTS speaks the complete reply at calm human pace |
| visual images not cropped | `#glass-bench` / Visual photos fully visible (`contain`, not cover-crop) |
| doors back links work | `pnpm verify:doors-nav` + click ← doors / ← home |
| dj add → carousel → deck A → play | add track → film-strip → drag/load Deck A → audio |

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
verification:
remaining risks:
manual steps:
```
