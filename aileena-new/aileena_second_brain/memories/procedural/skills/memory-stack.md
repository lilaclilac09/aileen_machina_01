# Skill — deploy the Aileena memory stack

## Recommended architecture (final)

1. **Working memory** — session messages (max 20 turns server-side) + optional `priorTopics` from client localStorage
2. **Long-term** — ReMeLight-style Markdown in `aileena_second_brain/memories/`
3. **Retrieval** — `searchMemories` tool (TF-IDF over build index); upgrade path: Mem0 vector or Cognee graph
4. **Dreaming** — weekly `pnpm dreaming` + human review
5. **Skills** — this directory (`procedural/skills/`)
6. **Weights** — LoRA on Qwen2.5-14B when `training_data/` is large enough

## Boot order

1. File tree + seed semantic memories (frameworks, taste, culture)
2. Wire `searchMemories` into `/api/chat`
3. Run dreaming weekly; promote episodic → semantic after review
4. First LoRA when curated training pairs > ~500

## Agent tool rule

For taste, music, culture, memory architecture, or "what does she like" — call `searchMemories` before answering. Do not invent preferences.
