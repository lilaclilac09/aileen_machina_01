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

Bugbot is a **reviewer**, not a fixer.

1. Put the broken change on a branch and open a PR (or use `/review-bugbot` on the current diff in Cursor).
2. Trigger review: `bugbot run` / `cursor review` on the PR, or `/review-bugbot` in Cursor.
3. Focus the ask: what in **this diff** broke drag/drop (or the named regression) — not “what’s wrong with my app.”
4. Apply only the relevant finding in Cursor; do not refactor unrelated code.
5. Manually verify the interaction after the fix.
