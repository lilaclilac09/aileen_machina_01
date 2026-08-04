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
id: 2026-Q1-NVDA-earnings
type: earnings
date: 2026-05-28
title: NVIDIA Q1 FY27 Earnings Call
source: NVIDIA Corporation
tickers: [NVDA]
topics: [datacenter, gaming, automotive, networking]
confidence: public
url: https://investor.nvidia.com/financial-info/quarterly-results/default.aspx
---

# Prepared remarks — CFO

Sample placeholder. Replace this file with the real transcript content.
The build-time indexer (`scripts/build-data-index.ts`) chunks the body
at headings and blank-line boundaries, then makes the chunks searchable
via the `searchEarnings` agent tool.

# Datacenter business

Data Center revenue of XX billion dollars, up XX percent quarter-over-
quarter and XX percent year-over-year. Demand for Blackwell continues
to outstrip supply through the quarter.

# Q&A

Analyst — Question: How are you thinking about Rubin yields entering
mass production?

CFO — Answer: We're tracking against the prior plan. The yield curve
has been steeper than Blackwell at the equivalent ramp point.

# Forward guidance

Q2 FY27 revenue guide of XX billion plus or minus 2 percent.
