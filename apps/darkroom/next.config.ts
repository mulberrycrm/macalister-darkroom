import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@crm/ui", "@crm/shared", "@crm/database"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
