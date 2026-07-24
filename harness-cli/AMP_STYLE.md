# Amp-style: one harness, many CLIs

> How Amp ships agent UX — and how `hx` should grow the same way.

## What Amp actually does

Amp is not “one CLI with flags.” It is **one agent harness** with many thin fronts:

```text
                    ┌─ amp                 (interactive TUI)
                    ├─ amp -x / --execute  (oneshot turn)
                    ├─ amp --jetbrains     (IDE bridge)
                    ├─ amp (VS Code/Zed)   (editor bridge)
                    ├─ amp --no-tui        (headless runner / orbs)
                    ├─ amp tools|mcp|…     (ops CLIs)
                    ├─ amp review          (specialized skill surface)
                    └─ @ampcode/sdk        (programmatic execute/stream)
                              │
                              ▼
                     ┌─────────────────┐
                     │  Amp harness    │  turns · tools · threads ·
                     │  (single owner) │  subagents · oracle · MCP ·
                     └─────────────────┘  permissions · plugins
```

Same thread model, same tools, same `AGENTS.md` / settings — whether you typed in a TUI, piped stdin to `-x`, or called the SDK.  
That is the pattern: **harness is the product; CLIs are adapters.**

## Why this beats “rewrite Cursor the IDE”

| Strategy | Risk |
|----------|------|
| Fork VS Code first | You rebuild chrome before the loop is good |
| One mega `cursor` binary with everything inlined | Can’t embed, can’t test, can’t share with cloud runners |
| **Amp-style shared harness** | Every surface reuses cancel/tools/session/MCP |

Cursor Cloud Agents, local Chat, and CLI (if any) *should* look like Amp’s diagram. Cursor’s private stack may already be closer to this than the UI suggests — we just don’t get the library.

## Target shape for `hx`

```text
hx core (library)
  Harness · Turn · ToolRegistry · Provider · Session · Events
       ▲
       │  (only public agent API)
       │
  ┌────┴──────────────────────────────────────────┐
  │ adapters (all “CLIs”)                         │
  ├─ hx run / hx repl / hx review / hx mcp
  ├─ agent / cursor-agent / hx cursor   # Cursor-shaped UX
  └─ @hx/sdk (later)
  └───────────────────────────────────────────────┘
```

**Rule:** adapters never own conversation state. They only:

1. build a `Harness` (cwd, rules, tools, provider)
2. `prompt` / `steer` / `cancel` / stream events
3. render results (TUI / JSONL / editor apply)

## Mapping Amp CLI → hx

| Amp surface | hx equivalent | Notes |
|-------------|---------------|-------|
| `amp` TUI | `hx repl` → later Ratatui/Ink | Interactive turn loop |
| `amp -x` | `hx run` / `hx exec -x` | One turn, exit |
| `--stream-json` | `hx run --jsonl` | Editor/SDK integration |
| `amp tools list` | `hx tools` | Registry dump |
| `amp mcp add` | `hx mcp add` | MCP → same ToolRegistry |
| `amp review` | `hx review` | Prefixed system + read-only tools |
| IDE flags | `hx ide connect` | JSON-RPC over stdio / extension host |
| `--no-tui` runner | `hx runner` | Poll/remote threads; same harness |
| SDK `execute()` | `import { Harness } from 'hx'` | Library-first (Nanocodex + Amp) |

## What “给所有 CLI 加上 harness” means in practice

Not: wrap each binary in a different agent loop.  
Yes: **extract one driver; make every CLI a 50–200 LOC adapter.**

Concrete checklist for this repo:

1. Keep `src/core/*` importable with **zero CLI deps** (already the intent).
2. Move `bin/hx.ts` commands into `src/adapters/cli/*.ts` that only call core.
3. Add `hx exec -x` + `--jsonl` (Amp/Claude Code compatible stream events).
4. Add MCP adapter that **registers tools into the same map** builtins use.
5. Add `hx review` as a preset (system prompt + tool allowlist), not a second agent.
6. Later: VS Code extension talks JSON-RPC to the same core (or spawns `hx --jsonl`).

## Anti-patterns (Amp gotchas to avoid copying blindly)

- Don’t grow a plugin VM before the turn/tool invariants are solid.
- Don’t let IDE bridges invent a second history store.
- Don’t special-case cloud runners with a different tool semantics — swap backends (`local fs` ↔ `remote fs`), keep Tool names stable.

## One-line

**Amp model = many CLIs, one harness.**  
That’s the right way to “rewrite Cursor”: ship `hx` core once, then hang `run` / `repl` / `mcp` / `review` / IDE / cloud runners off it — not the other way around.
