# SemiAnalysis × DeepSeek — numbers ledger (canonical)

**Authority:** Prefer this file for any numeric claim.  
**Hub:** `semianalysis-memory-network.md`  
**As-of:** sourced 2025-01 (Debates) + V3 paper 2024-12; tokenomics from Debrief 2025-07.

---

## A. Paper — DeepSeek-V3 official training cost

**Source:** DeepSeek-V3 Technical Report, arXiv:2412.19437, Table 1  
https://arxiv.org/abs/2412.19437 · https://ar5iv.labs.arxiv.org/html/2412.19437

**Assumption stated in paper:** H800 rental = **`$2` per GPU-hour**.

| Stage | GPU hours (H800) | GPU hours (alt) | USD @ $2/hr |
|-------|------------------|-----------------|-------------|
| Pre-training | **2,664,000** | **2664K** | **$5.328M** |
| Context extension | **119,000** | **119K** | **$0.238M** |
| Post-training | **5,000** | **5K** | **$0.01M** |
| **Total (official train)** | **2,788,000** | **2788K = 2.788M** | **$5.576M** |

**Checks:** `2664K + 119K + 5K = 2788K` · `$5.328M + $0.238M + $0.01M = $5.576M`.

### Related paper facts (not CapEx)

| Field | Value | Notes |
|-------|-------|-------|
| Total params | **671B** | MoE |
| Active params / token | **37B** | |
| Pre-train tokens | **14.8T** | |
| Official train cluster | **2,048 H800** | “3.7 days per trillion tokens” framing |
| Pre-train GPU-hr / trillion tokens | **180K H800-hr** | |
| Media round of total | **~$5.6M – $6M** | same number, rounded |

### Paper’s own exclusion (verbatim intent)

Costs **include only official training of DeepSeek-V3**.  
**Exclude:** prior research, ablation experiments on architectures / algorithms / data.

---

## B. SemiAnalysis — company / fleet estimates (*DeepSeek Debates*, 2025-01-31)

**Source:** https://newsletter.semianalysis.com/p/deepseek-debates  
Authors: Dylan Patel, AJ, Doug, Reyk Knuhtsen

| ID | Metric | Canonical write | Type |
|----|--------|-----------------|------|
| S1 | Historical GPU investment | **`>$500M`** | Semi confidence (post export-control adjustment) |
| S2 | Total **server CapEx** | **`~$1.6B`** | Semi analysis |
| S3 | Cluster operating cost | **`~$944M`** | Semi analysis (ops of such clusters) |
| S4 | Hopper access (shared) | **`~50,000` Hopper GPUs** | Mix — **not** 50k H100 |
| S5 | Of which H800 (belief) | **`~10,000` H800** | Semi belief |
| S6 | Of which H100 (belief) | **`~10,000` H100** | Semi belief |
| S7 | H20 | **additional H20** (China-available; large Nvidia China production cited) | qualitative + orders |
| S8 | Early buy | **`10,000` A100 in 2021** | High-Flyer, pre-restriction |
| S9 | Spin-out | DeepSeek **May 2023** from High-Flyer | org |
| S10 | Headcount (then) | **`~150` employees**, growing | Semi |
| S11 | Top hire rumor | **`>$1.3M` USD** alleged for promising candidates | recruiting intel — mark as alleged |
| S12 | MLA KV reduction | **`~93.3%`** vs standard attention | Semi (inference cost driver) |
| S13 | Algo progress (cited) | **`~4×` / year**; Dario up to **`10×`** | capability per compute |
| S14 | GPT-3-class inference cost fall | **`~1,200×`** historically | Semi chart narrative |

**Workload sharing:** same GPU pool used for **trading + inference + training + research** (High-Flyer ↔ DeepSeek).

---

## C. Ratio helpers (for agent explanations)

| Comparison | Math (illustrative) |
|------------|---------------------|
| Paper vs GPU spend floor | `$5.576M` vs `>$500M` → **≳90×** (floor; not a Semi headline ratio) |
| Paper vs server CapEx | `$5.576M` vs `~$1.6B` → **~$1.6B / $5.576M ≈ 287×** |
| Final-run cluster vs fleet | `2,048` H800 train nodes vs `~50,000` Hopper fleet |

Do **not** present ratios as Semi’s official “216×” unless citing a specific secondary article that defines its denominator.

---

## D. What is NOT in the paper $5.576M (checklist)

- R&D / architecture search / **ablations** (MLA development: months of GPU + engineers)
- Data collection & cleaning
- Hardware CapEx (servers, network, storage)
- Cluster OpEx (power, cooling, ops)
- Salaries / recruiting
- Shared High-Flyer non-train workloads
- R1 synthetic-data / RL compute (R1 paper **silent** on compute)

---

## E. Format cheat-sheet (copy-paste safe)

```
Paper total:           $5.576M  (= 2.788M H800-hr × $2/hr)
Pre-train:             2664K hr → $5.328M
Context ext:           119K hr  → $0.238M
Post-train:            5K hr    → $0.01M
Semi GPU spend:        >$500M
Semi server CapEx:     ~$1.6B
Semi cluster OpEx:     ~$944M
Fleet:                 ~50,000 Hopper (≈10k H800 + ≈10k H100 + H20…)
Official run cluster:  2,048 H800
Early:                 10,000 A100 (2021)
```
