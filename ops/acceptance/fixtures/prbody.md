## summary
Adds `ops/acceptance/`: an acceptance kit whose every check is taken from Aileen's own MD files (AGENTS.md, CURSOR_RULES.md, QA.md, PR template, `.cursor/rules/*`, 工作准册 §6, AI_AUTOMERGE.md) with a source citation per check, so every project agent is held to the same standard.

- `ACCEPTANCE.md` — universal checklist + per-project overlays (each repo's own AGENTS.md / CLAUDE.md / `.cursor/rules` are listed, not replaced)
- `check.mjs` — checks a PR body / final reply: evidence closer, `safe to merge` value, banned "should work" phrases, UI ⇒ screenshots + interaction, localhost/preview as production proof, blocker table
- `sweep.mjs` — rerunnable audit of recent PRs across all repos
- `.github/workflows/acceptance.yml` — PR gate, reusable via `workflow_call` from other repos

## files changed
`ops/acceptance/**`, `.github/workflows/acceptance.yml`, `CURSOR_RULES.md` (one read-order line).

## root cause / reason
Owner asked that acceptance follow her MD standards (not the agent's own), be automated, applied to every agent, and rerun to find problems.

## checks run
- [x] `node --test ops/acceptance` — 11/11 pass
- [x] `check.mjs` on `fixtures/pass.md` → exit 0; on `fixtures/fail.md` → exit 1 (expected)
- [x] `sweep.mjs --days 14` real run: 80 PRs across 10 repos, 80 fail at least one check (most common: missing `manual steps` / `verification` / `manual QA` closer fields; UI PRs without screenshots)
- lint / typecheck / build: not applicable — no `aileena-new/` code touched

## manual QA
CLI exercised locally on fixtures and live GitHub PRs. No UI changed, so no screenshots.

## verification
Test + CLI output above. The hosted workflow run on this PR is the first CI evidence.

## remaining risks
Checks are format heuristics: they prove the evidence was written, not that it is true. Reuse from other repos (`@main`) unverified until merged.

## manual steps
- make `acceptance` a required status check on `main` if wanted (admin)
- `allow_auto_merge` is `false` on this repo (`gh api repos/lilaclilac09/aileen_machina_01 --jq .allow_auto_merge`)

## safe to merge?
- [x] no
