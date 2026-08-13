# CURSOR_RULES.md

Always-on index for Cursor agents. Constitution is [`AGENTS.md`](AGENTS.md). Do not skip it.

```txt
follow AGENTS.md and QA.md. do not say done without verification.
never mark a task complete based only on code inspection.
```

## Read in this order

1. [`AGENTS.md`](AGENTS.md) — inspect → plan → patch → verify; production ship 红线
2. [`QA.md`](QA.md) — commands + flow checklists
3. [`PROJECT_RULES.md`](PROJECT_RULES.md) — product facts (mood, orb, Visual, contact, doors)
4. [`.github/pull_request_template.md`](.github/pull_request_template.md) — every PR fills this

Injected every session (`.cursor/rules/`):

- `senior-engineer-loop.mdc`
- `verification.mdc`
- `ui-step-screenshot.mdc` (UI merge: stills + interaction)

## Hard rules (short)

- inspect before edit
- smallest safe diff
- no redesign unless asked
- no parallel systems
- no “done” without verification you actually ran
- UI changes need screenshots
- env/config issues go in `manual steps`
- end with `safe to merge:`
