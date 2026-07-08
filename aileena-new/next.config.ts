import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Move the Next.js dev indicator out of the bottom-left so it doesn't sit
  // on top of the AgentChat launcher portrait while developing. Production
  // builds never show this indicator regardless.
  devIndicators: {
    position: 'bottom-right',
  },
  // Next App Router does not serve public/*/index.html at the directory URL.
  async rewrites() {
    return [
      { source: '/dj-set', destination: '/dj-set/index.html' },
      { source: '/dj-set/', destination: '/dj-set/index.html' },
    ];
  },
};

export default nextConfig;
