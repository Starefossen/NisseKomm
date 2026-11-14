import type { NextConfig } from "next";

const NAVN = /kristian|håkon|hanna|landås/i;

const nextConfig: NextConfig = {
  // AGENTS.md is maintained by hand; stop next dev from appending its own block
  agentRules: false,
  reactCompiler: true,
  output: "standalone",
  poweredByHeader: false,
  // Browser bundles name nobody: see scripts/navn-loader.cjs.
  turbopack: {
    rules: Object.fromEntries(
      ["ts", "tsx", "json"].map((ext) => [
        `*.${ext}`,
        {
          condition: {
            all: ["browser", { content: NAVN }],
          },
          loaders: [require.resolve("./scripts/navn-loader.cjs")],
          as: `*.${ext}`,
        },
      ]),
    ),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Symbol scanner needs getUserMedia; default policy would deny camera
          { key: "Permissions-Policy", value: "camera=(self)" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=15552000; includeSubDomains",
          },
          { key: "X-Frame-Options", value: "DENY" },
          // ponytail: frame-ancestors only; a full CSP needs the inline styles and WebGL audited
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          {
            // ponytail: report-only, read in the console; enforce once clean.
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'" +
                (process.env.NODE_ENV === "development"
                  ? " 'unsafe-eval'"
                  : ""),
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "media-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'" +
                (process.env.NODE_ENV === "development" ? " ws: wss:" : ""),
              "worker-src 'self' blob:",
              "manifest-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
