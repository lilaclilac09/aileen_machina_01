# hx

Handwritten **Amp-style** agent harness: **one core, many CLIs**.

## Start reading here

**[READ_ME_MODES.md](./READ_ME_MODES.md)** — why, scenarios, different profiles — with **separate reading modes** (elevator → map → scenarios → deep → checklist).

| Doc | What |
|-----|------|
| [READ_ME_MODES.md](./READ_ME_MODES.md) | **Why + scenarios + different** (pick a reading mode) |
| [HANDWRITTEN_HARNESS.md](./HANDWRITTEN_HARNESS.md) | Follow-along build steps S0–S8 |
| [AMP_STYLE.md](./AMP_STYLE.md) | One harness → many CLIs |
| [CURSOR_CLI.md](./CURSOR_CLI.md) | Cursor-shaped `agent` adapter |
| [CURSOR_REWRITE.md](./CURSOR_REWRITE.md) | Cursor-class product layers |
| [DESIGN.md](./DESIGN.md) | Original design notes |

## Quick start

```sh
cd harness-cli

node --experimental-strip-types bin/hx.ts tools
node --experimental-strip-types bin/hx.ts -x "list files" --cwd .
node --experimental-strip-types bin/hx.ts -x "list files" --cwd . --jsonl
node --experimental-strip-types bin/hx.ts review --cwd .
node --experimental-strip-types bin/hx.ts -x "create file via patch" --cwd . --write
node --experimental-strip-types bin/hx.ts mcp add demo -- false
node --experimental-strip-types bin/hx.ts tools   # shows mcp__demo__status
node --experimental-strip-types test/smoke.ts
```

## Layout

```text
src/core/        Harness · types · registry · rules     ← only owner of state
src/tools/       builtins + apply_patch + code_mode
src/providers/   mock | openai
src/mcp/         config → same ToolRegistry
src/adapters/    CLI only (no history ownership)
bin/hx.ts        thin dispatcher
```

Teacher harness study notes: [NANOCODEX_ARCHITECTURE.md](./NANOCODEX_ARCHITECTURE.md) · [NANOCODEX_SOURCE_MAP.md](./NANOCODEX_SOURCE_MAP.md)

## See the resolved harness

```sh
node --experimental-strip-types bin/hx.ts footer-demo --harness Nanocodex --cwd .
node --experimental-strip-types bin/hx.ts -x "list files" --cwd . --ab --harness Nanocodex
```

Footer shows **resolved** `Nanocodex`/`Codex` (not A/B `Codex*` lumping). A/B provenance stays in structured `hx.execution` JSON + `assignment` metadata.


`run` / `-x` / `repl` / `review` / `tools` / `mcp` / `session` / **`cursor` (`agent`)** — all adapters.

Cursor-shaped surface: [CURSOR_CLI.md](./CURSOR_CLI.md)

```sh
node --experimental-strip-types bin/agent.ts -p "list files" --mode ask --cwd .
node --experimental-strip-types bin/hx.ts cursor -p "plan next steps" --plan --cwd .
```

