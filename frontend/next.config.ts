import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
    // Ad photos and receipts are served from Firebase Storage. next/image is
    // used with `unoptimized`, but declaring the hosts keeps it from
    // rejecting the remote src.
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "**.firebasestorage.app" },
    ],
  },
};

export default nextConfig;
