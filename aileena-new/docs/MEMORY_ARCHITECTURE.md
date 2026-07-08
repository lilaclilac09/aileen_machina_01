# Memory architecture — Aileena Machina

ReMeLight-style: **Markdown in git = L3 truth**. Build index = **L2**. Chat session = **L1**.

## Stack

| Layer | Implementation | GitHub inspiration |
|-------|----------------|-------------------|
| Working | Last 20 turns + optional `priorTopics` | ReMeLight hooks |
| Retrieval | `searchMemories` TF-IDF (`lib/memorySearch.ts`) | Mem0 / Cognee upgrade path |
| Cold store | `aileena_second_brain/memories/**` | [ReMe](https://github.com/agentscope-ai/ReMe) |
| Dreaming | `pnpm dreaming` weekly | Offline consolidate |
| Persona L4 | `persona-auto.md` (optional) | [O-Mem](https://github.com/OPO-PersonalAI/O-Mem) |
| Weights | LoRA on Qwen2.5-14B when ready | — |

## Commands

```bash
pnpm build:memory-index   # scan memories → lib/memoryIndex.json
pnpm dreaming             # offline report → memories/archived/consolidate-report-*.md
pnpm build                # includes memory index on every deploy
```

## Agent wiring

- `/api/chat` injects `MEMORY_STACK_PROMPT` + L2 prefetch from last user message
- Tool: `searchMemories(query, k)`
- Optional body: `{ "agentMode": "machina" }` → first-person Machina prompt (`buildMachinaSystemPrompt`)

## Hardware (Memory Wall)

External files + retrieval + Dreaming compression → shorter prompts → less KV cache traffic on decode. See `memories/semantic/hardware-memory-wall.md`.

## Framework map

Full GitHub list: `memories/semantic/memory-frameworks.md`.
