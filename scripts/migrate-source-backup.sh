#!/usr/bin/env bash
# Copy git source (not the 300MB zip) to Cloudflare R2 via rclone.
# R2 list works; S3 CreateBucket does not — use --s3-no-check-bucket and rclone copy.
# Does not change DNS, Vercel, or delete aileena-new_rename.zip.
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel)
SHA=$(git -C "$ROOT" rev-parse --short HEAD)
FILE="aileena-new-${SHA}.tar.gz"
TAR="/tmp/$FILE"
BUCKET="${AILEENA_R2_BUCKET:-aileena09062026}"
REMOTE="${AILEENA_R2_REMOTE:-cloudflare_r2}"

git -C "$ROOT" archive --format=tar.gz --prefix=aileena-new/ -o "$TAR" HEAD:aileena-new
echo "packed $TAR"
ls -lh "$TAR"

upload() {
  local dir="$1"
  echo "rclone copy -> $dir"
  rclone copy "$TAR" "$dir" --s3-no-check-bucket --retries 3
  echo "listing $dir"
  rclone lsl "$dir"
  rclone lsl "$dir" | grep -F "$FILE"
}

if ! command -v rclone >/dev/null 2>&1; then
  echo "rclone missing. On the Mac:"
  echo "  rclone copy $TAR ${REMOTE}:${BUCKET}/backups/ --s3-no-check-bucket"
  echo "  rclone lsl ${REMOTE}:${BUCKET}/backups"
  exit 0
fi

echo "remotes:"
rclone listremotes

R2_OK=0
if upload "${REMOTE}:${BUCKET}/backups"; then
  R2_OK=1
elif upload "${REMOTE}:${BUCKET}"; then
  echo "uploaded at bucket root"
  R2_OK=1
fi

if [ "$R2_OK" -eq 0 ]; then
  echo "FAIL: R2 still has no $FILE"
  echo "manual:"
  echo "  rclone copy $TAR ${REMOTE}:${BUCKET}/backups/ --s3-no-check-bucket"
  echo "  rclone lsl ${REMOTE}:${BUCKET}"
  echo "  rclone lsl ${REMOTE}:${BUCKET}/backups"
  exit 1
fi

echo "OK: $FILE is in R2. aileena-new_rename.zip left in place."
echo "live site still Vercel https://www.aileena.xyz"
