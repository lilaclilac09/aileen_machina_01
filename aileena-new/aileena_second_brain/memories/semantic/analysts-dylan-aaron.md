# Teachers / analysts — social dossier (hard memory)

Agent: when asked “谁是 Dylan / Aaron / Semi 老师”, use this + `lookupSocialProfile` / `searchTweets`.

## Dylan Patel — SemiAnalysis

| Field | Value |
|-------|-------|
| Handle | `@dylan522p` |
| Role | Founder, CEO, Chief Analyst — **SemiAnalysis** |
| Site | https://www.semianalysis.com |
| X bio | Boutique AI Infrastructure Research and Consulting |
| Followers (ingested) | ~151k |
| Lab | **STEEL** (Hillsboro OR) — teardown CapEx **$10s of millions** |
| Notable public thesis | Logic / memory / power bottlenecks; ASML EUV hard ceiling ~2028–29; H100 residual value; DeepSeek TCO vs paper $5.576M |

**Ingested tweet sample:** `2019490550911766763` — Claude Code inflection → https://newsletter.semianalysis.com/p/claude-code-is-the-inflection-point

**Research sheets:** `data/research/2026-03-dylan-patel-dwarkesh-bottlenecks.md`, `data/research/2026-steel-lab-semianalysis.md`, `memories/semantic/semianalysis-*`

## Aaron Burnett — mach33 / 33fg

| Field | Value |
|-------|-------|
| Handle | `@aaronburnett` |
| Role | Founder, CEO **@mach33** |
| Location | Merritt Island, FL |
| Site | https://www.33fg.com / research.33fg.com |
| Focus | Expansion tech / orbital compute investment research |
| Followers (ingested) | ~25.6k |

**Ingested note:** `2077481532835660283` — *Orbital Inference Containment Tax*  
→ https://research.33fg.com/analysis/the-orbital-inference-containment-tax  
**Not SemiAnalysis.**

**Research sheet:** `data/research/2026-07-orbital-inference-containment-tax.md`

## How to dig more

```bash
# Free auto (also CI every 6h): Nitter RSS → FxTwitter
pnpm sync:social-rss
pnpm build:data-index

# Deep backfill via Grok (skip already-ingested ids)
pnpm social:grok-prompt -- --org mach33
pnpm social:grok-prompt -- --org semianalysis
pnpm ingest:grok -- data/social/inbox/<batch>.json

# One-off URL queue
# Add URLs to data/social/ingest-queue.txt then:
pnpm ingest:tweet:batch
```

**Ops doc:** `data/social/README.md` · **CI:** `.github/workflows/social-rss-sync.yml`  
FxTwitter = per-status; Nitter RSS ≈ 20 newest / account. AgentCash timeline needs funded wallet.

## Dig log (2026-07-16)

| Source | Result |
|--------|--------|
| FxTwitter status | Aaron containment tax + Dylan Claude Code tweet **in DB** |
| Profiles | `@dylan522p` + `@aaronburnett` upserted |
| Dwarkesh podcast | Bottleneck numbers → `data/research/2026-03-dylan-patel-dwarkesh-bottlenecks.md` |
| STEEL lab | Public CapEx / SMIC pitch facts → `data/research/2026-steel-lab-semianalysis.md` |
| Corning screenshots | Already in `data/research/2026-06-corning-glass-bridge-cpo.md` |
| pbs.twimg chart images | **timeout** from this host |
| 33fg full analysis page | gated / marketing shell |
| api.twitter.com guest | **unreachable** |
| AgentCash | balance **$0** |

## Dig log (2026-07-17) — Grok export + free RSS auto

| Source | Result |
|--------|--------|
| Grok JSON | `data/social/inbox/grok-semi-*.json` + `grok-mach33-*.json` |
| Free RSS sync | **55** new tweets → DB total **112**; `pnpm sync:social-rss` |
| Cron | `.github/workflows/social-rss-sync.yml` every **6h** (free) |
| Ops MD | `data/social/README.md` |
| Ledgers | `data/research/2026-07-grok-semi-twitter-numbers.md`, `2026-07-grok-mach33-twitter-numbers.md` |
| Command | `pnpm ingest:grok` · `pnpm sync:social-rss` · `pnpm social:grok-prompt` |
