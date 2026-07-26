# Harness — why, scenarios, different modes

> One document you can **read in different modes**.  
> Implementation lives in this folder (`hx` / `agent`). This file is the **mental model**.

---

## How to read this (pick a mode)

| Mode | Time | Path | For |
|------|------|------|-----|
| **A · Elevator** | ~2 min | [Mode A](#mode-a--elevator) only | “Why does this exist?” |
| **B · Map** | ~8 min | A → [Mode B](#mode-b--map) | Product / architecture sense |
| **C · Scenarios** | ~10 min | [Mode C](#mode-c--scenarios) | “When do I use which CLI?” |
| **D · Different** | ~10 min | [Mode D](#mode-d--different-harness) | Profiles: ask/plan/agent/ci/cloud |
| **E · Deep** | ~25 min | A→B→C→D→[Mode E](#mode-e--deep) + links | Build or review the code |
| **F · Checklist** | ~5 min | [Mode F](#mode-f--checklist) | “Is this a *good* harness?” |

**Separate reading tip:** don’t read top-to-bottom once. Pick a mode, stop when the table says stop.

---

## Mode A — Elevator

**Problem:** Models only emit tokens. Coding-agent quality comes from the **runtime around** them: tools, history rules, cancel, cache, multi-entry CLIs.

**Without a harness:** each of `CLI` / IDE / CI / cloud invents its own loop → inconsistent behavior, broken cancel, untestable agents.

**With a harness:** one owned loop; surfaces are thin adapters (Amp-style).

```text
ask · plan · agent · review · CI · cloud
                 ↓
            Harness core
```

**This repo:** `harness-cli/` proves that — `hx` + Cursor-shaped `agent`, same driver.

→ Stop here for Mode A. Or continue to Mode B.

---

## Mode B — Map

### What the harness owns vs not

| Owns (core) | Does not own (product) |
|-------------|-------------------------|
| Turns, tool calls, commit rules | IDE Apply chrome / Tab |
| Cancel / checkpoint / fork | Billing, team ACL |
| Tool registry (builtin + MCP) | Vector index service |
| Event stream (JSONL) | Pixel-perfect TUI |

### Why (problems solved)

1. **Correctness** — only finished turns enter history; cancel can stop work  
2. **Consistency** — `hx -x` and `agent --mode ask` share one brain  
3. **Composability** — Code Mode / MCP register into one table  
4. **Testability** — mock provider, offline smoke  
5. **Room to optimize** — cache, incremental history, streaming (later)

### Stack (mental)

```text
L5  Cloud / PR / billing          optional
L4  IDE UX                         adapters later
L3  Context: rules, MCP, @files    partial in hx
L2  Harness loop                   ← this package
L1  Model I/O                      mock | openai
```

**Doctrine:** rewrite/improve **L2+L3**; rent or fork the editor; cloud last.

→ Related: `CURSOR_REWRITE.md` · `AMP_STYLE.md`  
→ Stop for Mode B, or go to Mode C.

---

## Mode C — Scenarios

Read as a **menu**: find your situation → command.

| # | Scenario | What you want | Command / surface |
|---|----------|---------------|-------------------|
| 1 | Quick question, no edits | Explore repo | `agent -p "…" --mode ask` |
| 2 | Design before coding | Steps + risks | `agent -p "…" --plan` |
| 3 | Actually change code | Patch / shell | `agent -p "…" -f` or `hx -x … --write` |
| 4 | Structured critique | Findings list | `hx review` |
| 5 | Script / CI | Machine output | `… -p … --output-format jsonl` |
| 6 | Interactive session | Multi-turn | `agent` or `hx repl` · slash `/ask` `/plan` `/agent` |
| 7 | Batch local tools | Fewer model round-trips | prompt that triggers `code_mode` |
| 8 | Extra tools | Same registry | `hx mcp add …` then run again |
| 9 | Resume thread | Same checkpoint | `agent resume` / `hx session show` |
| 10 | Embed in another app | No CLI | `import { Harness } from './src/index.ts'` |

### Scenario flow (happy path)

```text
new task?
  ├─ unsure how → plan
  ├─ just understand → ask
  ├─ ship a fix → agent (+ write)
  └─ gate in CI → print + jsonl
```

→ Stop for Mode C, or Mode D for *why* those differ.

---

## Mode D — Different harness

**“Harness for different” does *not* mean different engines.**  
It means different **profiles** on one core.

### Same vs different

| Keep identical | Vary per profile |
|----------------|------------------|
| Driver loop | `systemExtra` |
| History commit rules | Tool allow/deny |
| Checkpoint format | `write` / `shell` |
| Registry mechanism | Provider / model |
| Event shapes | Output adapter |

### Profiles (as used today)

| Profile | Tools | Intent |
|---------|-------|--------|
| **ask** | read-only | Explore, cite paths |
| **plan** | read-only | Goal → steps → files → risks → verify |
| **agent** | patch (+ shell if force) | Implement |
| **review** | read-only + rubric | Findings / risks / next |
| **ci** | whatever policy + jsonl | Non-interactive |
| **cloud** *(planned)* | same names, remote backends | Laptop closed |

### Anti-pattern

```text
❌  askHarness.ts  +  agentHarness.ts  +  ciHarness.ts
✅  one Harness + profile { system, tools, flags }
```

→ Stop for Mode D. Builders: Mode E / F.

---

## Mode E — Deep

Read in this order (code + docs):

1. **Why / Amp pattern** — this file Modes A–D · `AMP_STYLE.md`  
2. **Hand-write steps S0–S8** — `HANDWRITTEN_HARNESS.md`  
3. **Core** — `src/core/harness.ts` · `types.ts` · `registry.ts` · `rules.ts`  
4. **Adapters** — `src/adapters/factory.ts` · `cli.ts` · `cursorCli.ts`  
5. **Cursor UX mapping** — `CURSOR_CLI.md`  
6. **Product climb** — `CURSOR_REWRITE.md`  
7. **Prove** — `test/smoke.ts` + commands in `README.md`

### Foundations (invariants)

1. Model–harness co-design: change the harness → change effective capability  
2. Single mutable owner (the driver)  
3. `prompt()` accepts; `result()` completes  
4. Client-owned history is authoritative  
5. Tools are capability boundaries (cwd jail, caps, defaults off)

### Optimizations (after foundations)

| Lever | Pays for |
|-------|----------|
| Stable prompt prefix / cache key | Cost + stability |
| Incremental history | Less tokens per turn |
| Persistent transport | Warm first token |
| Code Mode batching | Fewer model round-trips |
| JSONL events | IDE/CI without second history |
| Read-only profiles | Fewer foot-guns |

### What’s good vs not-yet in `hx`

| Good enough for v0 | Next for a *good* harness |
|--------------------|---------------------------|
| One loop, many CLIs | Real MCP stdio |
| ask/plan/agent presets | Explicit profile files |
| mock + smoke | Eval task set |
| rules + apply_patch | Hard cancel / process groups |
| jsonl events | True token streaming |

→ Then Mode F before merging harness changes.

---

## Mode F — Checklist

Use when reviewing a PR or designing a profile:

- [ ] One driver owns conversation state (adapters don’t)  
- [ ] Partial tool failures don’t commit as success  
- [ ] Cancel has a real Abort path  
- [ ] Dangerous tools default off; profiles opt in  
- [ ] MCP/builtins share one registry  
- [ ] ask/plan/review cannot write  
- [ ] CI path exists (`-p` + jsonl/json)  
- [ ] Offline test exists (mock)  
- [ ] New surface = new adapter, not new `Harness` class  
- [ ] Docs say which **reading mode** / profile this change is for  

---

## Quick links

| Doc | Role |
|-----|------|
| `README.md` | Commands to run |
| `HANDWRITTEN_HARNESS.md` | Build steps S0–S8 |
| `AMP_STYLE.md` | One harness, many CLIs |
| `CURSOR_CLI.md` | Cursor-shaped `agent` |
| `CURSOR_REWRITE.md` | L1–L5 product climb |
| `DESIGN.md` | Original design notes |

---

*Reading modes are intentional: same content, different depth — like ask / plan / agent for your attention.*
