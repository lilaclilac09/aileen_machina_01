# hx

Handwritten **Amp-style** agent harness: **one core, many CLIs**.

| Doc | What |
|-----|------|
| [HANDWRITTEN_HARNESS.md](./HANDWRITTEN_HARNESS.md) | **跟做拆解 S0–S8** |
| [AMP_STYLE.md](./AMP_STYLE.md) | 为什么所有 CLI 共用一个 harness |
| [CURSOR_REWRITE.md](./CURSOR_REWRITE.md) | 重写 Cursor-class 产品的分层 |
| [DESIGN.md](./DESIGN.md) | 原设计笔记 |

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

## CLIs → same Harness

`run` / `-x` / `repl` / `review` / `tools` / `mcp` / `session` — all adapters.
