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
pnpm sync:content-memory  # scan songs/podcasts/docs/articles → latest-content.md
pnpm build:memory-index   # scan memories → lib/memoryIndex.json
pnpm dreaming             # offline report → memories/archived/consolidate-report-*.md
pnpm memory:workflow      # sync + dreaming + index rebuild (local one-shot)
pnpm build                # includes memory index on every deploy
```

## Fixed workflow (GitHub Actions)

`.github/workflows/machina-memory.yml` runs the same pipeline on a schedule:

| Trigger | When |
|---------|------|
| `schedule` | Mondays 06:00 UTC |
| `workflow_dispatch` | Manual — optional `skip_commit: true` to dry-run |

Steps: **`sync:content-memory`** → `pnpm dreaming` → `pnpm build:memory-index` → commit `latest-content.md`, `content-changelog-*.md`, and Dreaming reports to `main`.

### What content sync detects

| Source | Detects |
|--------|---------|
| `public/dj-set/setlist.json` | Curated DJ set tracks |
| `components/DJStation.tsx` | Newest player deck additions |
| `app/blog/watch-listening-shelf/page.tsx` | Podcasts, documentaries, channels |
| `app/blog/*/page.tsx` | Latest articles (by `date` prop) |

On change → writes `memories/episodic/content-changelog-YYYY-MM-DD.md` for Dreaming review.

### Carousel self-evolution (new songs)

`pnpm sync:carousel-evolve` (first step of `sync:content-memory`):

1. Scans **tail of `DJStation.tsx`** for tracks not yet in `setlist.json`
2. Appends to `/dj-set/` carousel + generates cover SVGs
3. Updates `setlist.md`, `prompts/music-taste.md`, `self-evolution-log.md`
4. Writes `memories/episodic/evolve-carousel-*.md`

`lib/memoryIndex.json` stays gitignored; Vercel rebuilds L2 on every deploy via `pnpm build`.

## Agent wiring

- `/api/chat` injects `MEMORY_STACK_PROMPT` + L2 prefetch from last user message
- Tool: `searchMemories(query, k)`
- Optional body: `{ "agentMode": "machina" }` → first-person Machina prompt (`buildMachinaSystemPrompt`)

## Hardware (Memory Wall)

External files + retrieval + Dreaming compression → shorter prompts → less KV cache traffic on decode. See `memories/semantic/hardware-memory-wall.md`.

## Framework map

Full GitHub list: `memories/semantic/memory-frameworks.md`.
