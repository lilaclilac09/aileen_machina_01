# Agent chat transcript forward — ops

Owner inbox delivery for every console conversation.

## Pipeline

```
AgentChat (browser)
  → POST /api/chat/forward   (auto: debounce / pagehide / session max)
  → Redis durable log (Upstash) when configured
  → Resend email → CONTACT_TO | LEAD_INBOX | NOTIFY_CC_EMAIL | cafe@aileena.xyz

AgentChat leave-a-note
  → POST /api/lead           (visitor email + optional transcript)
  → Resend (Reply-To = visitor)
```

Code: `components/AgentChat.tsx` · `app/api/chat/forward/route.ts` · `app/api/lead/route.ts` · `lib/chatForwardStore.ts` · `lib/contact-inbox.ts` · `lib/resend-from.ts`

## Two-week inventory (2026-07-21 → 2026-08-04)

| When | Change | Status |
|------|--------|--------|
| 2026-07-29 · PR #328 | From `onboarding@resend.dev` → verified `cafe@aileena.xyz` | Merged on main |
| 2026-08-04 · PR #349 | Redis durable log + `chat:pending` / `chat:resend-pending` + beacon→fetch fallback | This branch |
| — | GitHub Action `chat-forward-resend.yml` (every 6h drain) | This branch |

**No other transcript sync scripts** on main in that window. Soft Redis `visitor:soft:*` is short question snippets only — not full chats.

**Past two weeks cannot be reconstructed from git.** Before durable Redis, forwards were email-only. Recover only via **Resend dashboard → Emails**, subject `[AILEENA Chat …]`.

## Vercel / GH secrets checklist

| Env | Required for | Notes |
|-----|--------------|-------|
| `RESEND_API_KEY` | send email | Without it, route still logs `failed` to Redis when Upstash is set |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | durable log + resend queue | Same as visitor soft memory |
| `CONTACT_TO` / `LEAD_INBOX` | inbox To | Defaults to `cafe@aileena.xyz` |
| `RESEND_FROM` / `FROM_EMAIL` / `CONTACT_FROM` | From | Defaults to `AILEENA MACHINA <cafe@aileena.xyz>` (must be verified domain) |

This cloud-agent environment typically has **none** of the above — run list/resend on a machine with production secrets (or via the GH Action).

## Commands

```bash
pnpm chat:pending                 # failed / unsent
pnpm chat:pending -- --all        # recent history
pnpm chat:resend-pending -- --dry-run
pnpm chat:resend-pending
```

Scheduled: `.github/workflows/chat-forward-resend.yml` every 6h + `workflow_dispatch`.
