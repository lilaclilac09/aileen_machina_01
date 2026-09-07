#!/usr/bin/env bash
# Copy git source (not the 300MB zip) to rclone remotes.
# Does not change DNS, Vercel, or delete aileena-new_rename.zip.
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel)
SHA=$(git -C "$ROOT" rev-parse --short HEAD)
FILE="aileena-new-${SHA}.tar.gz"
TAR="/tmp/$FILE"

git -C "$ROOT" archive --format=tar.gz --prefix=aileena-new/ -o "$TAR" HEAD:aileena-new
echo "packed $TAR"
ls -lh "$TAR"

put() {
  local dest="$1"
  echo "rclone copyto -> $dest"
  rclone copyto "$TAR" "$dest"
  rclone ls "$dest"
}

if ! command -v rclone >/dev/null 2>&1; then
  echo "rclone missing on this machine. On the Mac:"
  echo "  rclone copyto $TAR cloudflare_r2:aileena09062026/backups/$FILE"
  echo "  rclone copyto $TAR tencent_cos:aileena09062026/backups/$FILE"
  echo "live site stays https://www.aileena.xyz (Vercel)"
  exit 0
fi

echo "remotes:"
rclone listremotes

R2_OK=0
if rclone lsf "cloudflare_r2:aileena09062026/" >/dev/null 2>&1; then
  put "cloudflare_r2:aileena09062026/backups/$FILE"
  R2_OK=1
elif rclone lsf "cloudflare_r2:" >/dev/null 2>&1; then
  put "cloudflare_r2:backups/$FILE"
  R2_OK=1
fi

COS_OK=0
if rclone lsf "tencent_cos:aileena09062026/" >/dev/null 2>&1; then
  put "tencent_cos:aileena09062026/backups/$FILE" || true
  COS_OK=1
elif rclone lsf "tencent_cos:" >/dev/null 2>&1; then
  put "tencent_cos:backups/$FILE" || true
  COS_OK=1
fi

if [ "$R2_OK" -eq 0 ] && [ "$COS_OK" -eq 0 ]; then
  echo "no usable rclone path. check: rclone lsf cloudflare_r2: && rclone lsf tencent_cos:"
  exit 1
fi

echo "ok. did not delete aileena-new_rename.zip"
echo "live site still Vercel https://www.aileena.xyz"
