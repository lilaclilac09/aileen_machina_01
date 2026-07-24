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
