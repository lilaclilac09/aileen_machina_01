---
id: social-auto-sync
type: ops
date: 2026-07-17
title: Free automatic social (X) sync — Nitter RSS cron
---

# Free automatic social sync

**Goal:** keep SemiAnalysis + mach33 tweets fresh without paid X API / AgentCash.

## What runs automatically

| Item | Value |
|------|--------|
| Workflow | `.github/workflows/social-rss-sync.yml` |
| Schedule | every **6 hours** — cron `15 */6 * * *` UTC (≈ 02:15 / 08:15 / 14:15 / 20:15 CST) |
| Manual | GitHub Actions → *Social RSS Sync (free)* → Run workflow |
| Cost | **Free** (Nitter RSS + FxTwitter) |
| Depth | ~**20 newest** posts per watchlist account (not full history) |

### Pipeline

```
watchlist.json
  → curl Nitter RSS (https://nitter.net/{user}/rss)
  → missing status ids
  → FxTwitter enrich (pnpm ingest:tweet)
  → tweets.jsonl / profiles.jsonl
  → pnpm build:data-index
  → git commit + push (if changed)
```

**Note:** Node `fetch` to nitter returns HTTP 200 with **empty body**; sync uses **curl**.

## Watchlist accounts

| Handle | Org |
|--------|-----|
| `@dylan522p` | SemiAnalysis |
| `@SemiAnalysis_` | SemiAnalysis |
| `@aaronburnett` | mach33 / 33fg |
| `@mach33` | mach33 / 33fg |
| `@VladSaigau` | mach33 / 33fg |

Edit: `aileena-new/data/social/watchlist.json`

## Local commands

```bash
cd aileena-new

# Same job as CI
pnpm sync:social-rss
pnpm sync:social-rss -- --dry-run
pnpm sync:social-rss -- --only aaronburnett,SemiAnalysis_

# Deep backfill (manual Grok — not in cron)
pnpm social:grok-prompt -- --org mach33
pnpm social:grok-prompt -- --org semianalysis
# paste prompt → Grok → save JSON →
pnpm ingest:grok -- data/social/inbox/<batch>.json
```

## Artifacts

| Path | Role |
|------|------|
| `data/tweets.jsonl` → `tweets.json` | Tweet DB |
| `data/profiles.jsonl` → `profiles.json` | Profiles |
| `data/social/numbers.jsonl` | Quoted metrics |
| `data/social/last-rss-sync.json` | Last sync report |
| `data/social/prompts/grok-*.txt` | Generated Grok skip-id prompts |
| `data/social/inbox/*.json` | Grok export batches |
| `docs/SOCIAL_INGEST.md` | Full pipeline doc |

## First successful free backfill (2026-07-17)

| Metric | Value |
|--------|-------|
| Missing from RSS | **55** |
| Ingested | **55** |
| Tweets after | **112** |
| Report | `data/social/last-rss-sync.json` |

Example new fact: Elon AI1 sat power **~250 kW peak / ~160 kW avg** (`2077626509615829213`).

## Limits

- Cron only covers **recent** RSS window (~20 / account).
- Deep history + structured **numbers** → Grok paste.
- Paid full timeline → AgentCash USDC (not enabled; balance was $0).

## Enable cron on GitHub

1. Merge/push this workflow to the **default branch** (`main`).
2. Confirm Actions enabled for the repo.
3. Optional: run once via *workflow_dispatch* to verify commit bot can push.
