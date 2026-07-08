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
