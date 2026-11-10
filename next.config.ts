import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AGENTS.md is maintained by hand; stop next dev from appending its own block
  agentRules: false,
  reactCompiler: true,
  output: "standalone",
  async headers() {
    return [
      {
        source: "/api/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },
};

export default nextConfig;
