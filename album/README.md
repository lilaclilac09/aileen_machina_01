# Gather · 共影

Shared event photo album for `album.aileena.xyz`.

Product design: [`docs/PRODUCT.md`](docs/PRODUCT.md)

## MVP features

- Create album (no signup) → URL + QR + admin secret
- Anyone uploads (≤500 photos / 30 days)
- Like, comment, pin-to-front, multi-select delete
- Local / Vercel Blob storage adapters

## Dev

```bash
cd album
cp .env.example .env
npm install
npx prisma db push
npm run dev   # http://localhost:3010
```

## Production (Vercel)

1. New project, **Root Directory** = `album`
2. Env:
   - `DATABASE_URL` — Postgres (change Prisma `provider` to `postgresql`)
   - `ADMIN_COOKIE_SECRET`
   - `STORAGE_DRIVER=blob` + `BLOB_READ_WRITE_TOKEN`
   - `NEXT_PUBLIC_APP_URL=https://album.aileena.xyz`
3. DNSPod: `album` CNAME → `cname.vercel-dns.com`

### Switch SQLite → Postgres

In `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then `npx prisma db push`.

## Phase 2 (not in MVP)

- Dual CDN: Cloudflare R2 + 阿里云 OSS for CN speed
- ZIP download, paid extend, album password
