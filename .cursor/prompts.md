# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

# Cursor Prompt 快查

完整工程标准见：**[`aileena-new/docs/工作准册.md`](../aileena-new/docs/工作准册.md)**

- §1 核心循环
- §2 编码守则 + evidence 要求
- §3 验证命令清单
- §4 DJ Set 验收工作流
- §5 Prompt 模板（12 个）
- §6 最终确认模板

防乱改一句：`先不要写代码，先读相关文件并给我最小修改计划。`

UI merge 验收：截图 + 交互都要给看（中间微调别刷屏）— `.cursor/rules/ui-step-screenshot.mdc`。

Bugbot（审 PR / 交互回归，不当修车工）：`.cursor/BUGBOT.md` — DnD 优先查 event lifecycle；最小修复；PR 上 `bugbot run` 或 Cursor `/review-bugbot`。

CI 守卫用 cursor-agent（不是 Bugbot）：`.github/workflows/cursor-pr-review.yml` — 需 `CURSOR_API_KEY`；只读审 diff；禁止 auto-merge。
