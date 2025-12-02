/**
 * Mock for uuid module
 * Provides deterministic UUIDs for testing
 */

let counter = 0;

export const v4 = jest.fn(() => {
  counter++;
  return `test-uuid-${counter.toString().padStart(4, "0")}`;
});

// Reset counter between tests
export const __resetMock = () => {
  counter = 0;
};

export default { v4 };
