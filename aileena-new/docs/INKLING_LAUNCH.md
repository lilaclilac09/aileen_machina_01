# Audio Clipping — launch checklist (what you still do)

Code for the pipeline + web Run UI is in the repo. **Vercel alone cannot execute clips** (no `yt-dlp` / `ffmpeg`). Pick one path below.

## Path A — CLI on your laptop (fastest smoke)

1. Get a key: https://api.together.xyz/settings/api-keys  
2. Install: `brew install yt-dlp ffmpeg`  
3. From `aileena-new/`:

```bash
export TOGETHER_API_KEY="…"
pnpm inkling:clips -- 'https://www.youtube.com/watch?v=SHORT_ID' --best 2 --dry-run
```

4. Inspect `data/inkling-clips/<id>/candidates.json`

## Path B — Browser Run on a real host (Docker)

1. Same Together key as above  
2. On a machine with Docker:

```bash
cd aileena-new
export TOGETHER_API_KEY="…"
# optional but recommended if you already use Upstash:
# export UPSTASH_REDIS_REST_URL=…
# export UPSTASH_REDIS_REST_TOKEN=…
docker compose -f docker-compose.inkling.yml up --build
```

3. Open `http://localhost:3000/tools/inkling-clips`  
4. Status banner should say **host is ready** → paste URL → **Run**

Deploy the same image to Railway / Fly / any VPS, then point a subdomain (e.g. `clips.aileena.xyz`) at it — or run the whole site from that host instead of Vercel for Tools.

## Path C — Keep Vercel for the marketing site only

- `aileena.xyz` stays on Vercel (hub + CLI copy still useful)  
- Clipping Run lives on the Docker host from Path B  

## Status API

`GET /api/tools/inkling-clips/status` reports:

- `media.ok` — yt-dlp + ffmpeg + ffprobe on PATH  
- `api.ok` — `TOGETHER_API_KEY` or `INKLING_API_KEY` set  
- `ready` — both true → Browser Run enabled in the UI  

## What you still need to do (minimum)

| # | You | Notes |
|---|-----|--------|
| 1 | Create **Together API key** | Required for Inkling |
| 2 | Choose **Path A or B** | A = laptop CLI; B = Docker Browser Run |
| 3 | (B only) Deploy Docker somewhere | Not Vercel serverless |
| 4 | (optional) Upstash Redis | Survives restarts / multi-instance |

You do **not** need a separate `INKLING_API_KEY` if you already set `TOGETHER_API_KEY`.
