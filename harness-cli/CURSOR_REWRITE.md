# Rewriting Cursor — product map

> Companion to [DESIGN.md](./DESIGN.md).  
> `hx` = rewritable **harness loop**. This note = what a **Cursor-class product** rewrite actually is.

## Short answer

**You can rewrite a Cursor-*class* product. You cannot “port Cursor” the way Nanocodex ports Codex.**

| Approach | Feasible? | What you get |
|----------|-----------|--------------|
| A. Fork VS Code / Code - OSS + plug in your harness | Yes | Real IDE + your agent |
| B. Build agent-first (CLI/TUI → then editor plugin) | Yes (what `hx` starts) | Ship loop first; IDE later |
| C. 1:1 clone Cursor proprietary stack | No | Closed source, no parity spec, illegal/impossible |

Nanocodex works because Codex exposes a separable runtime to study. Cursor’s moat is the **integrated product**, not a published harness crate.

## Cursor as layers (what to rewrite)

```text
┌─────────────────────────────────────────────────────────┐
│  L5  Cloud Agents / VMs / PR / team / billing           │  ← hardest, optional v1
├─────────────────────────────────────────────────────────┤
│  L4  IDE UX: Chat, Composer, Apply, Inline Edit, Tab    │  ← product feel
├─────────────────────────────────────────────────────────┤
│  L3  Context: rules, index, @files, git, MCP, memories  │  ← quality of answers
├─────────────────────────────────────────────────────────┤
│  L2  Harness: turns, tools, cancel, fork, code-mode     │  ← hx is here (done-ish)
├─────────────────────────────────────────────────────────┤
│  L1  Model I/O: provider adapters, streaming, cache     │  ← partial in hx
└─────────────────────────────────────────────────────────┘
```

**Cursor ≈ L1–L5 glued into one opinionated product.**  
**hx today ≈ thin L1 + L2 + toy tools.**  
Rewriting Cursor means climbing the stack deliberately — not rewriting Electron chrome first.

## Recommended rewrite strategy (B → A)

### Phase 0 — Harness (now)

Owned loop + tools + session. CLI is the first app.

**Done in this repo:** `harness-cli/` (`hx`).

### Phase 1 — Local coding agent that feels “Cursor-y”

Still no IDE fork:

| Feature | How |
|---------|-----|
| Rules | `.hx/rules/*.md` → system prompt prefix |
| @file / @folder | CLI args + tool prefetch into context |
| MCP | Register MCP tools into the same registry as builtins |
| Apply | Tool `apply_patch` → unified diff → review in terminal / `$EDITOR` |
| Streaming | Provider events → stderr / JSONL |
| Subagents | `spawn` / `fork` exposed to Code Mode (Nanocodex pattern) |

Exit criteria: `hx run` can fix a real bug in-repo with rules + MCP + patch apply, offline-evalable.

### Phase 2 — Editor adapter (not a new IDE yet)

One of:

1. **VS Code extension** that shells to `hx` / embeds the library over JSON-RPC  
2. **Language Server–style agent protocol** (prompt/steer/cancel/apply)  
3. **WASM core** in a web IDE later

The IDE must **not** own conversation state — only the harness driver does (Nanocodex invariant).

Exit criteria: select code → “edit with hx” → diff preview → apply in buffer.

### Phase 3 — IDE shell (Code - OSS fork)

Only after L2–L3 are good:

- Fork [Code - OSS](https://github.com/microsoft/vscode) / use OpenVSX builds  
- Replace Copilot-ish UX with hx-backed Chat + Composer panels  
- Wire workspace index (ripgrep + optional embeddings) into L3  
- Keep Tab / inline complete as a **separate** small model path (don’t block agent loop)

This is “rewrite Cursor the app,” but your secret sauce remains **L2+L3**, not the fork.

### Phase 4 — Cloud (Cursor Cloud Agents–class)

| Piece | Minimal version |
|-------|-----------------|
| Runner | Firecracker / Docker / existing cloud agent host |
| Workspace | clone repo + secrets allowlist |
| Orchestration | same harness; remote tools instead of local |
| Delivery | branch + PR (like this Cursor Cloud agent) |

Do **not** invent a second agent graph. Same `Harness` driver; swap tool backends (`local` → `remote`).

## What you should *not* copy from Cursor

1. **Closed model routing / proprietary prompts** — design your own; measure with evals  
2. **Pixel-perfect UI** — ship apply reliability before chrome  
3. **Everything-as-one-process** — keep library-first or you can’t test/embed  
4. **Fake “compatible with Cursor”** — there is no public wire protocol to be compatible with

## Comparison: Nanocodex vs “NanoCursor”

| | Nanocodex | NanoCursor (this plan) |
|--|-----------|-------------------------|
| Reference | Codex runtime invariants | Cursor *product layers* (no source parity) |
| Core deliverable | Rust agents SDK | Harness lib + apps (CLI → extension → IDE) |
| Hard part | Fidelity to Responses/tools | Context assembly + Apply UX + trust |
| Skip | Codex app server | Cursor billing/cloud until loop is good |

## Concrete next builds (ordered)

1. `apply_patch` tool + `hx apply --check`  
2. `.hx/rules` loader  
3. MCP stdio bridge → tool registry  
4. JSONL event stream (`--jsonl`) for editor adapters  
5. VS Code extension MVP (prompt + apply only)  
6. Eval set (10–20 repo tasks) before any IDE fork

## One-line doctrine

**Rewrite Cursor by owning the harness and context layers; rent or fork the editor; build cloud last.**  
`hx` is the start of that rewrite — not a Cursor clone.
