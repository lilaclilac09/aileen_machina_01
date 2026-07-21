---
id: 2026-07-kimi-k3-wideep
type: research
date: 2026-07-17
title: Kimi K3 WideEP — why B200 needs multi-node EP and loses to NVL72
source: SemiAnalysis tweet 2077966560447074689 + operator synthesis / InferenceX-analog (K2.5)
topics: [kimi, k3, wideep, moe, b200, nvl72, b300, inference, memory]
confidence: mixed
url: https://x.com/SemiAnalysis_/status/2077966560447074689
---

# Model (public framing)

**Kimi K3** (Moonshot AI, ~2026-07-16): ~**2.8T** MoE, **1M** context, native vision, Kimi Delta Attention + Attention Residuals. Active params sparse (e.g. ~16 of many hundreds of experts — secondary reports).

Anchor tweet: SemiAnalysis_ `2077966560447074689`.

# Why it does not fit a single DGX B200

| Claim | Value | Confidence |
|-------|-------|------------|
| Params | **2.8T** MoE | quoted (Semi) |
| B200 HBM | **≈192 GB** HBM3e / GPU | synthesis / vendor class |
| Required /GPU HBM for native fit | **288 GB** (GB300 NVL72 / B300 / MI355X) | quoted (Semi) |
| Weights order-of-magnitude (low-bit) | **~1.5 TB** | synthesis |
| Context pressure | **1M** tokens → large KV under agentic load | synthesis |

Even FP4/MXFP4: expert weights + activations + long-context KV exceed single-node B200.

# What WideEP is

**Wide Expert Parallelism** = Expert Parallelism beyond one NVLink island (typically 8 GPUs).

- Experts distributed / selectively replicated across **16–72+** GPUs
- “Gang” multi-node into one logical inference instance → aggregate memory fit
- Kernels: all-to-all dispatch/combine; **EPLB** (hot-expert replication + rebalance); layer-wise weight redistribution
- Stacks: TensorRT-LLM, vLLM/Dynamo (+ DeepEP-style kernels)

# Semi’s B200 path vs NVL72 bottleneck

| Aspect | Multi-node B200 + WideEP | GB300/B300 NVL72 + WideEP |
|--------|--------------------------|---------------------------|
| Model fit | Via ganging | Native / preferred |
| Inter-node / inter-GPU fabric | **~400 Gbit/s** scale-out | **~18×** higher (full NVLink domain) — Semi quoted |
| MoE traffic | all-to-all leaves NVLink island → BW/latency bound | stays on rack-scale NVLink |
| Best for | Reuse fleet / batch throughput | Interactive + agentic prod |

# Analog throughput (Kimi K2.5 InferenceX — predecessor)

K2.5: **1T** MoE, **384** experts. Numbers are **analog**, not K3 measured.

| Config | tok/s/GPU | Note |
|--------|-----------|------|
| GB200 NVL72 + Wide-EP (Dynamo vLLM) | **~12,587** peak | InferenceX-class |
| Best B200 | **~4,021** | → **~3.1×** NVL72 advantage |
| EP width | NVL72 sustains wider EP (e.g. EP 16); B200 capped by scale-out | |

Same pattern on DeepSeek-R1-class: NVL72 Wide-EP advantage grows at moderate–high interactivity; shrinks only when working set fits one 8-GPU node.

Related Semi software stack claim (B300): baseline **~1,000** → **~14,000** tok/s/GPU with wideEP + disagg + MTP = **14×** (`2077031015978025101`).

# Operator hierarchy

1. Prefer **GB300 NVL72 / B300** (or equiv high-BW scale-up) for production K3.
2. Multi-node **B200 + WideEP** as transitional / capacity expansion when NVL72 scarce.
3. Keep stacking software: better kernels, MTP/speculative decode, quant, **prefill/decode disagg** (decode benefits most from wide EP).

# Bottom line

WideEP **solves memory capacity** on B200 by multi-node EP. It does **not** erase the **400 Gbit/s** scale-out tax vs NVL72 — so tokens/$ and interactivity remain worse. Rack-scale NVLink is strategically important for multi-trillion fine-grained MoE serving.
