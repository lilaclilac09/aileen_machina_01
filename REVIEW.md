# REVIEW.md

What reviewer, QA, security, and merge gate check in this repo. Keep it short. Repeated review comments go here. For why these rules exist and where a person still decides, see `HARNESS.md`.

App: `aileena-new/` (pnpm). Full-repo `pnpm lint` is red on `main`; lint touched files only.

## What failure looks like here

- **Owner-only:** an owner feature unlocks without a server-side check, or unlocks from a client field, cookie name, or contact-inbox env.
- **Contact:** a council transcript reaches public contact (`POST /api/lead`, `POST /api/chat/forward`) or gets emailed.
- **Quota:** a public POST that sends mail or calls a model has no server-side limit.
- **Secrets:** a key, token, or private transcript reaches the client, a log, or an error body.
- **Runtime:** the change was only read, never run.
- **Docs:** a doc says something the code doesn't do.
- **Config/CI:** a workflow skips a check, or runs it against the wrong base.

## Risk tier (set by the change, not the author)

| Tier | Examples | Who must approve |
| --- | --- | --- |
| Low | docs, copy, cosmetic spacing, new code behind a flag | all automated checks green; still needs `ai-auto-merge` |
| Medium | ordinary product or UI change | one human |
| Always human | `lib/owner-access.ts`, `/api/owner/*`, `/api/auth/*`, `/api/lead`, `/api/chat/forward`, `lib/agentMode.ts`, council, env, `.github/workflows/*` | one human, plus security approve |

An agent's approve never fills a human slot. Whoever directed the agent counts as a reviewer.

## Hard gates (any one fails → no auto-merge)

build · typecheck · required tests · runtime path observed · public UI not broken · owner-only enforced server-side · no secret exposed · env documented · screenshots for UI · reviewer approve · QA verified · security approve if relevant · not draft · branch up to date

## Evidence rules

- Each finding cites a file and line. No guessing from a name.
- "Verified" means a command ran and its output is quoted, or a screenshot exists. Reading the diff is not verified.
- UI changes need screenshots: entry, triggered, success, blocked/error, narrow.
- API changes need a smoke request with status code and body shape.

## Findings

- Tag each finding **Important**, **Nit**, or **Pre-existing**. Pre-existing bugs don't block the PR and aren't the author's fault.
- At most 3 nits per review.
- Every Important finding is fixed or closed with a written reason before merge.
- Report a bug as a class so the author fixes every instance.
- Start the summary with a count. If there's nothing to fix, say "0 findings."

## Rounds

- Max 3 review rounds. After that, the author steps back and rethinks the approach.
- After round 1, re-review only the new diff. Don't repeat findings already posted.

## Approvals bind to a SHA

An approve covers one head SHA. Any new commit, agent push, or hand-resolved merge voids it and needs a new approve.

## PR body must include

files changed · root cause · runtime path · checks run (with output) · Risk · How to revert · env/manual steps

## Stacked or overlapping PRs

PRs touching the same files (e.g. #423 and #424 on `lead` and `chat/forward`) are re-checked together on top of `main` before either merges. Neither may revert the other.

## If agents disagree

Take the most conservative verdict. Missing evidence → human review required.

## Skip

`node_modules`, generated index JSON, lockfile churn unless deps changed.

## After merge

Any revert or incident gets added to the reviewer's eval set with the PR, the bug's location, and the fix. First case: #418 (merged past the gate, request changes, not verified).
