#!/usr/bin/env bash
# Linux Docker Engine helpers for wrangler-dev Workers Containers.
# Docker Desktop already has host.docker.internal. Production Cloudflare
# Containers do not use this sidecar.
set -euo pipefail

if ! command -v docker >/dev/null; then
  echo "docker is not installed" >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "docker daemon is not running" >&2
  exit 1
fi

gw="$(ip -4 addr show docker0 2>/dev/null | awk '/inet / {print $2}' | cut -d/ -f1 || true)"
if [[ -z "${gw}" ]]; then
  gw=172.17.0.1
fi

if ! grep -q host.docker.internal /etc/hosts; then
  echo "${gw} host.docker.internal" | sudo tee -a /etc/hosts >/dev/null
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
sudo -n "$ROOT/scripts/host-egress-dnat.sh"
docker build -t aileena-redirect-proxy:local -f "$ROOT/sidecar/Dockerfile" "$ROOT/sidecar"
echo "redirect sidecar + host DNAT ready. MINIFLARE_CONTAINER_EGRESS_IMAGE=aileena-redirect-proxy:local pnpm dev"
