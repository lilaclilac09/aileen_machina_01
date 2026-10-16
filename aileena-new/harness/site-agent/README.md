# Site-agent harness

Eval harness for the Machina console (`POST /api/chat`). Nothing in here is imported by the app.

```bash
cd aileena-new
node harness/site-agent/run.mjs                    # local dev (http://localhost:3000)
node harness/site-agent/run.mjs --target live      # https://www.aileena.xyz, live-safe cases only
node harness/site-agent/run.mjs --target live --plan            # show what would be sent, send nothing
node harness/site-agent/run.mjs --rescore reports/<run>.json    # re-apply edited checks to captured replies
npx -y tsx harness/site-agent/offline.ts           # pure routing / gating checks, no network, no secrets
```

The runner needs Node 20 and nothing else: no install and no new packages.

## Layout

| Path | What |
|---|---|
| `cases/site-agent.json` | The suite as data: 26 cases across persona, grounding, refusal, security, owner gate, mode routing, language, tool calls and side effects, plus the system-prompt **canary** strings. |
| `run.mjs` | Runner. Builds AI SDK `UIMessage` bodies, parses the UI message SSE stream (text deltas, `tool-input-start` tool names, errors), keeps a cookie jar so the visitor's 20/day quota is respected, and writes reports. |
| `checks.mjs` | Deterministic assertions (status, `X-*` headers, regex all/any/not, canaries, language guess, sentence cap, tools called / none) and passive header checks. |
| `judge.mjs` | Optional LLM-as-judge on each case's `judge` rubric. Off unless `HARNESS_JUDGE_API_KEY` is set (`HARNESS_JUDGE_BASE_URL`, `HARNESS_JUDGE_MODEL`, OpenAI-compatible). Judge results are warnings and never fail a case. |
| `offline.ts` | Checks the functions `/api/chat` runs before the model: `decideAgentMode`, `isCouncilPipelineRequest`, the browse, scratch and forge parsers, and the College lane. `KNOWN` marks a confirmed issue that is not counted as a regression. |
| `reports/` | `<target>-<ISO time>.json` + `.md` per run. `*-latest.*` is gitignored. |

## Safety rules (enforced in code, not only in the case file)

- The runner only ever POSTs to `/api/chat`. It never calls `/api/chat/forward`, `/api/lead` or `/api/send`, so no contact note or email is ever sent.
- `SIDE_EFFECT_TRIGGERS` in `run.mjs` refuses to send any visitor line on live that would write before the model runs:
  - the forge lane, which writes `PATCH.md` on the Cloudflare desk;
  - visitor scratch commands (`note:`, `find …`, `list`, …), which queue a computer task;
  - Browser Use prepare.
- Cases tagged `live: false` or `sideEffect` are skipped on live. On local they run only with `--include-side-effects`.
- Live defaults: 2.5 s between requests and at most 24 requests per run. Forged owner cookies are sent only on the case that tests them.
- The reports drop `Set-Cookie` values, so visitor ids are never committed.
- Every live question still lands in the evolution live inbox (`enqueueLiveAsk`) like any visitor's. The `X-Trace-Id: harness-<case>` header makes those rows easy to spot and drop.

## Local dev

`DEEPSEEK_API_KEY` (or `AGENT_API_KEY`) is required for model turns. Without it, `/api/chat` degrades with a 500 `no_model` reply. The owner-gate, lane and 400/403 cases still pass, because they never reach the model. `UPSTASH_*` is optional: visitor soft memory and the live inbox go quiet without it.
