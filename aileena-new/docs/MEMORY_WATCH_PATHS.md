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
