# hx

Library-first **Cursor-like agent harness** CLI prototype.

See [DESIGN.md](./DESIGN.md) for architecture.

## Quick start

```sh
cd harness-cli

# list tools
node --experimental-strip-types bin/hx.ts tools

# offline demo (mock provider — no API key)
node --experimental-strip-types bin/hx.ts run "list files" --cwd .
node --experimental-strip-types bin/hx.ts run "use code mode to count md files" --cwd .

# optional live model
OPENAI_API_KEY=… node --experimental-strip-types bin/hx.ts run "read DESIGN.md and summarize" --provider openai --cwd .

# interactive
node --experimental-strip-types bin/hx.ts repl --cwd .
```

Or: `pnpm hx -- tools` / `npm run hx -- run "list files"`.

## What this is

A tiny owned agent loop (`prompt → turn → tools/code_mode → checkpoint`) plus a thin CLI — the part of a Cursor-style harness that *can* be rewritten. Not a Cursor port.
