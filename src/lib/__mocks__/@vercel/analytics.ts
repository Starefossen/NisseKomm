/**
 * Mock for @vercel/analytics in Jest tests
 * Prevents ES module parsing errors and allows tracking calls to be tested
 */

export const track = () => {
  // Mock implementation - just captures the call
  return undefined;
};

const analytics = {
  track,
};

export default analytics;
