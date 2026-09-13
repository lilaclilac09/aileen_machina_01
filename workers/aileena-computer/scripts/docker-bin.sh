#!/usr/bin/env bash
# wrangler `docker pull`s the interceptor. Our image is local-only.
set -euo pipefail
REAL="${AILEENA_REAL_DOCKER:-/usr/bin/docker}"
if [[ "${1:-}" == "pull" ]]; then
  for arg in "$@"; do
    if [[ "$arg" == "aileena-redirect-proxy:local" || "$arg" == aileena-redirect-proxy:* ]]; then
      if "$REAL" image inspect "$arg" >/dev/null 2>&1; then
        echo "Using local $arg"
        exit 0
      fi
    fi
  done
fi
exec "$REAL" "$@"
