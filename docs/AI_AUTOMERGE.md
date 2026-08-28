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

### Proven blockers (agent cannot flip these)

As of 2026-08-11 (API as this bot):

| Setting | Observed | Effect |
|---------|----------|--------|
| `allow_auto_merge` | **false** | `gh pr merge --auto` cannot enable queue |
| Rulesets on `main` | **[]** (empty) | No required checks enforced |
| Branch protection API | **403** to bot | Cannot verify/edit protection via integration |
| Full-repo `pnpm lint` | **~180 errors on main** | CI job uses **scoped** eslint on DnD surfaces only until debt is cleared |

Until (1)+(2)+(3) are flipped by a human with admin, this stack can **run checks** but cannot prove end-to-end auto-merge into `main`.

## Opt out

Remove the `ai-automerge` label from a PR. CI/playwright still run; auto-merge and cursor-agent gate do not.

## Sound Lab smoke

`aileena-new/e2e/mobile-layout.spec.ts` — `/sound` still has Deck A / `#dj-set` after the 30-day restore. Pioneer HTMLAudio drop (`dj-drag-deck-a.spec.ts`) is no longer on this tree.
