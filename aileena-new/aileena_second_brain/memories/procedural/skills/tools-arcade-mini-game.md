# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

# Skill — add a Tools hub utility

## What this is

`/tools` is a **public tools hub** (flat geometric tiles, no arcade/game chrome). Each tool is:

1. Registry row in `lib/tools/registry.ts`
2. Route `app/tools/<slug>/page.tsx`
3. UI `components/tools/<Name>Tool.tsx`
4. Optional API under `app/api/tools/`
5. EN + DE copy in `lib/translations.ts`

Full checklist: `aileena-new/docs/TOOLS_ARCADE.md`.

Reference: **Audio Clipping** (`inkling-clips`) — `components/tools/InklingClipTool.tsx`, `docs/INKLING_CLIPS.md`.

## UI rules

- Wrap in `ArcadeLayout` + `ArcadeCabinetFrame`
- Flat fills, **no borders** on tiles / buttons / cards
- Primary CTA: `className="arcade-start-btn"` (rectangular, not pill)
- Back: `← Tools` → `/tools`
- Copy says **tool**, not game / arcade / press start / credits

## Data rule

Use listening-shelf RSS + `data/` + `/api/v1` — do not invent parallel catalogues.

## Registry shape

```ts
arcade: { glyph: '◆', screenGradient: '#d8eeeb' },
```

When asked to add a tool: follow `TOOLS_ARCADE.md`, keep the hub flat and simple.
