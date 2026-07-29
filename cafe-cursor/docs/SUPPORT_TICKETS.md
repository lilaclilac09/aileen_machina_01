# Support tickets — why not mailto cafe@?

## Short answer

**`cafe@aileena.xyz` is send-only.** It is the Resend **From / Reply-To** brand address for outbound guest emails. Unless you set up DNS **MX + mailbox or forwarding** to your real inbox, mail sent *to* `cafe@` goes nowhere you can read.

## Hide personal inbox (non-negotiable)

- Guests **never** see `NOTIFY_CC_EMAIL` (your real inbox).
- Guest-facing **From / Reply-To** must stay on brand (`cafe@aileena.xyz`); personal domains (Gmail / QQ / Outlook / …) are blocked in code.
- Ticket alerts go **only** to `NOTIFY_CC_EMAIL` (private). API responses use masked addresses only.

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

Guests must check **https://cursor.com/dashboard/spending** and upload a screenshot
with every `/help` ticket. Admin → Tickets → **View** opens the image.
