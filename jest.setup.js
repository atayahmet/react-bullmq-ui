// Add any global test setup here
const jestDom = require('@testing-library/jest-dom');

// Properly extend Jest with all matchers
require('@testing-library/jest-dom');

// This makes all jest-dom matchers available
expect.extend(jestDom);

// Mock fetch globally
global.fetch = jest.fn();

// Clean up mocks after each test
afterEach(() => {
  jest.resetAllMocks();
});