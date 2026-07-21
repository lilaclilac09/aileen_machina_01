---
id: 2026-07-orbital-inference-containment-tax
type: research
date: 2026-07-15
title: Orbital Inference Containment Tax — Aaron Burnett / mach33 (from X note)
source: Aaron Burnett (@aaronburnett) X note + research.33fg.com
topics: [orbital-compute, inference, moe, gpu, spacex, containment-tax, mach33]
confidence: public
url: https://research.33fg.com/analysis/the-orbital-inference-containment-tax
---

# Source

- Tweet: https://x.com/aaronburnett/status/2077481532835660283
- Author: **Aaron Burnett** — Founder/CEO @mach33 · Merritt Island, FL · https://www.33fg.com/
- Analysis: https://research.33fg.com/analysis/the-orbital-inference-containment-tax

**Not SemiAnalysis.** This is mach33 / 33fg orbital-compute research.

# Core claim

Orbital data centers face an **inference network coherence** constraint. A self-contained sat cannot spread MoE experts as widely as terrestrial GPU pools → **containment tax**.

# Numbers (from Aaron’s note — canonical write)

| Metric | Value | Notes |
|--------|-------|-------|
| Sync budget | **~5 µs** | GPUs computing one answer must sync |
| Light round-trip in that window | **~750 m** | Coherent GPU team ends at sat edge |
| Formation flying (Google Suncatcher-class) | **~150 m** apart | Alt to containment — much tighter than Starlink |
| AI1 sat power ≈ | **1× GB300 NVL72 rack = 72 GPUs** | |
| Example MoE | **256 experts** into 72 GPUs | → **3.56 experts/GPU** vs ~1 on ground |
| NVIDIA expert-spread uplift (cited) | **up to 1.8×** tokens/sec/GPU | |
| Worst-case orbit efficiency | **44% less** tokens than ground | conservative stack |
| Containment tax | **1.8 sats** of GPUs to do work of **1** | |
| Next power class | **200–240 kW** sat | tax baseline → **1.44×** before software |
| SpaceXAI C-rewrite | captures **up to half** the tax | per note |
| SpaceX model cadence (cited) | **~3.5-week** release | co-design lever |

# Update — AI1 scoped for Rubin (2026-07-16)

Aaron `2077821834313994593`: Elon’s reveal that **AI1 sats are scoped for Rubin** cuts their **worst-case orbital tax nearly in half immediately** (model had expected this only by **AI2**). Bottom line from Aaron: **single-node inference is happening** and more efficient than assumed. Google **Suncatcher** formation flying remains a valid alternate.

# Levers to decay the tax

1. **SpaceXAI C-rewrite** — up to ~½ tax  
2. **Co-design model for 72 GPUs** — largest lever (training decision)  
3. **More GPUs/sat via power density** — 200–240 kW class  
4. **Earlier Rubin-class AI1** — pulls tax relief forward vs AI2 timeline (Jul 2026 update)  

Expected: **Grok** and **Composer** first models co-designed for orbital inference sats.

# Scoping

Containment tax hits **revenue / payback**, not (yet) their orbital-vs-terrestrial **cost** model.

# Related ledger

`data/research/2026-07-grok-mach33-twitter-numbers.md`
