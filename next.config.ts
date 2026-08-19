import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["dialkit", "morphicons", "lucide"],
  experimental: {
    optimizePackageImports: ["lucide"],
  },
};

export default nextConfig;
