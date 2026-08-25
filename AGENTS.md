# AGENTS.md

You are working on **aileena.xyz**.

> Agent 聪明不是让它想更多，是让它少犯不可逆的蠢。
> A stronger API only gives “talks smart.” Responsible smart comes from rules, tools, verification, memory, boundaries, and failure review.

## Core rule

Do not redesign, refactor, or create parallel systems unless explicitly asked.

## Verification is mandatory

> **never mark a task complete based only on code inspection.**

Do not say done unless you verified the change. Reading the diff is not verification.

For every task, the final response must include:

- files changed
- root cause or reason for change
- checks run
- manual QA performed
- remaining risks
- whether it is safe to merge

If you cannot run a check, say so clearly. Do not claim verified if you did not observe it.

Minimum verification:

- run lint / type / build when relevant (`cd aileena-new`, `pnpm` — not repo-root npm)
- inspect the affected UI route
- test the specific user flow that changed
- for env / config issues, list manual production steps
- UI changes: screenshots + interaction (`.cursor/rules/ui-step-screenshot.mdc`)

Checklist: [`QA.md`](QA.md). PR merge form: [`.github/pull_request_template.md`](.github/pull_request_template.md). Cursor index: [`CURSOR_RULES.md`](CURSOR_RULES.md).

## Workflow (mandatory)

```txt
inspect → plan → patch → verify
```

Do not jump to patch.

1. **inspect** — read the existing implementation; do not guess structure.
2. **plan** — name the root cause and the smallest safe diff.
3. **patch** — one vertical slice. No extra systems, no drive-by refactors.
4. **verify** — runnable evidence. No evidence → not done.

Prompt lock:

```txt
first inspect and report root cause. then propose the smallest diff.
wait for confirmation before editing if the change touches multiple systems.
```

- Small, single-file / single-component bugs: inspect → patch → verify (no wait).
- Multi-system or visual-direction changes: inspect → plan, **wait for confirmation**, then patch.
- Split large asks (“fix orb”) into one slice per turn (transcript / TTS full sentence / TTS pace / recognition / proportions). Fewer variables in flight = fewer irreversible mistakes.

### Before editing

- inspect existing implementation first
- identify root cause
- propose smallest safe diff
- do not redesign unless explicitly asked
- do not create parallel systems
- do not delete working flows
- do not say done without verification

### For bugs

- reproduce or inspect the failing path
- trace data flow end to end
- list ≥2 hypotheses; verify with commands/logs **before** editing
- fix the confirmed root cause only — one vertical slice first
- report exact files changed
- report root cause
- report how to test

### For UI

- preserve current visual direction
- do not change typography / layout / colors unless requested
- fix proportions / readability / function only
- UI merge: screenshots + interaction (`.cursor/rules/ui-step-screenshot.mdc`)
- **landing experiment** (`/` · `LandingStudio`): do not stop at “done”. Follow `.cursor/rules/landing-experiment-gate.mdc`. Runtime proof + named screenshots + door clicks **before** any PR/merge recommendation.

```txt
no screenshots = no merge recommendation.
```

### For deploy

- check build / lint / type / deploy preview
- check env / config separately from code
- if Bugbot fails due to usage limit, do not treat as a code failure

## Never

- say “done” without verification
- recommend merge on the landing experiment without real screenshots
- mark a task complete based only on code inspection
- change visual direction casually
- replace working flows with new systems
- hide env/config issues as code issues
- crop Visual page content images
- expose scary backend errors in public UI
- treat Bugbot usage-limit as a real code failure
- treat full-repo `pnpm lint` red on `main` (~180 existing errors) as *your* regression unless you touched those files
- use localhost as production proof (see 施工队安全条例)

## Always preserve

Product facts live in [`PROJECT_RULES.md`](PROJECT_RULES.md). Short form:

- soft, strange, technical, personal mood
- thin typography
- cream / teal visual language
- doors as the directory structure
- contact transcript delivery via Resend
- orb as compact tactile control (not hero-sized, not tiny)
- full image visibility on Visual (`object-fit: contain`, no cover-crop)

## Evidence (required closer — no mood, no “should work”)

Every task ends with:

```txt
root cause:
files changed:
checks run:
manual QA:
verification:
remaining risks:
manual steps:
safe to merge:
```

`safe to merge:` is one of `yes` / `no` / `yes after manual env/config step`.

