# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

# Support tickets — why not mailto cafe@?

## Short answer

**`cafe@aileena.xyz` is send-only.** It is the Resend **From / Reply-To** brand address for outbound guest emails. Unless you set up DNS **MX + mailbox or forwarding** to your real inbox, mail sent *to* `cafe@` goes nowhere you can read.

## Hide personal inbox (non-negotiable)

- Guests **never** see `NOTIFY_CC_EMAIL` (your real inbox).
- Guest-facing **From / Reply-To** must stay on brand (`cafe@aileena.xyz`); personal domains (Gmail / QQ / Outlook / …) are blocked in code.
- Ticket alerts go **only** to `NOTIFY_CC_EMAIL` (private). API responses use masked addresses only.
- **Never hit Reply in Gmail** on a ticket alert — that would send From your personal inbox to the guest.
- Answer guests with **Admin → Tickets → Reply (brand)** (Resend From/Reply-To = cafe@).

## What guests should do

1. On-site → volunteer  
2. After event → **https://cursor-cafe.aileena.xyz/help** (工单)  
3. Ticket is stored in Postgres (`SupportTicket`)  
4. Optional alert email → **`NOTIFY_CC_EMAIL`** (your private inbox in Vercel env)

## Admin

Dashboard → **Tickets** tab → Mark done / Reopen.

## Deploy

```bash
cd cafe-cursor && npx prisma db push
```

Confirm Vercel has `NOTIFY_CC_EMAIL` set to an inbox you actually read (never put it in git or guest UI).

## Spending screenshot (required)

Guests must check **https://cursor.com/dashboard/spending** and upload screenshot(s)
with the **account email visible** on the page.

- **Shot ①** — Cursor / contact account (always required)
- **Shot ②** — other account (required for **account swap** / email mismatch, or when Luma email ≠ contact)

Admin → Tickets → **View ①** / **View ②**.
