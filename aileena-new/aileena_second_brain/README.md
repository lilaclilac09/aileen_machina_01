# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

# Aileena Second Brain

Markdown is the source of truth. Agent prompts live in `prompts/`; durable memory in `memories/`.

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

Council (private, owner-only): `/council` after `OWNER_KEY` session. POST `{ "agentMode": "council" }`. Non-owners get 403 — not a silent fallback to the public site agent.

## Dreaming

```bash
pnpm dreaming
```

Review `memories/archived/consolidate-report-*.md`, merge into semantic/personal, then `pnpm build:memory-index`.

See `docs/MEMORY_ARCHITECTURE.md`.

## DJ set

Curated carousel: `/dj-set/` (static files in `public/dj-set/`).

Full two-deck player: `/sound` (`components/DJStation.tsx`).
