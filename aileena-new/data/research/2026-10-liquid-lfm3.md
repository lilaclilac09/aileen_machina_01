---
id: 2026-10-liquid-lfm3
type: research
date: 2026-10-27
title: Liquid AI LFM3 — 2B-class multimodal open weights + B300/SGLang serving claims
source: Liquid AI blog (Introducing LFM3)
topics: [liquid-ai, lfm3, multimodal, sglang, vllm, llama-cpp, mlx, b300, inference, edge]
confidence: public
url: https://www.liquid.ai/blog/lfm3
---

# Model (public framing)

**LFM3** (Liquid AI, announced **2026-10-27**): open-weight **~1.7B / 2B-class** multimodal family on one shared backbone — text, vision, audio, omni, and decision. Tri-hybrid architecture (gated short convolutions + SWA + global attention); **22T** pretrain tokens; text context **256K**.

First release covers six models branched from **LFM3-1.7B-Base**. Weights on Hugging Face / Liquid Playground / Liquid API. Day-0 runtimes: **vLLM**, **SGLang**, **llama.cpp**, **MLX** (also Liquid RIPL, HF, partners incl. RadixArk on SGLang).

# Serving claims (vendor-quoted)

| Config | Claim | Confidence |
|--------|-------|------------|
| 1× NVIDIA **B300** + **SGLang** BF16 @ **1024** concurrency | **LFM3-1.7B** ≈ **3.6B tokens/day** | quoted (Liquid blog) |
| Same setup | **LFM3-VL-2B** **>12k** tok/s | quoted (Liquid blog) |
| Edge (llama.cpp Q4_0, 32K ctx) | Fastest decode in Liquid’s on-device table; text ≈ **1 GB** at 4-bit | quoted |

Numbers are **Liquid’s published serving claims**, not independent re-measure. Useful as a small-model throughput anchor next to WideEP / NVL72 notes for frontier MoE.

# Operator takeaway

- Small multimodal open weights with day-0 SGLang/vLLM paths — useful for edge agents and high-concurrency text serving on a single B300, not a rack-scale MoE fit problem.
- Do **not** wire into Machina public door as a live endpoint; this file is corpus / tracker only (propose-only door unchanged).

# Source

https://www.liquid.ai/blog/lfm3
