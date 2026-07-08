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
