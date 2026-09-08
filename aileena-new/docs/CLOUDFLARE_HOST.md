# Cloudflare: R2 backup vs Workers hosting

These are two different jobs. Do not mix them.

## 1. Source backup (done)

Bucket `aileena09062026` already holds git source tars plus the old April zip.
rclone listing is the proof. **Do not run `pnpm deploy:cf` to fill this bucket.**
That command deploys a Worker; it never writes the backup bucket.

R2 keys in rclone (`cloudflare_r2:`) are enough. `npx wrangler login` is not
required for backup.

Keep Public Access **Disabled**. The zip may contain `.env`.

Live site stays **Vercel** (`https://www.aileena.xyz`). Do not point DNS at R2.

## 2. Optional Workers hosting (not required for backup)

Only if you actually want a `*.workers.dev` preview of the Next app.

`npx wrangler login` must finish in the browser. A timeout means you are **not**
logged in. Do not proceed to `pnpm deploy:cf` until login prints success.

Local Cafe recap media under `scripts/video-edit/takes/` must not be traced into
`.next/standalone` (that caused `ENOSPC` on the Mac). This branch excludes those
paths in `next.config.ts`. Pull before any retry.

If a previous attempt filled the disk:

```
cd /Users/aileen/aileen_machina_01/aileena-new
rm -rf .next .open-next
git fetch origin
git pull --ff-only
df -h /
```

Then, only for Workers (no `#` comments):

```
cd /Users/aileen/aileen_machina_01
git checkout cursor/cloudflare-host-aileena-xyz-e9d8
git pull --ff-only
cd aileena-new
npx wrangler login
pnpm deploy:cf
```

Copy production secrets into the Worker only after a workers.dev URL exists.
Do not attach bucket `aileena09062026` as the site origin.

## DNS last

Only after a Workers URL serves the white Machina homepage:

1. Cloudflare: custom domain on Worker `aileena-xyz`
2. DNSPod: change the Vercel CNAME (not R2, not the zip)
3. Keep Vercel as rollback for 48h

DNSPod is Tencent DNS for the live site. Do not cancel it.
Tencent COS (object storage) is not used for this backup; R2 replaced that job.
