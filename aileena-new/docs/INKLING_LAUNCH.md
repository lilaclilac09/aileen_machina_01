# AGENTS.md
- Do not preserve backward compatibility. Remove obsolete paths instead of adding compatibility layers, fallbacks, or migrations.
- Choose the simplest implementation that fully meets the current requirements. Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to end, and add each new capability on top of a product that already works. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall complexity or improve reliability. Do not reimplement common functionality without a clear reason.
- Lean on the dependencies already in the project before writing your own implementation or adding packages. Do not assume a library lacks a capability without checking its documentation and types.
- Make architectural decisions for the long term. Do not accept a stopgap that only works for now and is meant to be replaced later.
- Study how established products solve the problem before designing a solution. Adopt their proven patterns and conventions rather than inventing an approach from scratch.

# Audio Clipping — launch checklist

**Product:** `/audio-clipping` · **Runner:** `/tools/inkling-clips`

Vercel marketing site **cannot** run clips (no `yt-dlp` / `ffmpeg`). You need a **container** (or a laptop with those binaries).

## Wire Fly → aileena.xyz Tools page

Fly alone is **not** your Vercel tools page. Architecture:

| Host | Role |
|------|------|
| **Vercel** `aileena.xyz` | Product `/audio-clipping` + Tools UI `/tools/inkling-clips` |
| **Fly** `*.fly.dev` | Actual Run (yt-dlp + ffmpeg) |

After `fly deploy` succeeds:

1. Note the URL, e.g. `https://aileena-clips.fly.dev`
2. Vercel → Project → Settings → Environment Variables → Production:
   - `NEXT_PUBLIC_CLIPS_API_BASE` = `https://aileena-clips.fly.dev` (no trailing slash)
3. Merge PR `#283` to `main` (so the wiring code + product page ship)
4. Redeploy Vercel

Then open `https://aileena.xyz/tools/inkling-clips` — Run talks to Fly; banner shows remote worker.

## If Mac disk is full (recommended)

Do **not** `brew install` and do **not** `docker build` on the Mac (images are large). Deploy the existing Dockerfile to the cloud — build runs there.

### Fly.io

```bash
cd aileena-new
# install flyctl once from https://fly.io/docs/hands-on/install-flyctl/
fly launch --config fly.inkling.toml --no-deploy
fly deploy --config fly.inkling.toml
```

Open `https://<app>.fly.dev/audio-clipping` → **Open runner**.  
No API key → free local mode. Optional later: `fly secrets set TOGETHER_API_KEY=…`

### Railway / any Docker host

Point the service at `Dockerfile.inkling` in `aileena-new/`. Same story: free without key.

## Path A — laptop CLI (needs free disk + brew)

Only if you have space:

```bash
brew install yt-dlp ffmpeg
cd aileena-new
pnpm inkling:clips -- 'https://www.youtube.com/watch?v=jNQXAC9IVRw' --local --best 2 --dry-run
```

## Path B — Docker on a machine that has disk

```bash
cd aileena-new
docker compose -f docker-compose.inkling.yml up --build
# http://localhost:3000/audio-clipping
```

No `TOGETHER_API_KEY` needed for free local.

### Slim CLI-only image (no Next build)

```bash
docker build -f Dockerfile.inkling.cli -t aileena-clips-cli .
docker run --rm -v "$PWD/out:/out" aileena-clips-cli \
  -- 'https://www.youtube.com/watch?v=jNQXAC9IVRw' --local --best 2 --dry-run --work-dir /out/job1
```

## Path C — Vercel stays marketing-only

- `aileena.xyz` on Vercel (product page + CLI copy)
- Clipping Run on Fly/Railway container

## Status API

`GET /api/tools/inkling-clips/status`:

| Field | Meaning |
|-------|---------|
| `media.ok` | yt-dlp + ffmpeg + ffprobe |
| `api.ok` | Together/Inkling key present |
| `engine` | `local` or `inkling` |
| `ready` | `media.ok` → Browser Run on |

## Checklist

| # | You | Notes |
|---|-----|--------|
| 1 | Deploy **Dockerfile.inkling** to Fly/Railway | Best when Mac disk is full |
| 2 | Or Docker compose on a VPS / free-disk laptop | Same image |
| 3 | Skip Together key for free local | Inkling optional later |
| 4 | Optional Upstash Redis | Multi-instance / restarts |
