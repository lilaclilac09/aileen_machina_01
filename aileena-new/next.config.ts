import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Home ~/pnpm-lock.yaml made Next pick the wrong workspace root, so
  // aileena-new/.env.local (COMPUTER_WORKER_URL) was ignored and the dock
  // stayed on local shim. Pin the app directory.
  outputFileTracingRoot: appRoot,
  // Dynamic fs in lib/computer + lib/inkling traces the whole app root.
  // Local Cafe recap takes (DJI .MP4) then get copied into .next/standalone
  // and fill the disk (ENOSPC) during `pnpm deploy:cf`.
  outputFileTracingExcludes: {
    "*": [
      "./scripts/video-edit/takes/**/*",
      "./scripts/video-edit/photos/**/*",
      "./scripts/video-edit/out/**/*",
      "./scripts/video-edit/work/**/*",
    ],
  },
  transpilePackages: ['three'],
  allowedDevOrigins: ['127.0.0.1'],
  turbopack: {
    root: appRoot,
  },
  webpack: (config) => {
    const appModules = path.join(appRoot, "node_modules");
    const current = config.resolve.modules ?? ["node_modules"];
    config.resolve.modules = [
      appModules,
      ...current.filter((entry: string) => entry !== appModules),
    ];
    return config;
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

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
