每轮对话 → episodic 写入 → 热话题 3 次 promote → consolidate 升格
学习句：「她也喜欢 X」「记住：…」「update memory: …」

## 自进化（已接线）

`pnpm sync:carousel-evolve`（build / memory:workflow 自动跑）：

1. 扫描 `DJStation.tsx` 尾部新增 Spotify 曲目
2. 写入 `public/dj-set/setlist.json` + 封面 SVG → **carousel 可见**
3. 更新 L3：`setlist.md`、`prompts/music-taste.md`、`self-evolution-log.md`
4. 新曲目 → `memories/episodic/evolve-carousel-*.md`

O-Mem L4（第二推荐，可选）：
- 轻量：LLM 从对话抽 persona → 写 persona-auto.md
- 完整：OPPO O-Mem memory_chain + embedding
- Markdown 仍是真相源，O-Mem 只做对话→persona 回写
