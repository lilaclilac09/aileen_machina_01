# Cursor Prompt 快查

Agent 总则（**inspect → plan → patch → verify** + 施工队安全条例）见仓库根目录：**[`AGENTS.md`](../AGENTS.md)**

新 session 先说：`follow AGENTS.md and QA.md. do not say done without verification.`

- 产品事实（mood / orb / Visual / contact / doors）：[`PROJECT_RULES.md`](../PROJECT_RULES.md)
- QA 清单 + 命令：[`QA.md`](../QA.md)
- Cursor 必读索引：[`CURSOR_RULES.md`](../CURSOR_RULES.md)
- PR 验收表：[`.github/pull_request_template.md`](../.github/pull_request_template.md)

完整工程标准见：**[`aileena-new/docs/工作准册.md`](../aileena-new/docs/工作准册.md)**

- §1 核心循环（inspect → plan → patch → verify）
- §2 编码守则 + evidence Closer
- §3 验证命令清单
- §4 DJ Set 验收工作流
- §5 Prompt 模板（12 个）
- §6 最终确认模板

防乱改一句：`先不要写代码，先读相关文件并给我最小修改计划。`

大改锁：`first inspect and report root cause. then propose the smallest diff. wait for confirmation before editing if the change touches multiple systems.`

UI merge 验收：截图 + 交互都要给看（中间微调别刷屏）— `.cursor/rules/ui-step-screenshot.mdc`。

Production ship / 多 PR 合入：见 `AGENTS.md` 施工队安全条例 — **不能在线上证明就不准说修好了**。

AI auto-merge 护栏：`docs/AI_AUTOMERGE.md` · label `ai-automerge` → ci + playwright-dnd + cursor-agent → `gh pr merge --auto`（禁止 agent 强行合 main）。
