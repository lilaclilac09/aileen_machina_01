# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

---
id: 2026-steel-lab-semianalysis
type: research
date: 2026-03-01
title: SemiAnalysis STEEL teardown lab (Oregon) — public facts
source: SemiAnalysis / Dylan Patel LinkedIn + secondary coverage (Yahoo/Tech)
topics: [semianalysis, steel, teardown, smic, intel-18a, cpo, dylan-patel]
confidence: public
url: https://www.semianalysis.com
---

# What STEEL is

**STEEL** = SemiAnalysis Teardown Engineering & Evaluation Lab — Hillsboro / Oregon area. Founder-led CapEx to compete with TechInsights on advanced-node reverse engineering.

# Numbers / claims (public)

| Item | Value | Source type |
|------|-------|-------------|
| Lab CapEx | **$10s of millions** | Dylan LinkedIn announce |
| Build time | ~**1–1.5 years** into journey at announce | Dylan |
| Business claim | SemiAnalysis **exceeds TechInsights in revenue** (founder claim; no PE) | Dylan |
| Firm age | ~**6 years** at announce | Dylan |
| First public compare | SMIC **N+3** metal pitch **32.5 nm** vs Intel **18A** **36 nm** | Secondary teardown coverage |
| Density gap cited | SMIC trails Intel 18A HD library by **~38%** | Secondary |
| Chip studied | HiSilicon **Kirin 9030** (Huawei Mate 80) | Secondary |
| Also cited | TSMC customer **COUPE CPO** optical engine + EIC 3D stack reverse eng | Dylan/STEEL |
| Memory on sample | Samsung LPDDR5X; some 16GB with **CXMT** DRAM | Secondary |

# Tools stack (DAC / hiring pages)

Mechanical / wet-dry prep, FIB / plasma-FIB, optical microscopy, X-ray tomography, FE-SEM, TEM, aberration-corrected STEM+EDS.

# People

| Name | Role |
|------|------|
| Dylan Patel | Founder, CEO, Chief Analyst — `@dylan522p` |
| STEEL team | Competitive analysis / manufacturing architecture (hiring in Hillsboro) |

# Note on Twitter

Full `@dylan522p` timeline cannot be pulled from this host (api.twitter.com blocked; FxTwitter has no timeline). Ingest individual status URLs via `pnpm ingest:tweet`.
