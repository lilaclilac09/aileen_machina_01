# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

# Memory watch paths — fixed (canonical)

这些是 **固定 path**：merge 到 `main` 且改动落在下列路径时，
GitHub Action **Memory on Article (fixed paths)**
(`.github/workflows/memory-on-article.yml`) 自动跑：

`pnpm sync:content-memory` → `pnpm dreaming` → `pnpm build:memory-index` → commit L3

## Fixed paths

```
aileena-new/app/blog/**
aileena-new/app/updates/**
aileena-new/lib/research/**
aileena-new/lib/djSetlist.ts
aileena-new/public/dj-set/setlist.json
aileena-new/components/DJStation.tsx
```

| Path | Why |
|------|-----|
| `app/blog/**` | 新文章 / 改标题日期 |
| `app/updates/**` | Metal & Pages 书架 |
| `lib/research/**` | Research magazine |
| `lib/djSetlist.ts` / `public/dj-set/setlist.json` / `DJStation.tsx` | 曲库 / setlist |

## Related

| File | Role |
|------|------|
| `.github/workflows/memory-on-article.yml` | **固定 path 触发** |
| `.github/workflows/machina-memory.yml` | 周一 cron + 手动 Dreaming |
| `.github/workflows/machina-memory-job.yml` | 共用 job（reusable） |
| `pnpm memory:on-article` | 本地同一套 |

改 watch 列表时：同时改本文件 + `memory-on-article.yml` 的 `on.push.paths`。
