import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ["@prisma/client", "prisma"],

  // Digital Asset Links has to be served from the domain root at exactly
  // /.well-known/assetlinks.json. A route handler can't live at that path —
  // Next skips app/ directories whose names begin with a dot — so the public
  // path is rewritten onto a normal route instead.
  async rewrites() {
    return [
      {
        source: "/.well-known/assetlinks.json",
        destination: "/api/assetlinks",
      },
    ];
  },
};

export default nextConfig;
