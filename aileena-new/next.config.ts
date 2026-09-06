import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Home ~/pnpm-lock.yaml made Next pick the wrong workspace root, so
  // aileena-new/.env.local (COMPUTER_WORKER_URL) was ignored and the dock
  // stayed on local shim. Pin the app directory.
  turbopack: {
    root: appRoot,
  },
  // Move the Next.js dev indicator out of the bottom-left so it doesn't sit
  // on top of the AgentChat launcher portrait while developing. Production
  // builds never show this indicator regardless.
  devIndicators: {
    position: "bottom-right",
  },
  async redirects() {
    return [
      { source: "/dj-set", destination: "/sound#dj-set", permanent: true },
      { source: "/dj-set/", destination: "/sound#dj-set", permanent: true },
    ];
  },
};

export default nextConfig;
