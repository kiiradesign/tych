import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["dialkit", "morphicons", "lucide", "@lisse/react", "@lisse/core", "heic-to"],
  experimental: {
    optimizePackageImports: ["lucide"],
  },
};

export default nextConfig;
