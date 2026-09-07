import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Home ~/pnpm-lock.yaml (or any parent lockfile) makes Next infer the
  // workspace as ~. Webpack then resolves CSS `@import "tailwindcss"` from
  // /Users/<you> instead of aileena-new, and .env.local is ignored.
  // Pin both roots. NEXT_TURBOPACK=0 is not a Next flag — use --webpack.
  outputFileTracingRoot: appRoot,
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
