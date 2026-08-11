#!/usr/bin/env bash
# Local-only Cafe Cursor recap. Do NOT upload media.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VE="$ROOT/scripts/video-edit"
cd "$ROOT"

if ! command -v ffmpeg >/dev/null 2>&1 || ! command -v ffprobe >/dev/null 2>&1; then
  echo "Need ffmpeg + ffprobe on PATH."
  exit 1
fi

takes=$(find "$VE/takes" -type f ! -name '.gitkeep' \( -iname '*.mp4' -o -iname '*.mov' -o -iname '*.m4v' -o -iname '*.webm' -o -iname '*.mkv' \) 2>/dev/null | wc -l | tr -d ' ')
photos=$(find "$VE/photos" -type f ! -name '.gitkeep' \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.heic' -o -iname '*.heif' -o -iname '*.webp' \) 2>/dev/null | wc -l | tr -d ' ')

echo "takes: $takes  photos: $photos"
if [[ "$takes" -eq 0 && "$photos" -eq 0 ]]; then
  echo ""
  echo "No media. Import first:"
  echo "  bash scripts/video-edit/from-downloads.sh --go"
  echo "  (expects ~/Downloads/cursor_shanghai_07192026)"
  exit 2
fi

pnpm video:recap

OUT="$VE/out/cafe-cursor-shanghai-recap.mp4"
echo ""
echo "Done → $OUT"
if command -v open >/dev/null 2>&1; then
  open "$OUT" || true
  open "$VE/edit-room.html" || true
fi
