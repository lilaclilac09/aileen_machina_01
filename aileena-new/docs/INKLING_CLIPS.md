# Inkling long-form audio clip tool

Use [Thinking Machines Inkling](https://thinkingmachines.ai/news/introducing-inkling/) to listen to full podcast / interview episodes and pick clip boundaries, then render cuts with ffmpeg.

## Pipeline

1. **Download** — `yt-dlp` fetches YouTube video/audio
2. **WAV** — `ffmpeg` converts to 16 kHz mono WAV (Inkling-optimal)
3. **Batch** — long audio split into ~15 min segments with overlap
4. **Propose** — Inkling listens to each batch and returns clip candidates (JSON)
5. **Correct** — second pass on padded windows to fix start/end boundaries
6. **Render** — `ffmpeg` writes clips to `data/inkling-clips/<video-id>/clips/`

## Prerequisites

| Dependency | Purpose |
|------------|---------|
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | YouTube download |
| [ffmpeg](https://ffmpeg.org/) + ffprobe | Convert, split, render |
| `INKLING_API_KEY` or `TOGETHER_API_KEY` | Inkling inference (default: Together AI) |

Install on macOS (Homebrew):

```bash
brew install yt-dlp ffmpeg
```

## Environment

```bash
export TOGETHER_API_KEY="..."          # or INKLING_API_KEY
# optional overrides:
export INKLING_BASE_URL="https://api.together.xyz/v1"
export INKLING_MODEL="thinkingmachines/inkling"
export INKLING_REASONING_EFFORT="high"   # if your provider supports it
```

Other OpenAI-compatible providers (Baseten, custom) work via `INKLING_BASE_URL` + `INKLING_API_KEY`.

## Web UI (public)

Hub: **`/tools`** · page: **`/tools/inkling-clips`**.

**Launch mode (A + B3):** the public page is a **CLI command builder**. Browser Run is not enabled on Vercel (no `yt-dlp` / `ffmpeg` on serverless). Visitors copy a local command and run it on their machine.

API routes under `/api/tools/inkling-clips` remain in the repo for a future worker host; they are not the public path today.

Adding another tool: see **[TOOLS_ARCADE.md](./TOOLS_ARCADE.md)**.

## CLI (local / self-hosted)

From `aileena-new/`:

```bash
# Best 5 shareable moments (default)
pnpm inkling:clips -- 'https://www.youtube.com/watch?v=VIDEO_ID' --best 5

# Search for a topic / quote
pnpm inkling:clips -- 'https://youtu.be/VIDEO_ID' --query "mixture of experts"

# Preview candidates only (no render)
pnpm inkling:clips -- 'https://www.youtube.com/watch?v=VIDEO_ID' --dry-run

# Re-run propose/correct/render on an existing download
pnpm inkling:clips -- 'https://www.youtube.com/watch?v=VIDEO_ID' --skip-download --best 3

# Audio-only output (.m4a)
pnpm inkling:clips -- 'https://www.youtube.com/watch?v=VIDEO_ID' --audio-only
```

## Output layout

```
data/inkling-clips/<video-id>/
├── metadata.json      # title, url, download time
├── source.mp4         # downloaded media
├── audio.wav          # full 16 kHz mono WAV
├── batches/           # per-batch WAV + correction windows
├── candidates.json    # final corrected timestamps
└── clips/             # rendered mp4 or m4a files
```

`data/inkling-clips/` is gitignored (large media).

## Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--best [N]` | 5 | Pick top N moments |
| `--query "..."` | — | Topic / theme search mode |
| `--batch-seconds` | 900 | Batch length (≤ ~20 min recommended for Inkling) |
| `--overlap-seconds` | 30 | Overlap so boundary clips aren't lost |
| `--pad-seconds` | 20 | Padding around candidate for correction pass |
| `--dry-run` | off | Stop after `candidates.json` |
| `--skip-download` | off | Reuse existing work dir |
| `--audio-only` | off | Render `.m4a` instead of `.mp4` |
| `--work-dir PATH` | auto | Override output directory |

## E2E example

Short public video (~3 min) for a cheap smoke test:

```bash
cd aileena-new
export TOGETHER_API_KEY="your-key"
pnpm inkling:clips -- 'https://www.youtube.com/watch?v=jNQXAC9IVRw' --best 2 --dry-run
```

Inspect `data/inkling-clips/jNQXAC9IVRw/candidates.json`, then drop `--dry-run` to render clips.

Without an API key the CLI exits immediately after checking `yt-dlp`/`ffmpeg` (no download). Helper smoke (batch math + JSON parse, no network):

```bash
pnpm exec tsx scripts/smoke-inkling-helpers.ts
```

## Notes

- Inkling audio input: WAV 16 kHz; keep batches under ~20 minutes for best results.
- API costs scale with episode length (one propose call per batch + one correct call per final candidate).
- Correction pass reduces mid-word cuts but is not perfect — spot-check rendered clips.
