# AI auto-merge with guardrails

## Principle

```txt
agent fixes/checks → tests pass → GitHub auto-merge merges
```

Not: agent decides everything and force-merges. That cooks `main`.

GitHub native auto-merge (`gh pr merge --auto`) only merges after **required** checks/reviews pass.

## Workflows

| Workflow | When | What |
|----------|------|------|
| `label-ai-prs.yml` | PR opened on `cursor/*` or `ai/*` | Adds label `ai-automerge` |
| `ai-automerge.yml` | PR events | `ci` → `playwright-dnd` → (if labeled) `cursor-review` → `enable-automerge` |

## Required GitHub settings

1. **Settings → General → Allow auto-merge**
2. **Protect `main`**
3. **Require status checks to pass** — add exactly:
   - `ci`
   - `playwright-dnd`
   - `cursor-review`
4. Secret **`CURSOR_API_KEY`** (labeled PRs fail closed without it)
5. Do **not** let agents bypass branch protection
6. Never enable “admin force merge” as the default path

## Opt out

Remove the `ai-automerge` label from a PR. CI/playwright still run; auto-merge and cursor-agent gate do not.

## DnD smoke

`aileena-new/e2e/dj-drag-deck-a.spec.ts` — desktop HTML5 drag from carousel card → Deck A platter. AI review alone cannot prove drag/drop; this check is required for auto-merge trust.
