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
id: 2026-06-corning-glass-bridge-cpo
type: research
date: 2026-06-24
title: Corning Glass Bridge for CPO and glass-core packaging (THE ELEC)
source: THE ELEC — Selye Moon
topics: [corning, cpo, optical, glass-bridge, pic, glassworks-ai, packaging]
confidence: public
url: https://www.thelec.net/
---

# Source

Parsed from THE ELEC screenshots (2026-06-24). Author: **Selye Moon**. Event: AI Data Center Optical Communications & Interconnect Tech Conference, POSCO Tower Yeoksam, Seoul.

# Product — Glass Bridge

Glass optical connector linking **PICs** ↔ **optical fibers**.

| Spec | Value |
|------|-------|
| Problem | On-chip waveguides **hundreds of nm** vs fiber cores **several µm** (dozens× mismatch) |
| Method | **Wafer-based ion-exchange** waveguides inside glass (IOX) |
| Assembly | Pick-and-place of IOX glass waveguides |
| Core pitch (initial) | **≥ 30 µm** |
| Target coupling loss | **< 2 dB** fiber↔PIC |
| Replaces | Pluggable transceivers / long **FAUs** |

# Adjacent Corning stack

- **CPO architecture:** glass substrates + waveguides + **TGVs** + flip-chip photonics  
- **GlassWorks AI:** fibers, cables, connectors, FAUs, alignment — intra-DC / inter-rack / campus  
- **Partner:** GlobalFoundries (optical interconnect for AI DCs, announced prior year)  
- **Capex / supply:** expanded manufacturing NC, Texas, Poland; multi-billion long-term deals with **Meta, Nvidia, Amazon**  
- **Quote:** Ko Joo-hyun, VP Corning Optical Communications — density + performance demand via GlassWorks AI  

# People

| Name | Role |
|------|------|
| Ko Joo-hyun | VP, Corning Optical Communications |
| Selye Moon | THE ELEC reporter |
| GlobalFoundries | Co-development partner |
