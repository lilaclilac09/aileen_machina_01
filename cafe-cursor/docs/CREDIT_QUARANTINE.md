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
