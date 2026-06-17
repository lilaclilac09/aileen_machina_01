# Aileen's tracked data — agent corpus

Drop your real data files in this directory. The build pipeline picks them up automatically and the chat agent gets a new set of tools to query them.

## File layout

```
data/
  skus.json                  hand-authored array of chip / accelerator / memory SKUs
  pricing.jsonl              one observation per line (append-only)
  news.jsonl                 one tracker per line (append-only)
  earnings/                  markdown files, YAML front-matter required
    2026-Q1-NVDA.md
    2026-Q1-AVGO.md
    ...
  research/                  markdown files, YAML front-matter required
    2026-06-MS-broadcom.md
    2026-06-GS-tsmc.md
    ...
```

`SAMPLE-*` files in `earnings/` and `research/` are placeholders showing the front-matter shape. Replace or delete once you have real content.

## Required schemas

### `skus.json` — array

```ts
{
  sku: "NVIDIA H100 SXM5 80GB",  // required
  vendor: "nvidia",              // required, see VendorEnum in lib/data/types.ts
  category: "gpu",               // required, see CategoryEnum
  family: "Hopper",              // optional
  released: "2022-09",           // optional, YYYY | YYYY-MM | YYYY-MM-DD
  process: "TSMC 4N",            // optional
  flopsBf16Tflops: 989,          // optional, all metrics are optional
  memType: "HBM3",
  memGB: 80,
  memBandwidthGBps: 3350,
  tdpW: 700,
  msrpUSD: 30000,
  priceRangeUSD: [25000, 40000],
  status: "shipping",
  notableCustomers: ["Microsoft", "Meta"],
  notes: "...",
  sources: ["https://..."],
}
```

### `pricing.jsonl` — one JSON object per line

```ts
{ "sku": "...", "date": "2026-01-15", "priceUSD": 27000, "unit": "per_chip", "region": "US", "source": "..." }
```

`unit` is one of `per_chip` (default) / `per_card` / `per_server` / `per_hour_cloud` / `per_month_cloud`.

### `news.jsonl` — one JSON object per line

```ts
{
  "id": "2026-09-nvidia-rubin-tape-out",   // stable id
  "date": "2026-09-15",
  "title": "...",
  "summary": "1-3 sentences — surfaced verbatim",
  "vendors": ["nvidia"],
  "skus": ["Rubin"],
  "topics": ["yield", "ramp"],
  "url": "https://...",
  "source": "...",
  "confidence": "public" | "analyst" | "rumour" | "leak"
}
```

### `earnings/*.md` and `research/*.md` — YAML front-matter + body

```markdown
---
id: 2026-Q1-NVDA-earnings
type: earnings
date: 2026-05-28
title: NVIDIA Q1 FY27 Earnings Call
source: NVIDIA Corporation
tickers: [NVDA]
topics: [datacenter, networking]
confidence: public
url: https://...
---

# Section heading

Body text. Multiple headings allowed. The build-time indexer chunks the
body into ~500-char passages broken at blank-line and heading boundaries.

# Q&A

Analyst — Question: ...

CFO — Answer: ...
```

The `type` field defaults to the directory (`earnings/*` → `earnings`, `research/*` → `research`) but you can override it in front-matter (e.g. for an analyst note that's actually a regulatory filing).

## Validation

All rows are validated by zod at module load. Bad rows are **dropped with a warning**, not raised — one malformed entry doesn't take the agent offline. Check the Vercel build log to see warnings like:

```
[data] data/skus.json: invalid entry at index 12 — flopsBf16Tflops: Number must be non-negative
```

## What the agent gets

Each dataset becomes 1-3 tools the chat agent can call:

| Dataset | Tools |
| --- | --- |
| skus.json | `queryChip(name)`, `listChips({vendor, category, family})`, `compareChips(a, b)` |
| pricing.jsonl | `latestPrice(sku, unit?)`, `priceHistory(sku, from?, to?, unit?)` |
| news.jsonl | `latestNews({vendor?, sinceDate?, limit?})`, `searchNews(query, k?)` |
| earnings/ + research/ | `searchEarnings(query, k?)`, `searchResearch(query, k?)`, `searchDocs(query, k?)` |

Plus the existing `searchArticles` over `/blog/**/*` content.

The LLM decides per turn which tools to call. `stopWhen: stepCountIs(4)` so it can chain a couple in one turn (e.g. `queryChip("H100") → priceHistory("H100")` for "how has the H100 price moved?").

## Build commands

```bash
pnpm build:data-index    # rebuilds JSONL → JSON + doc index
pnpm build:index         # rebuilds article index (older)
pnpm build               # runs both indexers, then next build
```

In Vercel, the standard `pnpm build` runs all indexers automatically.

## What's NOT in this layer

- No write API. The agent is read-only over this data — it can't add / edit rows.
- No live web fetching. If you want "latest news everywhere" instead of "your tracked news", that's a `webSearch` tool (separate add).
- No auth / rate limit per data type. Same quota cookie / lead gate applies as the rest of the chat.
