import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    // Local /uploads/ folder is served as static asset — next/image handles it natively.
    // No extra config needed for paths starting with /uploads/.
  },
};

export default nextConfig;
