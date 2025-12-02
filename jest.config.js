// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@vercel/analytics$": "<rootDir>/src/lib/__mocks__/@vercel/analytics.ts",
    "^uuid$": "<rootDir>/src/lib/__mocks__/uuid.ts",
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
  // Transform ES modules from Sanity and its dependencies
  // Note: Pattern must handle pnpm's nested .pnpm structure
  transformIgnorePatterns: [
    "/node_modules/(?!(.pnpm/(nanoid|@sanity|uuid|get-random-values)|nanoid|@sanity|uuid|get-random-values)/)",
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
