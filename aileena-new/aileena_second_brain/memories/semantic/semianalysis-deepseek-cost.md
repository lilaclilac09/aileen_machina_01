# SemiAnalysis — DeepSeek cost claim (agent entry)

**Hub / network:** `semianalysis-memory-network.md`  
**Exact figures:** `semianalysis-deepseek-numbers.md`  
**Method:** `semianalysis-method-4step.md`  
**Sources:** `semianalysis-report-index.md`  
**Serving economics:** `semianalysis-deepseek-tokenomics.md`

## One-line claim

**Paper `$5.576M` (media `~$6M`) ≠ company cost.**  
It is only DeepSeek-V3 **official final-run** H800 GPU-hours × assumed **`$2`/hr**. Real picture = **CapEx + OpEx + R&D + shared High-Flyer fleet** (SemiAnalysis).

## Quick numbers (see ledger for full table)

| Layer | Write exactly | Source |
|-------|---------------|--------|
| Paper total | **`$5.576M`** = **`2.788M`** H800-hr × **`$2`** | arXiv:2412.19437 Table 1 |
| Pre / ctx / post | **`2664K` / `119K` / `5K`** hr → **`$5.328M` / `$0.238M` / `$0.01M`** | same |
| GPU investment | **`>$500M`** | Semi Debates |
| Server CapEx | **`~$1.6B`** | Semi Debates |
| Cluster OpEx | **`~$944M`** | Semi Debates |
| Fleet | **`~50,000` Hopper** (≈**10k H800** + ≈**10k H100** + **H20**) — not “50k H100” | Semi Debates |
| Official run size | **`2,048` H800** | V3 paper |
| Early | **`10,000` A100 (2021)** | High-Flyer |

## Agent stance

1. Affirm the paper number is **real for final-run GPU rental proxy**.
2. Reframe to **TCO / CapEx / OpEx / R&D / shared cluster** via 4-step method.
3. Cite Debates + paper; do **not** invent CapEx.
4. If asked “how did they get 50k?” → Accelerator Industry Model + export timeline + High-Flyer (method Step 2).
5. If asked about cheap API → tokenomics file (batched latency, 64K context) ≠ disproof of CapEx.

## Related

- Hardware memory wall: `hardware-memory-wall.md`
- Draft essay: `drafts/deepseek-cost-myth.md`
- Channel: https://www.semianalysis.com
