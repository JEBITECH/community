import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Produces a minimal, self-contained server bundle under .next/standalone
  // so the production Docker image stays small and doesn't need the full
  // node_modules tree at runtime.
  output: "standalone",
  // The community website talks to the same gateway as the admin client.
  // In dev we proxy /api/* to the gateway so the browser can use same-origin URLs.
  async rewrites() {
    const gateway = process.env.GATEWAY_URL || "http://localhost:4000";
    return [
      {
        source: "/api/:path*",
        destination: `${gateway}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
