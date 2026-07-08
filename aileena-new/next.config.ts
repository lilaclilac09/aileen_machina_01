import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Move the Next.js dev indicator out of the bottom-left so it doesn't sit
  // on top of the AgentChat launcher portrait while developing. Production
  // builds never show this indicator regardless.
  devIndicators: {
    position: 'bottom-right',
  },
  async redirects() {
    return [
      { source: '/dj-set', destination: '/sound#dj-set', permanent: true },
      { source: '/dj-set/', destination: '/sound#dj-set', permanent: true },
    ];
  },
};

export default nextConfig;
