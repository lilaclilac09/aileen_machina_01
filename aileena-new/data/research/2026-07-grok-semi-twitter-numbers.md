---
id: 2026-07-grok-semi-twitter-numbers
type: research
date: 2026-07-17
title: SemiAnalysis / Dylan Twitter numbers ledger (Grok export)
source: Grok X export → data/social/inbox/grok-semi-2026-07-17.json + grok-semi-2026-07-17-b2.json
topics: [semianalysis, dylan-patel, tco, cpo, steel, rubin, helios, memory, nvidia, anthropic, rng]
confidence: public
url: https://x.com/dylan522p
---

# Source

Ingested from Grok-trained export (`pnpm ingest:grok`). All values **quoted** from tweets — do not invent.

# Numbers

| Metric | Value | Tweet |
|--------|-------|-------|
| AI debt by 2029 | **~$7T** (Semi org + Dylan) | SemiAnalysis_ `2074251380370423973` · dylan522p `2074253849095999616` |
| STEEL CapEx | **$10s of millions** | dylan522p `2066270360278794588` |
| GPU HBM capacity (Kimi K3 fit) | **288 GB** / GPU | SemiAnalysis_ `2077966560447074689` |
| B200 inter-node BW | **400 Gbit/s** | same |
| NVL72 vs B200 inter-node | **18×** higher | same |
| Sega → Nvidia lifeline | **$5M** | SemiAnalysis_ `2077800674612416824` |
| Amazon RNG vs fat-tree | **up to 45%** cost save | SemiAnalysis_ `2077136305411002461` |
| RNG standard DC servers | **6,144** (64/ToR) | SemiAnalysis_ `2077136303351619808` |
| VR NVL72 cost floor | **$4.92/hr/GPU** | SemiAnalysis_ `2077031019748679792` |
| VR NVL72 value ceiling | **$12.25/hr/GPU** | same |
| Scale-up CPO volume | **2029** (Semi anticipate) | SemiAnalysis_ `2075566645318177210` |
| Memory vendors 2025 | **200%+** (SNDK/WDC/STX/MU) | SemiAnalysis_ `2077031017722855706` |
| Anthropic ARR YE → YTD | **$9B → $44B+** | SemiAnalysis_ `2077031015978025101` |
| B300 tok/s/GPU | **~1,000 → ~14,000** (wideEP+disagg+MTP) = **14×** | same |
| Inference GM (Anthropic) | **38% → 70s** | same |
| Kimi K3 size | **2.8T** params | SemiAnalysis_ `2077966560447074689` |
| mach33 bandwidth 5y | **100,000 Tbps** (~50 Earths) | aaronburnett `2077896394350666187` |
| RNG rooms / ToRs / shuffle | **10** / **96** / **192** per room | SemiAnalysis_ `2077136303351619808` |

# Supply-chain calls (qualitative)

- **Scale-up CPO on GPU**: delayed / not ramping (Dylan) — *not* “CPO generally”
- **Kyber**: failed/delayed — **not** the same as Rubin delay (“couple months” vs original)
- **Rubin Ultra**: can/will ship in **other form factors**
- **AMD Helios** racks: delayed out of this year (Dylan; AMD denied)
- **Rubin Ultra HBM stack**: 16Hi → **12Hi** cut known to Memory+Accelerator model clients in March
- **Micron**: failed pin-speed path; Nvidia lowered Rubin pin-speed targets → ecosystem could ship
- **2023–25** = infra trade; **2026** = model-lab trade (Semi framing)

# Related deep dive

Kimi K3 WideEP: `data/research/2026-07-kimi-k3-wideep.md` — B200 multi-node gang vs NVL72; K2.5 InferenceX **~12.6k vs ~4.0k** tok/s/GPU (**~3.1×**).

# Profiles in DB

`@dylan522p` · `@SemiAnalysis_` · `@aaronburnett` (mach33 — not Semi)
