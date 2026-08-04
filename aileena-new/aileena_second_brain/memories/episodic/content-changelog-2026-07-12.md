# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

# Content changelog — 2026-07-12

Auto-detected updates from site sources (`sync-content-memory`).

## New narrative films

- **Blue Is the Warmest Color** (2013 · Léa · intimacy) — https://en.wikipedia.org/wiki/Blue_Is_the_Warmest_Colour
- **The French Dispatch** (2021 · Léa · magazine life) — https://en.wikipedia.org/wiki/The_French_Dispatch
- **Spectre / No Time to Die** (Madeleine Swann · Bond girl arc) — https://en.wikipedia.org/wiki/No_Time_to_Die
- **The Crown** (series · old order) — https://en.wikipedia.org/wiki/The_Crown_(TV_series)
- **The Capture** (series · new untrust) — https://en.wikipedia.org/wiki/The_Capture_(TV_series)

## New European living notes

- **City wandering, not sightseeing** (walk / café)
- **Black-and-white looking** (eye / frame)
- **Language fragments** (FR / IT)
- **Wardrobe as Bond cool** (cut / repeat)
- **Slow museum** (one room)
- **Table as ritual** (IT / FR kitchen)

## New lifestyle practices

- **Urban drift diary** (weekly)
- **One letter or collage page** (paper)
- **Soundtrack as room** (listen)
- **Watch in pairs, not piles** (rhythm)

## Next step

Review and merge durable facts into `memories/semantic/` or `prompts/` if needed. Dreaming will pick this up on the next weekly run.
