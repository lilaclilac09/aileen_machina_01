# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

# Bundled Luma guest list for Cafe Cursor Shanghai

`luma-guests.csv` — Luma Guests export (bootstrap only when DB allowlist is empty).

## Guest sync rule (door day)

**Every sync MUST clear unclaimed guests first, then import.**

1. **Clear** — delete all EligibleUsers with `hasClaimed=false` (the allowlist cache)
2. **Sync** — import only rows with `checked_in_at` from a fresh Luma CSV

Admin button: **Clear + Sync Checked-in** (runs both steps).

- Already-claimed users are kept (audit / re-show credit).
- **Import Luma CSV** alone is additive (does NOT clear) — avoid on door day.
- **Clear list** only runs step 1.

Do not commit newer exports with extra PII unless needed for a re-sync.
