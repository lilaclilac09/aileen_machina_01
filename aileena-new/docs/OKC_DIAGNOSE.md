# OKC Explorer — diagnose before methods

Live demo: [`/nsight?view=diagnose`](/nsight?view=diagnose) · source: `public/nsight.html` + `public/okc-diagnose.json`.

The Overview tab still holds the contest path (v4 4.599 → leader 2.92, M01–M08). Diagnose is the method that decides **whether a slice still has a knob**.

## Loop (four steps)

1. **Separate** the job from the time. What the kernel solves is not where the milliseconds go.
2. **Round trips.** `kernel time ≈ trips × latency`. Independent loads first, 128-bit wide. Goal is fewer trips, not fewer bytes — unless the bytes cause extra trips.
3. **Floor vs measured.** Physics floor (bytes/HBM, math/tensor, STG drain) vs design bound (if the playbook landed) vs measured. Close → this design has little left. Large gap → the kernel did not follow the design, or the estimate is wrong.
4. **Methods only on a gap.** Floor slices get no knob. Unknown slices get nsys/ncu, not a rewrite.

## How to use the demo

Open `/nsight?view=diagnose` (or Overview → **Diagnose · floor vs gap**).

| Click | What you should see |
|-------|---------------------|
| Problem pills | `bf16_proj` has measured totals. The others stay Unknown ms until a capture. |
| 1 · Separate | Left = the job. Right = what not to polish (bf16: 3 µs of math). |
| 2 · Round trips | SM ⇄ HBM trips. BEFORE vs AFTER schedule. Toggle 128-bit vs narrow (LSU clog). Occupancy slider is `rate ≤ S · B / L`. |
| 3 · Floor | Log waterline 1 µs → 5 ms. Teal tick = physics floor. Blue tick = design. Pink bar = measured/estimate. Click a row. |
| 4 · Methods | STOP list, then GAP methods, then UNKNOWN. Cross-CTA reduction: cluster DSMEM / global atomics / second kernel — pick at the crossover. |

Worked example on **bf16_proj**:

- GEMM math ≈ 3 µs → **FLOOR**. Do not tune tiles at small m.
- Stream 188 MiB floor ≈ 59 µs, bar 1.38 ms → **GAP**. Prefetch cannot hide 59 µs behind 3 µs of math. Single-FP8 moves the physics floor. `M02`.
- Tile tail 1.06 ms → **GAP**, not hardware. `M01` + `M05`. Then pick the Split-K reduction at the crossover.
- Write drain → **UNKNOWN**. Playbook STG is 32 B/cycle. Measure before writing a store-path kernel.

Shares on the pipeline cards remain model estimates. Totals 4.83 / 4.599 / 2.92 ms are the 2026-11-01 board.

## Playbook formulas (not this board’s capture)

```txt
kernel time ≈ round trips × latency
time_term   = work / rate     → max term is the bound
rate        ≤ S · B / L
```

| Ref | Number | Use |
|-----|--------|-----|
| LDG | 128 B/cycle | Wide prefetch. One `LDG.128` = 16 B. |
| STG | 32 B/cycle, any width | Drain after the last store. Partial fills still pay 32 B. |
| LD.E | 32 B → 2 × 16 B | Generic load splits (pointer through shuffle / `__grid_constant__` structs). |
| Occupancy | API, not totals | `get_blocks_per_sm` / CUDA occupancy. Do not divide total blocks by SM count. |

## Adding the next problem (follow this file)

Do not fork a second dashboard. Append one key to `public/okc-diagnose.json` `problems`:

```json
"attn": {
  "key": "attn",
  "name": "attention_decode",
  "view": "attn",
  "solving": "…",
  "notSolving": "…",
  "measuredMs": null,
  "leaderMs": null,
  "baselineMs": null,
  "trips": { "label": "…", "before": ["…"], "after": ["…"] },
  "slices": [
    {
      "id": "kv",
      "name": "KV stream",
      "bucket": "copy",
      "floorLabel": "bytes / HBM · grows with L",
      "measuredLabel": "~47% · est.",
      "floorMs": null,
      "designMs": null,
      "measuredMs": null,
      "verdict": "gap",
      "why": "…",
      "method": "Split-KV",
      "methodNote": "…"
    }
  ]
}
```

Rules:

- `verdict` is `floor` | `gap` | `unknown`.
- `null` times stay Unknown. Do not invent a floor.
- `view` must already exist as a tab (`bf16`, `attn`, `moe`, `declayer`, `prelayer`) or add the tab + pipeline card in `nsight.html` the same way the others are built.
- Re-run `pnpm verify:okc-diagnose`.

`public/okc-diagnose.js` only renders that JSON. No second explorer.

## Mapping to M01–M08

| Slice (bf16) | Verdict | Method |
|--------------|---------|--------|
| GEMM math | floor | none |
| Stream weights | gap | M02 (gated FP8) + LDG.128 |
| Load stalls | gap, only if ncu proves it | M03 |
| Tile tail | gap | M01 + M05; M08 later |
| Dispatch | gap | M06 (harness graph) |
| Router 2nd pass | gap | M04 |
| Write drain | unknown | measure STG drain |

## Verify

```bash
cd aileena-new
pnpm verify:okc-diagnose
pnpm capture:okc-diagnose   # needs a server on VERIFY_BASE_URL (default :3000)
```
