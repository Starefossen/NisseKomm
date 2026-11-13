import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Disable false positive for already-escaped quotes in JSX
      "react/no-unescaped-entities": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // agent worktrees under .claude/ are separate checkouts
    ".claude/**",
    // agents' scratch folders and worktrees inside the checkout
    ".tmp/**",
    ".tmp-*/**",
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "next-env.d.ts",
    // Generated files:
    "coverage/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
