# AGENTS.md

- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

---

## 施工队安全条例 — Production ship / multi-PR merge

Agent 不是聪明人。Agent 是会把 draft PR 当人生终点的实习生。  
下面每一步都有**红线**。每个 done 都要**验收凭证**。口头不算。

### 0. 最重要的一句（放最前面）

> **if you cannot prove it on production, do not claim it is fixed.**
>
> **不能在线上证明 就不准说修好了**

红线：没有 production evidence → 不准说 fixed / done / 修好了。

### 1. 检查 PR branch 与最新 main 的差异

按用户指定的 PR，对每个 branch：`git fetch` → 对照 `origin/main` 看 ahead/behind 与冲突面。

红线：不准猜「应该已经合过了」。要用命令/GitHub 状态说话。

### 2. 已有实现 → 只准 rebase / resolve / merge

如果同功能已经在某 branch / PR 里实现过：只允许 rebase、解决冲突、按序 merge。

红线：不准重新实现同功能（例如已有的 sound/home 交互修复）。不准开第二条平行实现路径。

### 3. 按用户指定顺序合入

多个 PR 必须按用户给出的顺序合并（先 A 后 B）。

红线：不准打乱顺序。不准「顺便一起合」。

### 4. 合并后确认 commit 已在 origin/main

每个 PR 合并后立即确认：

- PR state = `MERGED`
- merge commit SHA 存在
- `git merge-base --is-ancestor <merge_sha> origin/main` 为真

红线：GitHub 显示 merged 但 commit 不在 `origin/main` → **not done**，停下报告。

### 5. 等 Vercel Production deploy 完成

等 **Production**（不是 Preview）对应当前 `origin/main` tip SHA 的 deployment 变为 **success**。

红线：Preview Ready ≠ Production Ready。不准用 preview URL 冒充线上。

### 6. 只验证任务点名的 production URL

默认线上站：`https://www.aileena.xyz`（及任务写明的 path，如 `/`、`/sound`）。

红线：不准只跑 localhost 就宣称 ship done。localhost 可以当开发辅助，**不能**当验收终点。

### 7. 说 done 之前必须交齐凭证

| 凭证 | 要求 |
|------|------|
| `origin/main` tip SHA | 完整或可核对的 commit sha |
| 每个 PR | `MERGED` + merge commit sha |
| Vercel Production | deployment URL + 该 sha 的 success |
| 线上截图 | 打在真实 production URL 上 |
| 真实交互 | 至少一次（drag / click-through / scroll-snap 等，按任务） |

红线：缺任何一项 → 不准说 done。

### 硬性禁止

- 不准把 **draft PR** 当任务终点
- 不准只跑 **localhost** 就结束 ship/merge 任务
- 不准说「应该好了 / should be fixed / looks good」代替证据
- 不准在已有实现存在时 **重写同功能**
- 不准在没有 **production evidence** 前结束任务
- 如果不能 merge：必须停下并报告**具体 blocker**，不准绕路

### Done 定义

只有当：

1. 用户点名的 PR **都已 merged into `main`**，并且
2. **production 上能看到效果**，并且
3. 上面的 **凭证表交齐**

才算 **done**。  
否则就是 **not done**。

### 相关规则

- 工程循环：`.cursor/rules/senior-engineer-loop.mdc`
- UI 截图 + 交互：`.cursor/rules/ui-step-screenshot.mdc`
- 完整工作准册：`aileena-new/docs/工作准册.md`
