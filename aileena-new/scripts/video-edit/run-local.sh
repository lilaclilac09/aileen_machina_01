#!/usr/bin/env bash
# Local-only Cafe Cursor recap. Do NOT upload media — drop into takes/ + photos/.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VE="$ROOT/scripts/video-edit"
cd "$ROOT"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found. Install (brew install ffmpeg) or add static binary to PATH."
  exit 1
fi

takes=$(find "$VE/takes" -type f \( -iname '*.mp4' -o -iname '*.mov' -o -iname '*.m4v' \) 2>/dev/null | wc -l | tr -d ' ')
photos=$(find "$VE/photos" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.heic' -o -iname '*.webp' \) 2>/dev/null | wc -l | tr -d ' ')

echo "takes: $takes  photos: $photos"
if [[ "$takes" -eq 0 && "$photos" -eq 0 ]]; then
  echo ""
  echo "No media yet. On your Mac (no upload):"
  echo "  cp ~/path/to/videos/*  $VE/takes/"
  echo "  cp ~/path/to/photos/*  $VE/photos/"
  echo "Then re-run: bash scripts/video-edit/run-local.sh"
  exit 2
fi

pnpm video:inventory
pnpm video:render

OUT="$VE/out/cafe-cursor-shanghai-recap.mp4"
echo ""
echo "Done → $OUT"
if command -v open >/dev/null 2>&1; then
  open "$OUT" || true
  open "$VE/edit-room.html" || true
fi
