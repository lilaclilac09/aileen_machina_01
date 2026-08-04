# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

# Credit consume / quarantine

## Problem

Cursor referral links may be **consumed on Cursor.com** when a guest opens them.
Our DB only knows **Assigned** (`isUsed`) — not Cursor-side redemption.

Old behavior: Admin **Revoke** put the same link back into Available → next guest
could get a **dead / already-consumed** link.

## Fix (shipped)

- Assignable pool = **never assigned** (`timesAssigned === 0`) only.
- **Revoke** frees the guest to claim again, but **quarantines** that link (not reissued).
- Have/Need + ops “available” count use the fresh pool only.
- Clear+Sync still deletes unused cache (including quarantine) then imports fresh sheet links.

## Ops

1. Guest needs a new link → Revoke → guest redeems again (gets a **fresh** credit).
2. Low fresh stock → Admin Clear+Sync Sheet (new unused referrals).
3. Do **not** expect Revoke to “un-consume” Cursor.com usage — that is impossible from our side.
