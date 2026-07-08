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
