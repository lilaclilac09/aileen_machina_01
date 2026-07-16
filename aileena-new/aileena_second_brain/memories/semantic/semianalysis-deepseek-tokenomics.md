# SemiAnalysis × DeepSeek — tokenomics (post-$6M)

**Hub:** `semianalysis-memory-network.md`  
**Primary:** *DeepSeek Debrief: >128 Days Later* (Wei Zhou, AJ, Dylan Patel) — 2025-07-03  
https://newsletter.semianalysis.com/p/deepseek-debrief-128-days-later

Connects **training TCO** (Debates) to **serving economics**: cheap $/Mtok can mean **compute reserved for R&D**, not “training was free.”

---

## Headline serving prices (R1 era, Semi cite)

| Item | Value | Note |
|------|-------|------|
| DeepSeek R1 list (own API, then) | **`$0.55` input / `$2.19` output** per MTok class | undercut o1 by **~90%+** on output at launch narrative |
| Own-host context window | **`64K`** | among smallest of major providers in Semi’s chart |
| Strategy | High **batching** → higher user latency / lower interactivity → lower $/Mtok | keeps max compute **internal** for research |

## Tokenomics KPIs Semi uses

1. **Latency / TTFT** — time to first token  
2. **Interactivity** — tokens/sec/user (or TPOT)  
3. **Context window** — usable memory for coding / long docs  

Rule: **$/Mtok is an output** of KPI choices + hardware, not a pure “efficiency medal.”

## Link back to cost framework

- Export controls hurt **China-scale inference** more than **training a useful model** (Semi).
- Open-sourcing + third-party hosts (OpenRouter traffic **up ~20×**) lets DeepSeek win mindshare while **holding GPUs for AGI research**.
- Therefore: **low API price ≠ low CapEx** from Debates (`>$500M` GPU, `~$1.6B` server CapEx).

## Agent one-liner

When someone says “DeepSeek is cheap so training cost $6M”:  
separate **(a)** paper final-run `$5.576M`, **(b)** fleet TCO, **(c)** subsidized / batched inference pricing.
