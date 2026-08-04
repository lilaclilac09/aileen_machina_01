# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

# Gather · 共影

Shared event photo album for `album.aileena.xyz`.

Product design: [`docs/PRODUCT.md`](docs/PRODUCT.md)

## Features

- Create album (no signup) → URL + QR + admin secret
- Anyone uploads (≤500 photos); 30-day window renews on every upload, then auto-deletes
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

完整点击步骤见 **[DEPLOY.md](DEPLOY.md)**（Neon + Vercel Blob + DNSPod CNAME）。

简版：

1. New project, **Root Directory** = `album`
2. Env: `DATABASE_URL` (Postgres), `ADMIN_COOKIE_SECRET`, `STORAGE_DRIVER=blob`, `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_APP_URL=https://album.aileena.xyz`
3. DNSPod: `album` CNAME → `cname.vercel-dns.com`
4. Build auto-switches Prisma to postgresql when `DATABASE_URL` is postgres
