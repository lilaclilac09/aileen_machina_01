# SemiAnalysis — report & source index (DeepSeek cost network)

**Hub:** `semianalysis-memory-network.md`  
Use this file when the agent needs **citations / URLs**, not raw arithmetic.

---

## Tier A — primary (must cite for $6M debate)

| ID | Title | Date | URL | What it contributes |
|----|-------|------|-----|---------------------|
| A1 | DeepSeek-V3 Technical Report | 2024-12 | https://arxiv.org/abs/2412.19437 | Exact **2.788M** H800-hr, **$5.576M** @ $2/hr, stage table, exclusion note, 671B/37B, 14.8T, 2048 H800 |
| A1b | Same (HTML) | | https://ar5iv.labs.arxiv.org/html/2412.19437 | Readable Table 1 |
| A2 | **DeepSeek Debates** (Dylan Patel, AJ, Doug, Reyk Knuhtsen) | 2025-01-31 | https://newsletter.semianalysis.com/p/deepseek-debates | **>$500M** GPU spend, **~$1.6B** server CapEx, **~$944M** ops, **~50k** Hopper mix, High-Flyer, MLA ~93.3%, benchmark hygiene, Accelerator Model pointer |

---

## Tier B — SemiAnalysis companion (same research house)

| ID | Title | Date | URL | What it contributes |
|----|-------|------|-----|---------------------|
| B1 | DeepSeek Debrief: >128 Days Later | 2025-07-03 | https://newsletter.semianalysis.com/p/deepseek-debrief-128-days-later | Tokenomics: R1 API **$0.55 / $2.19**, latency vs $/Mtok tradeoffs, **64K** context on own host, batching keeps compute internal; OpenRouter / SensorTower / SimilarWeb charts |
| B2 | DeepSeekV4 1.6T Day 0–43 Performance | 2026 | https://newsletter.semianalysis.com/p/deepseekv4-16t-day-0-to-day-43-performance | Later stack: GB300 / Huawei Ascend Day-0; points back to **Accelerator & HBM model** |
| B3 | H100 vs GB200 NVL72 Training Benchmarks (Power, TCO) | | https://newsletter.semianalysis.com/p/h100-vs-gb200-nvl72-training-benchmarks | How Semi thinks about **TCO per GPU** (CapEx+OpEx), rack all-in costs — method cousin to DeepSeek fleet TCO |
| B4 | 100,000 H100 Clusters | | https://newsletter.semianalysis.com/p/100000-h100-clusters-power-network | Cluster power / CapEx scale context (e.g. >$4B server CapEx class for 100k); power math |
| B5 | Coding Assistant Breakdown / Tokenomics | | https://newsletter.semianalysis.com/p/the-coding-assistant-breakdown-more | Tokenomics model; V4 KV claims vs prior MLA generation |

**Internal Semi tools named in prose (not public URLs):** Accelerator Industry Model · Accelerator & HBM model · Tokenomics model.

---

## Tier C — third-party triangulation (optional)

| ID | Title | URL | Role |
|----|-------|-----|------|
| C1 | Artificial Analysis | https://artificialanalysis.ai | Capability / speed charts cited by Semi |
| C2 | OpenRouter | https://openrouter.ai | Third-party DeepSeek token volume / price-latency |
| C3 | Lennart Heim charts | (cited inside Debates) | GPU investment visuals |
| C4 | Alberto AI — Cost of DeepSeek | https://albertoai.substack.com/p/ai-update-23-the-cost-of-deepseek | Independent CapEx-style re-estimate (~$95–120M cluster framing) — **not** Semi; label as secondary |

---

## Tier D — site memory / articles (aileena.xyz)

| ID | Path / article | Role |
|----|----------------|------|
| D1 | `semianalysis-deepseek-numbers.md` | Canonical numbers |
| D2 | `semianalysis-method-4step.md` | Method |
| D3 | `semianalysis-deepseek-tokenomics.md` | Serving economics |
| D4 | `hardware-memory-wall.md` | HBM / KV lens |
| D5 | Blog: Huawei HBM / supply | Ascend Day-0 + Semi InferenceX cites |
| D6 | Draft: `drafts/deepseek-cost-myth.md` | Unpublished essay |

---

## Citation discipline

1. Paper dollars → cite **A1** + say “rental assumption $2/hr”.
2. CapEx / 50k / $944M → cite **A2** + mark as Semi estimate (`~` / `>`).
3. Cheap API ≠ cheap CapEx → cite **B1** tokenomics.
4. Never blend Alberto (C4) numbers into Semi’s `$1.6B` without labeling the author.
