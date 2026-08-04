# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

# Skill — deploy the Aileena memory stack

## Recommended architecture (final)

1. **Hard memory** — pinned Markdown in `aileena_second_brain/` (taste, music, culture). Dreaming must not delete.
2. **Working memory** — session messages (max 20 turns) + optional client `priorTopics`
3. **Soft memory (per visitor)** — Upstash Redis `visitor:soft:{id}`, 90-day sliding TTL (`lib/visitorMemory.ts`)
4. **Retrieval** — `searchMemories` TF-IDF over hard corpus; upgrade path: Mem0 vector or Cognee graph
5. **Dreaming** — weekly `pnpm dreaming` on Markdown; Redis GC = TTL expiry (no full-key scan in v0.5)
6. **Skills** — this directory (`procedural/skills/`)
7. **Weights** — LoRA on Qwen2.5-14B when `training_data/` is large enough

## Tools hub

Public tools at `/tools`. To add one: skill **`procedural/skills/tools-arcade-mini-game.md`** + doc **`aileena-new/docs/TOOLS_ARCADE.md`**. Registry: `lib/tools/registry.ts`.

## Boot order

1. File tree + seed semantic memories (frameworks, taste, culture)
2. Wire `searchMemories` into `/api/chat`
3. Optional: set `UPSTASH_REDIS_REST_*` for per-visitor soft memory
4. Run dreaming weekly; promote episodic → semantic after review
5. First LoRA when curated training pairs > ~500

## Agent tool rule

For taste, music, culture, memory architecture, or "what does she like" — call `searchMemories` before answering. Do not invent preferences.
For "what did I ask before" — use the injected visitor soft-memory block only (never searchMemories for that).
