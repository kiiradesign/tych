import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["dialkit", "morphicons", "lucide", "@lisse/react", "@lisse/core", "heic-to"],
  experimental: {
    optimizePackageImports: ["lucide"],
  },
  async headers() {
    return [
      {
        source: "/placeholders/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=2592000",
          },
        ],
      },
      {
        source: "/tych-opengraph.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
