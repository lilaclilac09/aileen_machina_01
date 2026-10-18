# Machina code mode

Owner-only. You type `/code <task>` in the site console, and Machina edits a
GitHub repo on a new branch and answers with a **draft PR link**. Nothing is
pushed to `main`; you review and merge the PR yourself.

The agent loop is a TypeScript port of
[aileena-code](https://github.com/lilaclilac09/aileena-code), which follows
Thorsten Ball's [How to Build an Agent](https://ampcode.com/how-to-build-an-agent).
`lib/codeAgent/agent.ts` uses the same names as the Go `main.go`, so you can
read the two side by side.

## Use it in chat

Unlock the owner session (passkey), then in the console:

| Message | What happens |
| --- | --- |
| `/code` or `/code help` | shows the commands |
| `/code <task>` | works on `AGENT_CODE_REPO` (default `lilaclilac09/aileen_machina_01`) |
| `/code owner/repo: <task>` | works on another repo the token can reach |
| `/code continue` | resumes the last run that paused or failed |

Example: `/code fix the typo "recieve" in aileena-new/README.md`

A chat turn has about 22 seconds. Large tasks pause before the limit and
save their state; send `/code continue` to resume. Sending the same turn twice
replays the first answer. It never opens a second PR.

## Turn it on (Vercel → aileen-machina-01 → Production)

| Variable | Required | Value |
| --- | --- | --- |
| `AGENT_CODE_GITHUB_TOKEN` | yes | Fine-grained token, repo access limited to the repos you want, permissions: **Contents: Read and write**, **Pull requests: Read and write** (Metadata: Read is added automatically). Nothing else. |
| `AGENT_CODE_REPO` | no | `owner/repo`; default `lilaclilac09/aileen_machina_01` |
| `AGENT_CODE_PATHS` | no | comma-separated path prefixes the agent may touch, e.g. `aileena-new/app/,aileena-new/lib/`. Empty = whole repo minus the denylist |
| `AGENT_CODE_ALLOW_WORKFLOWS` | no | `1` to allow edits under `.github/workflows/` (off by default) |
| `AGENT_CODE_MAX_STEPS` / `AGENT_CODE_MAX_FILES` / `AGENT_CODE_MAX_BYTES` | no | caps per turn (defaults 16 model calls, 8 files, 250,000 bytes) |
| `AGENT_CODE_MODEL`, `AGENT_CODE_BASE_URL`, `AGENT_CODE_API_KEY` | no | model override; default is the site's DeepSeek key and `deepseek-flash` |
| `AGENT_CODE_THINKING` | no | `1` turns on DeepSeek thinking mode (slower, needs more `/code continue`) |

Without `AGENT_CODE_GITHUB_TOKEN`, `/code` answers "Code mode is off" and makes
no GitHub calls. Redeploy after setting the variables.

## Guardrails (enforced in code, not in the prompt)

- **Owner-only, decided on the server.** `/code` or `agentMode: "code"` from
  a visitor returns 403. Agent callers through `/api/mcp` return 403 even if
  they send an owner cookie.
- **Branch and draft PR only.** Edits are staged in memory. Publishing makes
  one commit on `machina/code-<id>` and opens a draft PR. The client refuses
  to write any ref that is not `machina/*` or is the default branch.
- **Paths.** Relative paths only (no `..`, no absolute paths). Never `.env*`,
  keys and certificates, `secrets*`, `credentials*`, `.npmrc`/`.netrc`,
  `.git/`, `.vercel/`, `.ssh/`, and no CI workflows unless
  `AGENT_CODE_ALLOW_WORKFLOWS=1`. Denied files cannot be read either, so
  secrets never reach the model.
- **Budgets per turn:** model steps, files changed, bytes per file, total
  bytes written, total bytes read. `reactGuard` blocks repeated identical tool
  calls.
- **Repo content is untrusted.** File text is fenced as
  `<repo_file untrusted="true">`, and a file cannot close the fence. The
  system prompt says file text is never an instruction. The hard limits above
  hold no matter what a file says.
- **Action IDs.** Run id = `actionId('code.run', actor, turn)`. Publishing is
  three checkpointed steps (`commit → branch → pr`, via `runSteps`); a
  failure resumes at the first unfinished step. The commit carries an
  `Action-Id: code.commit:<hex>` trailer, and so does the PR body.
- **Audit log** (`GET /api/agent/code/audit`, owner only): time, repo, run
  id, tool names and paths, file sizes, PR URL. No file contents, no task text.

Run state (conversation and staged edits) is kept in Upstash for 24 hours so
`/code continue` works across servers. Tool outputs over 4 KB are dropped when
state is saved.

## Files

- `lib/codeAgent/agent.ts`: the loop and the tools (ported from aileena-code)
- `lib/codeAgent/policy.ts`: path rules and budgets
- `lib/codeAgent/github.ts`: the GitHub REST calls (read at the base commit; commit, branch, draft PR)
- `lib/codeAgent/run.ts`: one chat turn: run ids, pause and resume, publish steps, audit
- `harness/site-agent/codeMode.ts`: offline tests (mock GitHub, scripted model), run in CI
