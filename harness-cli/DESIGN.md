# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

# hx — Cursor-like agent harness (library-first CLI)

> Prototype design. Not a Cursor port. Goal: show what a **rewritable harness** looks like as an embeddable loop + thin CLI — same spirit as Nanocodex vs Codex.

## Thesis

Cursor’s product harness is IDE + cloud control plane + proprietary context assembly.  
What *can* be rewritten is the **model-facing runtime**:

```text
prompt → turn (steer/cancel) → tools / code-mode → result → checkpoint
```

`hx` owns that loop. Applications (CLI, TUI, IDE plugin, cloud worker) own UX and storage.

## Non-goals

- Not a Cursor fork / not API-compatible with Cursor
- No IDE embedding in v0
- No multi-provider portability theater — one mock + one OpenAI-compatible path
- No durable app-server / agent graph (Codex MultiAgentsV2 style)

## Crate / package map

```text
harness-cli/
  src/
    core/           # owned driver, turn, session, events
    tools/          # local tools + code-mode cell
    providers/      # mock | openai-compatible
    cli/            # thin adapter over core
```

Lower modules must work without the CLI (library-first).

## Ownership model

```text
HarnessBuilder
      │
      ▼
 private Driver ──────────────► Event bus (optional)
      ▲
 Harness (cloneable handle)
      │
      ├── prompt(text) ──► Turn
      │                     ├── steer(text)
      │                     ├── cancel()
      │                     └── result() ──► TurnResult + Checkpoint
      ├── fork() / forkFrom(checkpoint)
      └── snapshot() / resume(snapshot)
```

Invariants (ported from the Nanocodex / Codex harness reading):

1. `prompt()` accepts work; completion is `result()`.
2. Driver is the sole owner of mutable history / tool runtime / provider client.
3. Commit only completed turns. Partial failures do not enter history.
4. Cancel must stop in-flight tool work (best-effort abort signals in v0).
5. Fork samples the latest **completed** checkpoint, never a partial turn.

## Code Mode (v0)

One entry tool: `code_mode({ source })`.

- Model (or human in REPL) submits a small JS program.
- Host injects `tools.<name>(args)` bridges into a Function sandbox.
- Composition (`if` / loops / `Promise.all`) happens **inside one cell** — no model round-trip between each local tool call.

v0 sandbox is Node `AsyncFunction` with an allowlist bridge — not a security boundary. Production would use QuickJS / isolated-vm.

## Tool surface (v0)

| Tool | Purpose |
|------|---------|
| `read_file` | Read workspace file (bounded) |
| `list_dir` | List directory |
| `grep` | Ripgrep-ish substring search |
| `write_file` | Write file (opt-in `--write`) |
| `shell` | Bounded shell (opt-in `--shell`) |
| `code_mode` | Compose tools in one JS cell |

## CLI surface

```text
hx run "<prompt>"          # one-shot turn
hx repl                    # interactive turns on one session
hx tools                   # list registered tools
hx session show|clear      # inspect / drop ~/.hx/session.json
hx fork --from <id>        # branch from checkpoint (REPL helper)
```

Flags:

```text
--provider mock|openai     # default mock (offline demo)
--model <id>
--cwd <path>
--write / --shell          # dangerous tools off by default
--json                     # machine-readable TurnResult
```

## Provider adapter

```text
Provider.complete({ messages, tools }) → stream | final
```

- `mock`: deterministic tool-calling script for demos/tests (no network).
- `openai`: `POST /v1/chat/completions` with tools (env `OPENAI_API_KEY`, optional `OPENAI_BASE_URL`).

Cursor Cloud / Anthropic can be added later as more adapters — same Driver.

## Persistence

`~/.hx/session.json` stores the last checkpoint (unredacted history). Treat like secrets.  
CLI owns path; library only sees `Snapshot` bytes.

## Why this proves “Cursor harness can be rewritten”

| Cursor product piece | hx stance |
|----------------------|-----------|
| IDE Apply / Tab | out of scope — harness ends at tool results |
| Rules / index / PR cloud | app layer can inject system prompt + tools |
| Agent loop / tools / cancel / session | **this package** |
| Marketplace MCP | future: register MCP as tools into the same registry |

You rewrite the **loop**, not the IDE.

## Roadmap (not in this PR)

1. Real streaming + token usage events  
2. MCP stdio client  
3. Subagent spawn/fork exposed into Code Mode  
4. Rust core (Nanocodex-style) with this CLI as a consumer  
5. Harbor / eval harness for regression

## Amp-style growth

See [AMP_STYLE.md](./AMP_STYLE.md): every future command (`mcp`, `review`, IDE bridge, runner, SDK)
is an **adapter** over this same `Harness` driver — same pattern as Amp’s `amp` / `amp -x` / IDE / SDK sharing one agent runtime.

## Upstream Nanocodex (teacher)

System map and source pointers for Georgios’s library-first harness (read-only study notes in this folder):

- [NANOCODEX_ARCHITECTURE.md](./NANOCODEX_ARCHITECTURE.md) — layers, ownership, turn sequence, adapters  
- [NANOCODEX_SOURCE_MAP.md](./NANOCODEX_SOURCE_MAP.md) — crate→path map, example ladder, Nanocodex↔hx gaps  

https://github.com/gakonst/nanocodex