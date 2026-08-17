# AGENT_TOOL_MAP.md

任务 → 必用工具 / 命令。**禁止把右列当终点。**

开场仍先读：`AGENTS.md` · `QA.md` · 本页 · [`KNOWN_FAILURES.md`](KNOWN_FAILURES.md)

App 在 `aileena-new/`（`pnpm`）。

## 地图

| 任务类型 | 必用 | 禁止当终点 |
|----------|------|------------|
| 任意改动 | 触及文件的 scoped lint / 相关 `QA.md` 行；收尾 Evidence closer | 「看过代码了」 |
| Bug / 「不对」 | `.cursor/rules/debug-repro-loop.mdc` 全块 | 无证据开修 |
| UI / 交互 | 390×844 截图 + **命名**交互（`.cursor/rules/ui-step-screenshot.mdc`） | 只说 done / 只有 still |
| `/sound` · DJ · carousel | `pnpm verify:sound`；ship 时 prod `https://www.aileena.xyz/sound` | 仅 localhost |
| DnD → Deck A | `pnpm test:e2e:dnd`（改了 drag/drop 时） | 「应该能拖」 |
| Doors / back 链 | `pnpm verify:doors-nav` | 只改文案不测路由 |
| Cover / 加歌 | Spotify oEmbed **+** song.link；冲突用 Spotify canonical thumb；vendor 到 `public/dj-set/assets/covers/` | 盲信单一 CDN / oEmbed |
| Ship / multi-PR | `AGENTS.md` 凭证表（main tip · MERGED · Vercel **Production** · prod 截图+交互） | draft · Preview · localhost |
| CI / automerge / Bugbot | 证明 check 跑过 **或** fail-closed blocker 表 | 「yml 存在」= 生效 |
| Contact / Resend | `pnpm lead:test` 或真实投递证据；缺 env → `manual steps` | 新写一套 mailer |
| Docs-only | diff 自查 + 链接可点 | 假装改了产品行为 |
| 失败复盘 | `ops/lessons/TEMPLATE.md` + 必要时 `pnpm report:merge -- --blocked "…"` | 直接改 `AGENTS.md` |
| 布局 / mobile | `pnpm qa:mobile`（390×844 + scrollWidth） | 「overflow hidden 就好了」 |
| Visual 裁切 | `pnpm verify:visual` | 给内容图加 `object-cover` |
| Contact / 文案 | `pnpm qa:contact` | 新写一套 mailer |

## 优先工具（收紧，不扩张）

| 工具 | 用来 |
|------|------|
| Read / Grep / Glob | 定位，不猜 |
| Shell | `pnpm …` · `curl` · `gh` · git |
| computerUse | UI 交互验收；ship 时必须 **production** URL |
| `gh` + commit status | PR / Vercel Production state |
| WebFetch / oEmbed / song.link | 封面与曲目元数据 |

**暂不**：新 agent 框架、通用「超级 SDK」、绕过 `AGENTS.md` 的 YOLO merge。

## 编排速查

何时拆子任务 / 停手：见 [`.cursor/prompts.md`](../.cursor/prompts.md) **编排决策表**，或准册对应节。

## 相关

- [`QA.md`](../QA.md) — 命令与切片清单  
- [`KNOWN_FAILURES.md`](KNOWN_FAILURES.md) — 已验证坑  
- [`AI_AUTOMERGE.md`](AI_AUTOMERGE.md) — CI 护栏 + 人工设置  
- [`AGENTS.md`](../AGENTS.md) — ship 红线 + blocker 表  
