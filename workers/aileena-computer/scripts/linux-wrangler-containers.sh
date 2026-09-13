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

if ! iptables -t mangle -A PREROUTING -p tcp -j TPROXY --tproxy-mark 0x1/0x1 --on-port 9 2>/dev/null; then
  echo "BLOCKED: this kernel cannot TPROXY (xt_TPROXY / xt_socket)."
  echo "proxy-everything will die; demo container cannot finish /ws locally."
  echo "Use Docker Desktop or deploy the Worker to Workers Containers."
  exit 2
fi
iptables -t mangle -D PREROUTING -p tcp -j TPROXY --tproxy-mark 0x1/0x1 --on-port 9 2>/dev/null || true
echo "TPROXY ok. wrangler dev containers can start the egress sidecar."
