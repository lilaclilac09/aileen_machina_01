#!/usr/bin/env bash
# Sidecar CONNECTs to the docker gateway. workerd listens on 127.0.0.1.
# DNAT only docker0 → gateway high ports. Do not DNAT all TCP (breaks apk).
set -euo pipefail
GW="$(ip -4 addr show docker0 2>/dev/null | awk '/inet / {print $2}' | cut -d/ -f1 || true)"
GW="${GW:-172.17.0.1}"
sysctl -w net.ipv4.conf.all.route_localnet=1 >/dev/null
sysctl -w net.ipv4.conf.docker0.route_localnet=1 >/dev/null || true
if ! iptables -t nat -C PREROUTING -i docker0 -p tcp -d "$GW" --dport 1024:65535 -j DNAT --to-destination 127.0.0.1 2>/dev/null; then
  iptables -t nat -A PREROUTING -i docker0 -p tcp -d "$GW" --dport 1024:65535 -j DNAT --to-destination 127.0.0.1
fi
echo "host egress DNAT docker0 → 127.0.0.1 for ${GW}:1024-65535"
