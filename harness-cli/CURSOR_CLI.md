# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

# Cursor CLI → hx harness

Official Cursor ships `agent` with modes **agent / ask / plan**, `-p/--print`, MCP, resume, etc.  
We do **not** reimplement Cursor’s proprietary runtime. We expose a **Cursor-shaped CLI** that calls the same handwritten `Harness`.

```text
agent / cursor-agent / hx cursor
            │
            ▼
   src/adapters/cursorCli.ts     modes · print · slash
            │
            ▼
   Harness (src/core)            same as hx run/review/mcp
```

## Commands

```sh
# print (CI / scripts) — Cursor -p
node --experimental-strip-types bin/agent.ts -p "list files" --cwd .
node --experimental-strip-types bin/agent.ts -p "explore the harness" --mode ask --cwd .
node --experimental-strip-types bin/agent.ts -p "plan next steps" --plan --cwd .
node --experimental-strip-types bin/agent.ts -p "list files" --output-format jsonl --cwd .

# via hx
node --experimental-strip-types bin/hx.ts cursor -p "list files" --mode ask --cwd .

# interactive
node --experimental-strip-types bin/agent.ts --cwd .
# slash: /ask /plan /agent /tools /quit
```

## Mode → harness preset

| Cursor mode | Tools | System |
|-------------|-------|--------|
| `agent` | write+shell if `-f` (default on) | full agent |
| `ask` | read-only | explore, no edits |
| `plan` | read-only | output plan template |

## What this is / isn’t

| Is | Isn’t |
|----|-------|
| Cursor UX surface on hx | Official `cursor-agent` binary |
| Same session file `~/.hx/session.json` | Cursor cloud threads |
| Amp-style adapter | Second agent loop |
