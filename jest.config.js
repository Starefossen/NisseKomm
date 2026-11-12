// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // agent worktrees live under .claude/ and must not be picked up as tests or modules
  modulePathIgnorePatterns: ["<rootDir>/.claude/"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jsdom",
  testTimeout: 15000,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^server-only$":
      "<rootDir>/node_modules/next/dist/compiled/server-only/empty.js",
  },
  testMatch: [
    "**/__tests__/**/*.test.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
  ],
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
    "!src/**/__tests__/**",
  ],
};

// Override next/jest's default transformIgnorePatterns so ESM packages in pnpm are transformed
module.exports = async () => {
  const config = await createJestConfig(customJestConfig)();
  config.transformIgnorePatterns = [
    "/node_modules/(?!\\.pnpm/|(nanoid|obug|jose)/)",
    "^.+\\.module\\.(css|sass|scss)$",
  ];
  config.testPathIgnorePatterns = [
    "<rootDir>/.claude/",
    ...(config.testPathIgnorePatterns || []),
  ];
  return config;
};
