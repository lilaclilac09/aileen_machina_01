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

Bugbot is a **reviewer**, not a fixer. It reviews **PR diffs**.

1. Open a PR with the change.
2. Comment: `bugbot run` / `cursor review` (or `/review-bugbot` in Cursor).
3. Focus: what in **this diff** broke the named regression.
4. Apply only that finding in Cursor; verify manually.

## Guardrailed auto-merge (not agent YOLO)

```txt
agent review/checks → required CI passes → GitHub auto-merge merges
```

| Piece | Role |
|-------|------|
| Label `ai-automerge` | Trust gate (auto on `cursor/*` / `ai/*` via `label-ai-prs.yml`) |
| Job `ci` | lint + `next build` |
| Job `playwright-dnd` | real browser DnD smoke (`/sound` → Deck A) |
| Job `cursor-review` | cursor-agent read-only; **exit 1** on blocking bug |
| Job `enable-automerge` | `gh pr merge --auto --squash` only |

Agent **never** force-merges. GitHub waits for required checks.

### Repo settings (human)

1. Allow auto-merge  
2. Protect `main`  
3. Require status checks: `ci`, `playwright-dnd`, `cursor-review`  
4. Secret `CURSOR_API_KEY`  
5. Label `ai-automerge` (created by workflow if missing)  
6. Remove the label to opt a PR out of auto-merge  

See `.github/workflows/ai-automerge.yml` and `docs/AI_AUTOMERGE.md`.
