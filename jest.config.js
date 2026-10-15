// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  globalTeardown: "<rootDir>/jest.globalTeardown.ts",
  testEnvironment: "jsdom",
  testTimeout: 15000,
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
};

// Override next/jest's default transformIgnorePatterns so ESM packages in pnpm are transformed
module.exports = async () => {
  const config = await createJestConfig(customJestConfig)();
  config.transformIgnorePatterns = [
    "/node_modules/(?!\\.pnpm/|(@sanity|nanoid|uuid|get-random-values|get-it|eventsource|eventsource-parser|obug)/)",
    "^.+\\.module\\.(css|sass|scss)$",
  ];
  return config;
};
