# CURSOR_RULES.md

Always-on index for Cursor agents. Constitution is [`AGENTS.md`](AGENTS.md). Do not skip it.

```txt
follow AGENTS.md and QA.md. do not say done without verification.
never mark a task complete based only on code inspection.
```

## Read in this order

1. [`AGENTS.md`](AGENTS.md) — inspect → plan → patch → verify; production ship 红线
2. [`QA.md`](QA.md) — commands + flow checklists
3. [`docs/AGENT_TOOL_MAP.md`](docs/AGENT_TOOL_MAP.md) — task → required tools
4. [`docs/KNOWN_FAILURES.md`](docs/KNOWN_FAILURES.md) — verified pitfalls (CI / cover / ship)
5. [`PROJECT_RULES.md`](PROJECT_RULES.md) — product facts (mood, orb, Visual, contact, doors)
6. [`.github/pull_request_template.md`](.github/pull_request_template.md) — every PR fills this
7. [`ops/lessons/README.md`](ops/lessons/README.md) — after a failure, write a lesson; propose rules, do not rewrite them

Injected every session (`.cursor/rules/`):

- `senior-engineer-loop.mdc`
- `verification.mdc`
- `debug-repro-loop.mdc` (bugs: repro → hypotheses → evidence → root cause)
- `ui-step-screenshot.mdc` (UI merge: stills + interaction)

## Hard rules (short)

- inspect before edit
- bugs: no fix without repro + verified root cause (see `debug-repro-loop.mdc`)
- pick tools from `docs/AGENT_TOOL_MAP.md`; do not invent a parallel stack
- CI/cover/ship: skim `docs/KNOWN_FAILURES.md` first
- smallest safe diff
- no redesign unless asked
- no parallel systems
- no “done” without verification you actually ran
- UI changes need screenshots
- env/config issues go in `manual steps` + fail-closed blocker table in `AGENTS.md`
- end with `safe to merge:`
- orchestration: see decision table in `.cursor/prompts.md`
