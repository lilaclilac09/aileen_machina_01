# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

# Memory frameworks — GitHub map

Markdown files in `aileena_second_brain/memories/**` are the source of truth (ReMeLight pattern).

## Tier 1 — use first

| Framework | GitHub | Fit |
|-----------|--------|-----|
| **ReMe / ReMeLight** | https://github.com/agentscope-ai/ReMe | File Markdown + hook compression — primary pattern for this site |
| **O-Mem** | https://github.com/OPO-PersonalAI/O-Mem | Self-evolving persona; L4 optional layer |
| **Mem0** | https://github.com/mem0ai/mem0 | Production retrieval + vector store if we outgrow BM25 |
| **Cognee** | https://github.com/VectorisedAI/cognee | Graph memory for multi-hop reasoning |

## Tier 2 — evaluate later

- LangMem — https://github.com/langchain-ai/langmem
- Graphiti (Zep) — https://github.com/getzep/graphiti
- Memary — https://github.com/kingjulio8238/Memary
- LightMem — https://github.com/zjunlp/LightMem
- OpenMemory — https://github.com/CaviraOS/OpenMemory
- MemMachine — https://github.com/MemMachine/MemMachine
- Memori — https://github.com/GibsonAI/Memori
- Memvid — https://github.com/memvid (multimodal)

## Papers

- Memanto — arXiv 2604.22085 / moorcheh-ai/memanto
- ReMe — arXiv "Remember Me, Refine Me"
