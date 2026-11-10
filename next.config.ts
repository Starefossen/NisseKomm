import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AGENTS.md is maintained by hand; stop next dev from appending its own block
  agentRules: false,
  reactCompiler: true,
};

export default nextConfig;
