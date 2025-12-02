/**
 * Mock for uuid module
 * Provides deterministic UUIDs for testing
 */

let counter = 0;

export const v4 = (): string => {
  counter++;
  return `test-uuid-${counter.toString().padStart(4, "0")}`;
};

// Reset counter between tests
export const __resetMock = (): void => {
  counter = 0;
};

const uuidMock = { v4 };
export default uuidMock;
