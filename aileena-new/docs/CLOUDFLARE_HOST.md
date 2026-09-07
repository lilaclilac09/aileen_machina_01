# Cloudflare Workers hosting for aileena.xyz

Live site today is still **Vercel**. Do not change DNS until a Workers URL serves the white Machina homepage.

## Why this is not instant

- App is Next 16 App Router (chat, Resend, Stripe, computer proxy). Cloudflare needs `@opennextjs/cloudflare`, not “upload a zip to R2”.
- OpenNext 1.20 requires **Next >= 16.3.3** (we were on 16.1.7).
- OpenNext does **not** support `export const runtime = "edge"`. Those routes run as Node compat on the Worker instead.
- This agent has **no** `wrangler login`. Deploy must happen on your Mac.

## Deploy preview (Mac, after wrangler login)

```bash
cd /Users/aileen/aileen_machina_01
git fetch origin
git checkout cursor/cloudflare-host-aileena-xyz-e9d8
git pull --ff-only
cd aileena-new
cp .dev.vars.example .dev.vars
pnpm install
npx wrangler login
pnpm deploy:cf
```

Copy production secrets into the Worker (same names as Vercel): `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `CONTACT_TO`, `CHAT_QUOTA_SECRET`, plus any others you use.

## DNS last

Only after the Workers URL looks right:

1. In Cloudflare: add custom domain `www.aileena.xyz` / `aileena.xyz` to Worker `aileena-xyz`
2. At DNSPod, point the current Vercel CNAME to Cloudflare (not R2, not the 300MB zip)
3. Keep Vercel project as rollback for 48h

Do not attach the backup bucket `aileena09062026` as the site origin.
