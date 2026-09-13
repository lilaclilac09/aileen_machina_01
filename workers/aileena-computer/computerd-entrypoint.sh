#!/bin/sh
# Same netns as the wrangler-dev sidecar. Pin the official egress hostname
# so POST /connect can dial computerd → computer.internal without TPROXY DNS.
if ! grep -q computer.internal /etc/hosts 2>/dev/null; then
  echo "11.0.0.1 computer.internal" >> /etc/hosts
fi
exec /usr/local/bin/computerd "$@"
