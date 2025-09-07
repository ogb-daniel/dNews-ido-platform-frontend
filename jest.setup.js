import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: '',
      asPath: '',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock window.ethereum for Web3 tests
Object.defineProperty(window, 'ethereum', {
  value: {
    request: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
    isMetaMask: true,
  },
  writable: true,
})

// Mock ethers
jest.mock('ethers', () => ({
  BrowserProvider: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
    getSigner: jest.fn(),
    getNetwork: jest.fn().mockResolvedValue({ chainId: 11155111n }),
    getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
  })),
  Contract: jest.fn(),
  formatEther: jest.fn((value) => '1.0'),
  parseEther: jest.fn((value) => BigInt('1000000000000000000')),
  formatUnits: jest.fn((value, decimals) => '1.0'),
  parseUnits: jest.fn((value, decimals) => BigInt('1000000000000000000')),
}))

// Mock react-hot-toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}))

// Global test setup
global.fetch = jest.fn()

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})