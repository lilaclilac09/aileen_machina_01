# Audio Clipping — launch checklist (what you still do)

Code for the pipeline + web Run UI is in the repo. **Vercel alone cannot execute clips** (no `yt-dlp` / `ffmpeg`). Pick one path below.

## Free path (no Together credits)

Without `TOGETHER_API_KEY` / `INKLING_API_KEY`, the tool uses **free local mode**: ffmpeg `silencedetect` → speech islands → top N clips. Quality is coarser than Inkling (may cut mid-sentence). Still needs **yt-dlp + ffmpeg** on the machine.

```bash
# no API key needed
pnpm inkling:clips -- 'https://www.youtube.com/watch?v=SHORT_ID' --local --best 2 --dry-run
```

Auto mode does the same when no key is set (`--local` is optional).

## Path A — CLI on your laptop (fastest smoke)

1. Install: `brew install yt-dlp ffmpeg`  
2. From `aileena-new/`:

```bash
# free local
pnpm inkling:clips -- 'https://www.youtube.com/watch?v=SHORT_ID' --local --best 2 --dry-run

# optional Inkling (paid)
export TOGETHER_API_KEY="…"
pnpm inkling:clips -- 'https://www.youtube.com/watch?v=SHORT_ID' --best 2 --dry-run
```

3. Inspect `data/inkling-clips/<id>/candidates.json`

## Path B — Browser Run on a real host (Docker)

1. On a machine with Docker (API key optional — without it, Run uses free local):

```bash
cd aileena-new
# optional for Inkling:
# export TOGETHER_API_KEY="…"
# optional but recommended if you already use Upstash:
# export UPSTASH_REDIS_REST_URL=…
# export UPSTASH_REDIS_REST_TOKEN=…
docker compose -f docker-compose.inkling.yml up --build
```

2. Open `http://localhost:3000/tools/inkling-clips`  
3. Status banner: **host is ready** (local or Inkling) → paste URL → **Run**

Deploy the same image to Railway / Fly / any VPS, then point a subdomain (e.g. `clips.aileena.xyz`) at it — or run the whole site from that host instead of Vercel for Tools.

## Path C — Keep Vercel for the marketing site only

- `aileena.xyz` stays on Vercel (hub + CLI copy still useful)  
- Clipping Run lives on the Docker host from Path B  

## Status API

`GET /api/tools/inkling-clips/status` reports:

- `media.ok` — yt-dlp + ffmpeg + ffprobe on PATH  
- `api.ok` — `TOGETHER_API_KEY` or `INKLING_API_KEY` set  
- `engine` — `inkling` if keyed, else `local`  
- `ready` — `media.ok` → Browser Run enabled (local or Inkling)

## What you still need to do (minimum)

| # | You | Notes |
|---|-----|--------|
| 1 | Install **yt-dlp + ffmpeg** (or Docker) | Required for any Run |
| 2 | Choose **Path A or B** | A = laptop CLI; B = Docker Browser Run |
| 3 | (optional) Together API key | Only for Inkling quality |
| 4 | (B only) Deploy Docker somewhere | Not Vercel serverless |
| 5 | (optional) Upstash Redis | Survives restarts / multi-instance |

You do **not** need a separate `INKLING_API_KEY` if you already set `TOGETHER_API_KEY`.
