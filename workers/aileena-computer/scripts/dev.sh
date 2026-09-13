#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export DOCKER_HOST="${DOCKER_HOST:-unix:///var/run/docker.sock}"
export MINIFLARE_CONTAINER_EGRESS_IMAGE="aileena-redirect-proxy:local"
export WRANGLER_DOCKER_BIN="$ROOT/scripts/docker-bin.sh"
chmod +x "$WRANGLER_DOCKER_BIN" "$ROOT/scripts/host-egress-dnat.sh"
if ! sudo -n "$ROOT/scripts/host-egress-dnat.sh"; then
  echo "host egress DNAT needs sudo" >&2
  exit 1
fi
docker build -t aileena-redirect-proxy:local -f "$ROOT/sidecar/Dockerfile" "$ROOT/sidecar"
cd "$ROOT"
exec wrangler dev --port 8787
