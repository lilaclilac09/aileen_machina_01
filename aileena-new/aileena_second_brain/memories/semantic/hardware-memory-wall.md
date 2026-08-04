# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

# Hardware — Memory Wall (SemiAnalysis lens)

## Core claim

HBM bandwidth is the binding constraint on modern AI accelerators. GPUs often stall waiting for weights + KV cache during **decode** (one token at a time, full weight + full KV read per step).

## Why external file memory helps

| Technique | Effect on inference |
|-----------|---------------------|
| Markdown L3 cold store | Keep system prompt short; retrieve on demand |
| Dreaming compression | Fewer tokens per fact after consolidate |
| BM25 / vector retrieval | Load only relevant chunks, not full corpus |
| LoRA weight update | Train small adapters; avoid full-model fine-tune VRAM |

## Stack mapping

1. **Working memory** — chat session + last N turns (trimmed before each request)
2. **L2 cache** — build-time `memoryIndex.json` TF-IDF (this deploy)
3. **L3 cold** — `memories/**` in git
4. **L4 persona** — optional O-Mem → `persona-auto.md`

Long context models help L1 but do not replace L3 — they increase KV cost if you dump everything into the window.