Env / Resend / deploy examples of `manual steps:` (do not bury these in prose):

```txt
manual steps:
- add RESEND_API_KEY to production env
- add CONTACT_TO (real inbox — not cafe@aileena.xyz)
- redeploy
```

QA checklist: [`QA.md`](QA.md).

## Self-improvement (immune system, not a brain)

Failures become lessons. Repeated lessons may be **proposed** — never silently written into hard rules.

- Record: [`ops/lessons/`](ops/lessons/README.md) (copy `TEMPLATE.md`)
- Propose: [`ops/improvement-queue.md`](ops/improvement-queue.md) — **owner approval** before touching `AGENTS.md` / `QA.md` / `PROJECT_RULES.md`
- After a PR: [`ops/post-pr-review.md`](ops/post-pr-review.md)
- Do not autonomously refactor the site because a lesson exists

Golden paths: `cd aileena-new && pnpm qa:mobile` · `pnpm qa:agent` · `pnpm qa:contact` · `pnpm qa:sound` · `pnpm audit:runtime` · `pnpm report:merge`

## Blocker table (when stuck — stop, do not invent a bypass)

| field | meaning |
|-------|---------|
| `blocked_on` | what is missing (secret / permission / red check / SHA mismatch) |
| `evidence` | command or API output, not “should” |
| `impact` | `blocked` (stop) or `degraded` (continue only with the limitation written down) |
| `human_action` | the one step only a human can do |
| `not_doing` | the bypass you refuse (no second implementation, no localhost-as-prod, no force-merge) |

Missing `PROFILE_README_TOKEN` is **degraded** (update the draft, tell the user to paste). Missing merge permission on a ship task is **blocked**.

---

## Architecture (keep the product working; do not grow a second one)

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

### Fail-closed blockers（不能解就停）

权限 / 设置 / 缺 secret / 用量上限 / API 403 等：**不准绕路**，不准改写成「差不多好了」。用同一张表：

| Blocker | 证据（命令或原文） | 谁能解 | 不解则任务状态 |
|---------|-------------------|--------|----------------|
| e.g. `allow_auto_merge=false` | `gh api repos/... --jq .allow_auto_merge` → `false` | repo admin | **not done** |
| e.g. Bugbot usage limit | PR 评论原文 | Cursor billing / admin | **not done**（该项） |
| e.g. secrets/labels API 403 | HTTP status + message | repo admin | **not done** |

红线：散文式「好像没权限」不算；没有证据行不算。

### Debug / 推理（bug 与「不对」）

Always-on：[`.cursor/rules/debug-repro-loop.mdc`](.cursor/rules/debug-repro-loop.mdc)

顺序：**Repro → Hypotheses (1–3) → Evidence → Root cause → Fix (minimal) → Why safe**。  
无复现与根因 → **不准开修**。

### Done 定义

只有当：

1. 用户点名的 PR **都已 merged into `main`**，并且
2. **production 上能看到效果**，并且
3. 上面的 **凭证表交齐**

才算 **done**。
否则就是 **not done**。

### 相关规则

- 产品事实：[`PROJECT_RULES.md`](PROJECT_RULES.md)
- QA 清单：[`QA.md`](QA.md)
- Cursor 必读索引：[`CURSOR_RULES.md`](CURSOR_RULES.md)
- PR 验收表：[`.github/pull_request_template.md`](.github/pull_request_template.md)
- 工程循环：`.cursor/rules/senior-engineer-loop.mdc`
- Debug 推理环：`.cursor/rules/debug-repro-loop.mdc`
- 任务→工具：[`docs/AGENT_TOOL_MAP.md`](docs/AGENT_TOOL_MAP.md)
- 已验证坑：[`docs/KNOWN_FAILURES.md`](docs/KNOWN_FAILURES.md)
- 失败课 / 规则提案（须 owner 批准）：[`ops/lessons/README.md`](ops/lessons/README.md) · [`ops/improvement-queue.md`](ops/improvement-queue.md)
- UI 截图 + 交互：`.cursor/rules/ui-step-screenshot.mdc`
- Landing experiment 验收 + 截图 + merge gate：`.cursor/rules/landing-experiment-gate.mdc`（**no screenshots = no merge recommendation**）
- 完整工作准册：`aileena-new/docs/工作准册.md`
- AI auto-merge：`docs/AI_AUTOMERGE.md`
