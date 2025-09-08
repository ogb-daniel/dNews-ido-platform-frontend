import '@testing-library/jest-dom';

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}));

// Mock window.ethereum
Object.defineProperty(window, 'ethereum', {
  value: {
    request: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
  },
  writable: true,
});

// Polyfill for BigInt serialization in Jest
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};