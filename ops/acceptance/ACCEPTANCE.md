# Acceptance — Aileen's evidence standard

This is a source-derived checklist for every project and agent, not a new policy.
Paths below refer to `lilaclilac09/aileen_machina_01` unless another repository
is named. Project-specific commands and visual/product locks are overlays, not
universal requirements. A machine PASS checks the reply's form, **not truth,
approval, production readiness, or permission to merge**.

## Every task (manual acceptance)

- [ ] **inspect → plan → patch → verify**. Read the implementation, name the
  reason/root cause, propose the smallest safe diff, patch one slice. No unrelated
  refactors or parallel implementations. Multi-system/visual-direction changes
  need plan confirmation before editing. Source: `AGENTS.md` §Workflow (mandatory);
  `.cursor/rules/senior-engineer-loop.mdc` §Before coding / §While coding.
- [ ] **Never mark a task complete based only on code inspection.** Run applicable
  checks and the changed flow; give commands, results, URLs/clicks and artifacts.
  Explicitly state checks not run and why. Source: `AGENTS.md` §Verification is
  mandatory; `.cursor/rules/verification.mdc` §Every final reply / §Minimum;
  `QA.md` §Before merge.
- [ ] End with all eight non-empty evidence fields below. `none` / `not applicable`
  with a reason is appropriate when truthful; never fabricate a run. Source:
  `AGENTS.md` §Evidence (required closer — no mood, no “should work”);
  `.cursor/rules/senior-engineer-loop.mdc` §Evidence closer (non-negotiable);
  `aileena-new/docs/工作准册.md` §6 最终确认模板 (expanded confirmation includes
  requirement status/evidence, commands + pass/fail, artifacts, commit + push, risks).

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

`safe to merge` is exactly `yes`, `no`, or `yes after manual env/config step`.
PR headings also work: `root cause / reason`, `risks`, `safe to merge?` are the
existing template aliases. Add `verification` and `manual steps` headings to that
template when using it as a closer. Source: `AGENTS.md` §Evidence;
`.github/pull_request_template.md` §root cause / reason / §risks / §safe to merge?.

- [ ] PR checks-run checkboxes reflect actual checks, not an untouched template.
  Unrun/inapplicable checks stay unchecked with an explicit reason on the same
  line (for example `- [ ] build — not run: docs only`). Do not require this
  site's pnpm commands in another project. Source: `.github/pull_request_template.md`
  §checks run; `AGENTS.md` §Verification is mandatory (relevance and disclosure).
- [ ] Do not substitute “should work”, “should be fixed”, “looks good”, or
  “应该好了” for evidence. Source: `AGENTS.md` §Evidence / §施工队安全条例 → 硬性禁止;
  `.cursor/rules/debug-repro-loop.mdc` §Red lines.

## Bugs (manual acceptance)

- [ ] **Repro → Hypotheses → Evidence → Root cause → Fix → Why safe**. Include
  URL/clicks/environment, expected vs actual, ranked hypotheses and the smallest
  falsifying checks before fixing only the supported cause. Explain blast radius
  and residual risk. No repro + root cause means do not begin the fix. The debug
  loop says 1–3 hypotheses; `AGENTS.md` §Workflow → For bugs additionally asks ≥2.
  Source: `.cursor/rules/debug-repro-loop.mdc` §Required sequence / §Output shape;
  `AGENTS.md` §施工队安全条例 → Debug / 推理;
  `aileena-new/docs/工作准册.md` §5.8 Bug 修复.

## UI (manual acceptance, with artifact-presence gate)

- [ ] Show **screenshots + interaction**, not text-only or only stills. Capture key
  surfaces at 390×844; provide a walkthrough/recording or sequential interaction
  screenshots and explicit clicks/scrolls. **No screenshots = not done / no merge
  recommendation**. Owner approval is still required. Source:
  `.cursor/rules/ui-step-screenshot.mdc` §Required deliverables / §Interaction how /
  §Fail condition; `CURSOR_RULES.md` §Hard rules (short);
  `AGENTS.md` §Workflow → For UI.

## Ship / production done (manual acceptance only)

Localhost is development evidence only. Preview Ready ≠ Production Ready.
Never end a ship task at a draft PR. Follow requested PR order, reuse existing
implementations, fetch and compare with current main before merging. Source:
`AGENTS.md` §施工队安全条例 §§1–6 / 硬性禁止;
`docs/KNOWN_FAILURES.md` §Ship / Vercel.

| Required credential before saying ship done | Source |
| --- | --- |
| Verifiable `origin/main` tip SHA | `AGENTS.md` §施工队安全条例 §7 说 done 之前必须交齐凭证 |
| Every named PR `MERGED` + merge commit SHA; prove SHA is ancestor of `origin/main` | same §7 and §4 合并后确认 commit 已在 origin/main |
| Production deployment URL + success for that main SHA (Vercel in this repo) | same §7 and §5 等 Vercel Production deploy 完成 |
| Screenshot on the actual requested production URL | same §7 and §6 只验证任务点名的 production URL |
| At least one real interaction relevant to the task | same §7 |

Done requires all named PRs merged into main, visible production effect, and all
credentials above. Missing any means **not done**. Source: `AGENTS.md`
§施工队安全条例 → Done 定义. This kit/branch submission is not a production ship.

## Fail closed (manual acceptance, with field-presence gate)

