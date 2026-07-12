# Skill — deploy the Aileena memory stack

## Recommended architecture (final)

1. **Hard memory** — pinned Markdown in `aileena_second_brain/` (taste, music, culture). Dreaming must not delete.
2. **Working memory** — session messages (max 20 turns) + optional client `priorTopics`
3. **Soft memory (per visitor)** — Upstash Redis `visitor:soft:{id}`, 90-day sliding TTL (`lib/visitorMemory.ts`)
4. **Retrieval** — `searchMemories` TF-IDF over hard corpus; upgrade path: Mem0 vector or Cognee graph
5. **Dreaming** — weekly `pnpm dreaming` on Markdown; Redis GC = TTL expiry (no full-key scan in v0.5)
6. **Skills** — this directory (`procedural/skills/`)
7. **Weights** — LoRA on Qwen2.5-14B when `training_data/` is large enough

## Boot order

1. File tree + seed semantic memories (frameworks, taste, culture)
2. Wire `searchMemories` into `/api/chat`
3. Optional: set `UPSTASH_REDIS_REST_*` for per-visitor soft memory
4. Run dreaming weekly; promote episodic → semantic after review
5. First LoRA when curated training pairs > ~500

## Agent tool rule

For taste, music, culture, memory architecture, or "what does she like" — call `searchMemories` before answering. Do not invent preferences.
For "what did I ask before" — use the injected visitor soft-memory block only (never searchMemories for that).
