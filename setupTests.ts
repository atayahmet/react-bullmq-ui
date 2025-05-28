import '@testing-library/jest-dom';

// Mock implementation for clipboard API
Object.defineProperty(window.navigator, 'clipboard', {
  value: {
    writeText: () => Promise.resolve(),
  },
  writable: true,
});