# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

# Dreaming — offline compression layer

Dreaming is periodic offline memory consolidation (like sleep). It does **not** run during chat inference — CPU-only, no GPU KV pressure.

## What it does

- Summarize episodic threads into semantic facts
- Deduplicate overlapping memories
- Abstract repeated patterns into `procedural/skills/*.md`
- Decay stale entries into `archived/`
- Optionally emit `training_data/` rows for future LoRA (Qwen2.5-14B)

## How we run it

1. Weekly: `pnpm dreaming` → `scripts/dreaming-consolidate.ts`
2. Human review the generated report under `memories/archived/`
3. Merge approved summaries into `semantic/` or `personal/`
4. Rebuild index: `pnpm build:memory-index` (also runs on `pnpm build`)

## Prompt triggers (manual or scripted)

- "Dreaming mode: scan all memories, merge duplicates, propose one new skill file"
- Hot topic mentioned 3+ times in episodic → promote to semantic

## Hardware fit

Compressed memories = shorter retrieval snippets = smaller working context = less KV cache bandwidth on decode (Memory Wall).
