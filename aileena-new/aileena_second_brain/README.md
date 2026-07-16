# Aileena Second Brain

Markdown is the source of truth. Agent prompts live in `prompts/`; durable memory in `memories/`; unpublished article drafts in `drafts/` (not indexed into agent retrieval until promoted).

## Tiers

| Tier | Store | Role |
|------|-------|------|
| L1 | Chat session | Hot context |
| L2 | Index cache | Fast retrieve |
| L3 | `memories/**` | Cold storage |
| L4 | `persona-auto.md` (optional) | O-Mem persona extraction |

## TypeScript

- `lib/aileenaSecondBrain.ts` — Machina persona prompts
- `lib/memorySearch.ts` — L2 TF-IDF retrieval (build-time index)
- `lib/memoryStack.ts` — injected into `/api/chat` system prompt

## Agent

Site agent (`lib/agentContext.ts`) stays third-person. Memory tool `searchMemories` answers taste/culture/framework questions from this tree.

Machina mode: POST `/api/chat` with `{ "agentMode": "machina" }`.

## Dreaming

```bash
pnpm dreaming
```

Review `memories/archived/consolidate-report-*.md`, merge into semantic/personal, then `pnpm build:memory-index`.

See `docs/MEMORY_ARCHITECTURE.md`.

## DJ set

Curated carousel: `/dj-set/` (static files in `public/dj-set/`).

Full two-deck player: `/sound` (`components/DJStation.tsx`).
