# Social / X ingest pipeline

## Why Grok can “read all Semi Twitter” and we cannot natively

| | Grok | This repo |
|--|------|-----------|
| X access | Built-in | **No** official X API key |
| Free path | Nitter RSS + FxTwitter | **auto cron** every 6h |
| Deep path | Grok JSON paste | manual |
| Paid path | AgentCash x402 timeline | needs USDC |

## Auto (free) — already scheduled

Full ops write-up: **`data/social/README.md`**

GitHub Actions: `.github/workflows/social-rss-sync.yml`

- Cron: `15 */6 * * *` UTC (+ `workflow_dispatch`)
- Runs `pnpm sync:social-rss` in `aileena-new/`
- Commits `tweets` / `profiles` / `last-rss-sync.json` / data index when changed

Coverage: ~**20 newest** posts per watchlist account (Nitter RSS). Not full history.

Must be on **default branch** for schedule to fire.

## Commands

```bash
# Manual free sync (same as CI)
pnpm sync:social-rss
pnpm sync:social-rss -- --dry-run
pnpm sync:social-rss -- --only aaronburnett,SemiAnalysis_

# Ingest one tweet + author profile
pnpm ingest:tweet -- 'https://x.com/aaronburnett/status/2077481532835660283'

# Upsert profile only
pnpm ingest:tweet -- --profile dylan522p

# Grok export JSON (deep backfill)
pnpm social:grok-prompt -- --org mach33
pnpm social:grok-prompt -- --org semianalysis
pnpm ingest:grok -- data/social/inbox/your-batch.json

# Bundle JSONL → JSON + research docs for agent
pnpm build:data-index
```

## Database files (append / upsert)

| File | Role |
|------|------|
| `data/tweets.jsonl` → `tweets.json` | Tweet rows |
| `data/profiles.jsonl` → `profiles.json` | Teacher / analyst profiles |
| `data/social/watchlist.json` | Accounts to track |
| `data/social/last-rss-sync.json` | Last CI/manual RSS report |
| `data/research/*.md` | Structured fact sheets (agent doc search) |

## Watchlist

- `@dylan522p` / `@SemiAnalysis_` — SemiAnalysis
- `@aaronburnett` / `@mach33` / `@VladSaigau` — mach33 / 33fg

## Agent tools

- `searchTweets` / `lookupSocialProfile` via `lib/data/social.ts`

## Modes

| Mode | What | Cost | Status |
|------|------|------|--------|
| **Nitter RSS cron** | ~20 newest / account, every 6h | Free | ✅ Actions |
| **Grok paste** | Deep + numbers | Free | ✅ manual |
| **Paid x402 timeline** | Deeper auto | USDC | ⏸ balance $0 |
| **Official X API** | Full | Paid | ❌ |

Note: Node `fetch` to nitter returns empty 200; sync script uses **curl**.
