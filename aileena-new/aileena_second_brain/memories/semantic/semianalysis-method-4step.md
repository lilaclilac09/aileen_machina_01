# SemiAnalysis method — 4-step DeepSeek cost breakdown

**Hub:** `semianalysis-memory-network.md`  
**Numbers:** `semianalysis-deepseek-numbers.md`  
**Primary report:** *DeepSeek Debates* — https://newsletter.semianalysis.com/p/deepseek-debates

This is the **analysis process** Dylan Patel / SemiAnalysis used (and the reusable template for similar “paper cheap train” claims).

---

## Step 1 — Start with official public data (paper dissection)

1. Read DeepSeek-V3 technical report end-to-end (arXiv:2412.19437).
2. Extract published compute: **2.788M H800 GPU-hours** for *full official training*.
3. Convert with paper’s assumed rental: **`$2` / H800 GPU-hr** → **`$5.576M`** (media: ~$5.6M–$6M).
4. Split stages exactly:

| Stage | Hours | USD |
|-------|------:|----:|
| Pre-training | 2,664,000 (2664K) | $5.328M |
| Context extension | 119,000 (119K) | $0.238M |
| Post-training | 5,000 (5K) | $0.01M |
| **Total** | **2,788,000 (2.788M)** | **$5.576M** |

5. **Key observation (paper says this):** figure is *only* the official / final training run; **excludes** prior research and ablations.

**Output of Step 1:** a correct *narrow* metric — not yet company cost.

---

## Step 2 — Build hardware & cluster model (Accelerator Industry Model)

1. Switch unit of analysis from **one rental invoice** → **owned / accessible fleet**.
2. Use Semi’s proprietary **Accelerator Industry Model** (shipments, ASPs, China SKUs).
3. Cross-reference:
   - Historical purchases & **export-control timelines** (A100 → H800/H100 → H20).
   - Org: DeepSeek spun from **High-Flyer** hedge fund (**May 2023**).
   - Early bet: **10,000 A100 in 2021**.
4. Conclusion (Semi belief): access to **`~50,000` Hopper GPUs** — mix of **H800 / H100 / H20**, shared across **trading + inference + research + training**.
5. SKU hygiene: **≠ 50,000 H100**. Semi cites roughly **`~10,000 H800`** and **`~10,000 H100`**, plus H20.

**Output of Step 2:** cluster scale + mix that can support both train runs and everything else.

---

## Step 3 — Calculate full TCO (Total Cost of Ownership)

Go far beyond GPU-hours:

| Bucket | Semi figure | What it covers |
|--------|-------------|----------------|
| Hardware / server **CapEx** | **`~$1.6B`** | Servers, networking, storage capital |
| Operating costs | **`~$944M`** | Power, cooling, maintenance / ops of such clusters |
| Historical **GPU spend** | **`>$500M`** | Accelerator investment over company history |

Add paper-omitted soft costs (qualitative but material):

- R&D + architecture experiments (e.g. **MLA** took months of GPU time + engineer effort)
- Data collection, cleaning, multiple ablation runs
- Talent (high salaries; recruiting events; alleged **>$1.3M** offers)
- Shared cluster usage (compute not dedicated to one training run)

**BOM analogy:** `$5.576M` is one line item on the bill of materials — not the car.

**Output of Step 3:** CapEx + OpEx + excluded R&D story = economic picture.

---

## Step 4 — Cross-verification & reality check

Validate with multiple sources (no single spreadsheet):

- Supply chain & shipment data (via Accelerator Model)
- Recruiting ads / talent intel (GPU access boasts, salary rumors)
- Industry intelligence vs other labs (Meta, OpenAI, Anthropic fundraising as existence proof that final-run ≠ company cost)
- Benchmark hygiene: time-shifted model comparisons; omitted benches; silent R1 compute

**Reality check rule:** training *one* frontier model always costs more than the final run because of experimentation.

**Output of Step 4:** confidence that `$5.576M` is real **and** incomplete.

---

## Reusable template (any lab)

```
1. Parse paper GPU-hr × stated $/hr → narrow metric
2. Estimate fleet via procurement / export / org history
3. Roll CapEx + OpEx + R&D exclusions → TCO
4. Triangulate: supply chain + hiring + peer lab economics + benches
```

## Core insight

**`$5.576M` / `~$6M` = narrow efficiency metric** (final assembly).  
**Full economic picture = experimentation + infrastructure + shared fleet TCO.**
