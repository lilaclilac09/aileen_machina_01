# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

每轮对话 → episodic 写入 → 热话题 3 次 promote → consolidate 升格
学习句：「她也喜欢 X」「记住：…」「update memory: …」

## 自进化（已接线）

Carousel 在 **/sound#dj-set**（`lib/djSetlist.ts` 五首 handoff 曲目），不单独开页。

`pnpm sync:content-memory` / `pnpm build` 会扫描歌曲、podcast、纪录片、文章写入 `latest-content.md`。
`pnpm sync:carousel-evolve` 仅把 curated set 同步进 `setlist.md` / `music-taste.md`。

O-Mem L4（第二推荐，可选）：
- 轻量：LLM 从对话抽 persona → 写 persona-auto.md
- 完整：OPPO O-Mem memory_chain + embedding
- Markdown 仍是真相源，O-Mem 只做对话→persona 回写
