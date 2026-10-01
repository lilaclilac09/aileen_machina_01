#!/bin/sh
set -eu
cd "$(dirname "$0")"
if [ ! -f .env ]; then
  cp .env.example .env
fi
if ! grep -q '^GATEWAY_BOOTSTRAP_KEY=' .env; then
  old=$(grep '^GATEWAY_API_KEY=' .env | head -1 | cut -d= -f2- || true)
  printf 'GATEWAY_BOOTSTRAP_KEY=%s\n' "$old" >> .env
fi
current=$(grep '^GATEWAY_BOOTSTRAP_KEY=' .env | head -1 | cut -d= -f2- || true)
fresh=0
if [ -z "$current" ] || [ "$current" = "sk-gateway-change-me" ]; then
  key="sk-gw-$(uuidgen | tr -d -)$(uuidgen | tr -d -)"
  sed -i.bak "s/^GATEWAY_BOOTSTRAP_KEY=.*/GATEWAY_BOOTSTRAP_KEY=${key}/" .env && rm -f .env.bak
  fresh=1
else
  key=$current
fi
token=$(grep '^DASHBOARD_TOKEN=' .env | head -1 | cut -d= -f2- || true)
if [ -z "$token" ]; then
  token="dash-$(uuidgen | tr -d -)"
  if grep -q '^DASHBOARD_TOKEN=' .env; then
    sed -i.bak "s/^DASHBOARD_TOKEN=.*/DASHBOARD_TOKEN=${token}/" .env && rm -f .env.bak
  else
    printf 'DASHBOARD_TOKEN=%s\n' "$token" >> .env
  fi
  fresh=1
fi
if [ "$fresh" = 1 ]; then
  echo "dashboard: http://127.0.0.1:${PORT:-8787}/?token=${token}"
  echo "agent:"
  echo "  OPENAI_BASE_URL=http://127.0.0.1:${PORT:-8787}/v1"
  echo "  OPENAI_API_KEY=${key}"
fi
cargo build --release
set -a
. ./.env
set +a
echo "health: curl -s http://127.0.0.1:${PORT:-8787}/health"
exec ./target/release/agent-gateway
