# Support tickets — why not mailto cafe@?

## Short answer

**`cafe@aileena.xyz` is send-only.** It is the Resend **From / Reply-To** brand address for outbound guest emails. Unless you set up DNS **MX + mailbox or forwarding** to your real inbox, mail sent *to* `cafe@` goes nowhere you can read.

## What guests should do

1. On-site → volunteer  
2. After event → **https://cursor-cafe.aileena.xyz/help** (工单)  
3. Ticket is stored in Postgres (`SupportTicket`)  
4. Optional alert email → **`NOTIFY_CC_EMAIL`** (your private inbox in Vercel env)

## Admin

Dashboard → **Tickets** tab → Mark done / Reopen.

## Deploy

After merge:

```bash
cd cafe-cursor && npx prisma db push
```

Confirm Vercel has `NOTIFY_CC_EMAIL` set to an inbox you actually read.
