# Gather · 共影

Shared event photo album for `album.aileena.xyz`.

Product design: [`docs/PRODUCT.md`](docs/PRODUCT.md)

## Features

- Create album (no signup) → URL + QR + admin secret
- Anyone uploads (≤500 photos / 30 days)
- Like, comment, pin cycle: **开头 → 中心 → 取消**
- Multi-select delete (admin)
- Storage: `local` | `blob` | `r2` | **`dual`** (R2 intl + 阿里云 OSS CN)

## Dev

```bash
cd album
cp .env.example .env
npm install
npx prisma db push
npm run dev   # http://localhost:3010
```

## Dual CDN (CN + intl)

Set:

```bash
STORAGE_DRIVER=dual
# R2_* …
# OSS_* …
```

Uploads write to both buckets. `GET /api/albums/:slug` picks OSS URLs when
`x-vercel-ip-country=CN` (or `x-gather-region: cn`).

## Production (Vercel)

1. New project, **Root Directory** = `album`
2. Env: `DATABASE_URL` (Postgres — change Prisma `provider` to `postgresql`),
   `ADMIN_COOKIE_SECRET`, `STORAGE_DRIVER=dual` (+ R2/OSS) or `blob`,
   `NEXT_PUBLIC_APP_URL=https://album.aileena.xyz`
3. DNSPod: `album` CNAME → `cname.vercel-dns.com`