Stop on missing permissions/secrets/settings/red checks; never invent a bypass.
Use the following non-empty fields. Source: `AGENTS.md` §Blocker table (when stuck —
stop, do not invent a bypass).

| Field | Required content |
| --- | --- |
| `blocked_on` | Missing secret, permission, red check, SHA mismatch |
| `evidence` | Command/API output, not speculation |
| `impact` | `blocked` (stop) or `degraded` (continue with limitation disclosed) |
| `human_action` | One human-only action |
| `not_doing` | Refused bypass, e.g. no force merge or localhost-as-prod |

For ship tasks the alternative source table is accepted too: `Blocker` |
`证据（命令或原文）` | `谁能解` | `不解则任务状态`, with a substantive evidence row.
Source: `AGENTS.md` §施工队安全条例 → Fail-closed blockers（不能解就停）.
Keep env/config in manual steps. Usage limits, existing main lint debt and missing
env are not signals to rewrite the product. Source: `QA.md` §Not code failures;
`docs/KNOWN_FAILURES.md` §CI / build / artifact / §GitHub / automerge / Bugbot.

## Approval and merge (manual acceptance)

- [ ] No owner approval = no merge. Native auto-merge may merge only after required
  checks/reviews pass, with main protection and allow-auto-merge configured by an
  admin; no agent/admin bypass or force merge. This kit neither approves nor
  merges. Source: `CURSOR_RULES.md` §Hard rules (short); `docs/AI_AUTOMERGE.md`
  §Principle / §Required GitHub settings / §Proven blockers (agent cannot flip these).
  The named `ci`, `playwright-dnd`, `cursor-review` checks are this repo's settings,
  not invented universal checks.

## Per-project overlays

Project rules stay in their own MD. The CLI reads the target checkout's tracked
`AGENTS.md`, `CLAUDE.md` (including nested ones), and `.cursor/rules/*.{md,mdc}`,
and lists paths + section titles as **additional manual items**. The sweep reads
these from each audited repo's default branch; reviewers must also inspect rules
on the PR branch. It does not promote their contents into automatic universal gates.
Source: `CURSOR_RULES.md` §Read in this order; `AGENTS.md` §Self-improvement
(rules need owner approval), plus the project sources below.

- `lilaclilac09/keyshield:CLAUDE.md` §GitNexus — Code Intelligence → Always Do /
  Never Do: impact before edits, detect_changes before commit, unresolved UNKNOWN
  and HIGH/CRITICAL risks must not be waved away. Only applies in keyshield.
- This repo: `.cursor/rules/landing-experiment-gate.mdc` §Home marquee (shipped
  slice): cinematic + marquee only; no restored rejected surfaces, no 390px
  overflow; `landing-desktop.png`, `landing-mobile-390.png`, `landing-marquee.png`.
- `lilaclilac09/resilient-agent-client:docs/CURSOR.md` §What is supported /
  §Permission boundary of resilient_fetch / §Verified (loopback only): evidence
  covers only the tested tool path, not Cursor's own traffic or an owner's
  untested install. This is an example of preserving precise verification scope,
  not a network-integration requirement for other projects.

## Running the kit (Node 20+, no packages)

```sh
node --test ops/acceptance
node ops/acceptance/check.mjs --body reply.md --files changed-files.txt
cat reply.md | node ops/acceptance/check.mjs --body -
node ops/acceptance/sweep.mjs --days 14
node ops/acceptance/sweep.mjs --days 14 --repos keyshield,aileen_machina_01
```

`--files` is a newline-delimited file (or JSON array of paths / `{filename}`
objects). Omitted files means UI applicability is **unknown**, explicitly reported;
it is not a claim that no UI changed. Run from the target repo root; optional
`--root <checkout>` selects its overlay checkout. CLI failures exit 1, input/API
errors exit 2. Checkbox verification only applies when checkboxes exist in
`checks run`; the text closer is equally valid. An unchecked checkbox needs an
explicit unrun/N/A reason; an empty checks section fails.

The machine gate checks syntax/presence: eight fields, merge value, speculative
phrases, UI artifact paths/links plus described interaction, apparent
localhost/preview-as-production claims, blocker fields and checks-run checkboxes.
It cannot prove artifacts exist, tests ran, root cause is correct, approvals exist,
or production was deployed. Negated/quoted banned phrases are excluded when
recognizable; ambiguous prose needs human review. UI detection covers common web,
mobile and view files, but a changed-files list cannot identify all visual changes.

Sweep uses authenticated `gh`, lists all non-fork owner repositories (including
archived ones), and paginates all PR states **updated** within the last N×24 hours.
That includes older PRs recently edited, not just newly created ones. It fetches
each PR's paginated files and body, never executes target code, and writes a
date-named report under ignored `reports/` (same-day reruns replace it). Audit
failures are findings (exit 0); API/incomplete-data errors exit 2, never a clean
audit. Reports contain PR prose only as check names, not entire potentially
sensitive bodies. No report or workflow changes repository protection settings.

Reuse from another repo in a PR workflow with `contents: read` and
`pull-requests: read` permissions:

```yaml
jobs:
  acceptance:
    uses: lilaclilac09/aileen_machina_01/.github/workflows/acceptance.yml@main
```

This gate must be configured as required by an owner/admin if desired. It does
not replace this repo's existing workflows or required checks.
