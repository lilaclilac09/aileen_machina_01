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
