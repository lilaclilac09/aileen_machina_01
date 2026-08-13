# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

# Agent chat transcript forward — ops

Owner inbox delivery for every console conversation.

## Pipeline

```
AgentChat (browser)
  → POST /api/chat/forward   (auto: debounce / pagehide / session max)
  → Redis durable log (Upstash) when configured — transcript encrypted at rest
  → Resend email → CONTACT_TO | CONTACT_TO_EMAIL | LEAD_INBOX | NOTIFY_CC_EMAIL
    (required real inbox; cafe@ is From-only — never To)

AgentChat leave-a-note
  → GET  /api/lead           (ops status; soft-disable UI if not ready)
  → POST /api/lead           (visitor email + memo + transcript + page context)
  → Resend (Reply-To = visitor; text + HTML body with transcript)
```

Code: `components/AgentChat.tsx` · `app/api/chat/forward/route.ts` · `app/api/lead/route.ts` · `lib/mail-transcript.ts` · `lib/chatForwardStore.ts` · `lib/server/crypto.ts` · `lib/contact-inbox.ts` · `lib/resend-from.ts`

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
| `RESEND_API_KEY` | send email | Without it, leave-a-note soft-disables; forward still logs `failed` to Redis when Upstash is set |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | durable log + resend queue | Same as visitor soft memory |
| `PRIVATE_DATA_ENCRYPTION_KEY` | encrypt transcripts in Redis | 32-byte key, base64 (`openssl rand -base64 32`). Server-only. Missing → no plaintext persist. |
| `CONTACT_TO` / `CONTACT_TO_EMAIL` / `LEAD_INBOX` / `NOTIFY_CC_EMAIL` | inbox To | **Required.** No cafe@ fallback (send-only → bounce). |
| `RESEND_FROM` / `FROM_EMAIL` / `CONTACT_FROM` | From | Defaults to `AILEENA MACHINA <cafe@aileena.xyz>` (must be verified domain) |

This cloud-agent environment typically has **none** of the above — run list/resend on a machine with production secrets (or via the GH Action).

Email to the inbox is **not** end-to-end encrypted (Resend and the mailbox provider can read it). Redis at-rest encryption protects a dumped database, not the mail path.

## Owner browse UI

After owner key on `/council` or `/cabinet`:

- Door: `/council` (form POST, not a query-string bookmark)
- Cabinet: `/cabinet` (same store as `/inbox`, robots noindex)
- API: `GET /api/owner/chat-forwards?days=14` · `GET /api/owner/chat-forwards/:id`

## Commands

```bash
pnpm lead:test                    # dry-run: env status + fake transcript preview
pnpm lead:test -- --curl          # print curl for local /api/lead
pnpm lead:test -- --send          # real Resend send with fake transcript
pnpm chat:pending                 # failed / unsent
pnpm chat:pending -- --all        # recent history
pnpm chat:resend-pending -- --dry-run
pnpm chat:resend-pending
```

### Curl (local, with fake transcript)

```bash
curl -sS -X POST http://localhost:3000/api/lead \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"visitor-test@example.com",
    "name":"Lead pipeline test",
    "note":"Lead pipeline test",
    "transcript":[
      {"role":"user","text":"Hello — pipeline test.","at":"2026-08-11T10:00:00.000Z"},
      {"role":"assistant","text":"If you see this, delivery works.","at":"2026-08-11T10:00:01.000Z"}
    ],
    "context":"http://localhost:3000/?lead-test=1"
  }'
```

Status probe (no secrets): `curl -sS http://localhost:3000/api/lead`

Scheduled: `.github/workflows/chat-forward-resend.yml` every 6h + `workflow_dispatch`.
