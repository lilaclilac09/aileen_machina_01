# KNOWN_FAILURES.md

**已验证** 坑位。Agent 开场涉及 CI / cover / ship / lint 时先读本页。  
只追加有证据的条目；聊天回忆不算。

格式：`[日期] 现象 → 正确做法`

---

## CI / build / artifact

- [2026-08-11] 全仓 `pnpm lint` 在 `main` 上约 ~180 errors → **不要**用全仓 lint 作 automerge gate；只 eslint **本 PR 触及文件**（见 `QA.md`）
- [2026-08-11] CI 里裸跑 `next build` 缺 index JSON（`agentArticleIndex` / `dataDocIndex` / `memoryIndex`）→ 用 **`pnpm build`**
- [2026-08-11] `actions/upload-artifact@v4` 默认跳过点目录 → 上传 `aileena-new/.next` 必须 **`include-hidden-files: true`**，否则 playwright 下不到 artifact

## GitHub / automerge / Bugbot

- [2026-08-11] `allow_auto_merge=false`；rulesets=`[]` → `gh pr merge --auto` **不会**真正护栏合 main；记 blocker，不假装生效（`docs/AI_AUTOMERGE.md`）
- [2026-08-11] bot 对 secrets / labels / branch protection 常 **403** → 建 `ai-automerge` label、加 `CURSOR_API_KEY` 需 **repo admin**
- [2026-08-11] Bugbot「usage limit reached」→ **不是**代码失败；写 `manual steps` / blocker 表，不要为了「变绿」乱改产品

## Covers / Spotify

- [2026-08-11] Spotify **oEmbed 缩略图可能错图**（曾误伤 GALA / WISE）→ 与 **song.link Spotify `thumbnailUrl`** 交叉验证；冲突以 Spotify canonical 为准再 vendor
- [2026-08-11] 远程 `spotifycdn` / 根路径 `/berlin.jpg` 易脆 → 封面 vendor 到 `aileena-new/public/dj-set/assets/covers/`
- allowlist 挡 `open.spotify.com` / `api.song.link` → 用 placeholder thumb；**不要**发明爬虫（`QA.md` Not code failures）

## Ship / Vercel

- Preview Ready ≠ Production Ready（`AGENTS.md`）
- [2026-08-11] tip SHA 上 Vercel 状态偶发 Dashboard **Canceled**，但静态资源/JS 可能已在 CDN → 以 **prod URL 探针 + JS chunk 内容** 为准，不能只看一个红点；仍应尽量等 Production **success**

## Product / scope（勿重开）

- 不准平行重写已有 DJ drag / drag-me 实现（`AGENTS.md`）
- Visual `#glass-bench` **不在** `/sound`（`QA.md` DJ）

---

## 如何追加

1. 必须有命令输出、PR、或 prod 探针作证据  
2. 一行一条；写「正确做法」，不写长故事  
3. 过时条目可划掉并注明替代日期  
