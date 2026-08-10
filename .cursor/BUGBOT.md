# Bugbot — project review priorities

For this project, prioritize interactive regressions over style feedback.

When reviewing drag and drop changes, always check:

- `dragstart`, `dragover`, `drop` lifecycle
- `draggable` attributes
- `preventDefault` and `stopPropagation`
- `pointer-events`
- overlays, z-index, absolute positioning
- transforms and overflow
- state updates after drop
- rerender behavior

Suggest minimal fixes only.
Do not recommend rewrites.
Do not introduce new drag/drop libraries.
Ignore formatting and style unless it causes a real bug.

## How to use Bugbot here

Bugbot is a **reviewer**, not a fixer. It reviews **PR diffs** — not random local broken state.

1. Put the broken change on a branch and open a PR (or use `/review-bugbot` on the current diff in Cursor).
2. Trigger review: `bugbot run` / `cursor review` on the PR, or `/review-bugbot` in Cursor.
3. Focus the ask: what in **this diff** broke drag/drop (or the named regression) — not “what’s wrong with my app.”
4. Apply only the relevant finding in Cursor; do not refactor unrelated code.
5. Manually verify the interaction after the fix.

Optional: `bugbot run verbose=true` for more detail.

## Bugbot vs CI (don’t mix them up)

| Need | Use |
|------|-----|
| Review PR diffs for bugs | **Bugbot** (`bugbot run` / `/review-bugbot`) |
| Run in GitHub Actions on every PR | **cursor-agent** workflow (see below) |
| Investigate / patch failing CI | Separate cursor-agent “fix CI” workflow — **manual approve, never auto-merge** |

Bugbot is PR-review-first. If your mental model is “CI guardrail,” use `cursor-agent` in Actions with `CURSOR_API_KEY`. Do not force Bugbot to be the CI runner.

### Recommended loop (interactive / DnD)

1. PR opens → lint/tests  
2. Optional: Bugbot on the PR (`bugbot run`)  
3. Optional: `.github/workflows/cursor-pr-review.yml` runs a **read-only** drag/drop-focused review via cursor-agent  
4. If CI fails → separate fix agent / human → **you** approve merge  

Never let Bugbot or cursor-agent auto-merge.
