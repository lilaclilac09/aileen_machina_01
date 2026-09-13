#!/usr/bin/env bash
# workerd already binds the docker0 gateway (172.17.0.1). A DNAT to 127.0.0.1
# breaks sidecar CONNECT. Remove that rule if a previous run added it.
set -euo pipefail
GW="$(ip -4 addr show docker0 2>/dev/null | awk '/inet / {print $2}' | cut -d/ -f1 || true)"
GW="${GW:-172.17.0.1}"
while iptables -t nat -C PREROUTING -i docker0 -p tcp -d "$GW" --dport 1024:65535 -j DNAT --to-destination 127.0.0.1 2>/dev/null; do
  iptables -t nat -D PREROUTING -i docker0 -p tcp -d "$GW" --dport 1024:65535 -j DNAT --to-destination 127.0.0.1
done
echo "host: workerd listens on ${GW}; no docker0 DNAT"
