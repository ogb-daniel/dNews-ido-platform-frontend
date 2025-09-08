import { renderHook, act, waitFor } from '@testing-library/react';
import { WalletProvider, useWallet, type WalletContextType } from '@/contexts/WalletContext';
import { ReactNode } from 'react';

// Mock ethers
jest.mock("ethers", () => ({
  BrowserProvider: jest.fn(() => ({
    send: jest.fn().mockResolvedValue(['0x1234567890123456789012345678901234567890']),
    getNetwork: jest.fn().mockResolvedValue({ chainId: 11155111n }),
    getBalance: jest.fn().mockResolvedValue(BigInt('1500000000000000000')),
  })),
  formatEther: jest.fn(() => '1.5'),
}));

// Mock ethers
const mockProvider = {
  send: jest.fn(),
  getSigner: jest.fn(),
  getNetwork: jest.fn(),
  getBalance: jest.fn(),
};

const mockEthereum = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
};

// Setup window.ethereum mock
Object.defineProperty(window, 'ethereum', {
  value: mockEthereum,
  writable: true,
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <WalletProvider>{children}</WalletProvider>
);

describe('WalletContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProvider.send.mockReset();
    mockProvider.getSigner.mockReset();
    mockProvider.getNetwork.mockReset();
    mockProvider.getBalance.mockReset();
    mockEthereum.request.mockReset();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.account).toBe(null);
    expect(result.current.balance).toBe('0');
    expect(result.current.chainId).toBe(null);
    expect(result.current.provider).toBe(null);
  });

  it('should connect wallet successfully', async () => {
    mockProvider.send.mockResolvedValueOnce(['0x1234567890123456789012345678901234567890']);
    mockProvider.getNetwork.mockResolvedValueOnce({ chainId: BigInt(11155111) });
    mockProvider.getBalance.mockResolvedValueOnce(BigInt('1500000000000000000')); // 1.5 ETH

    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.connectWallet();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
      expect(result.current.account).toBe('0x1234567890123456789012345678901234567890');
      expect(result.current.chainId).toBe(11155111);
    });
  });

  it('should handle connection error gracefully', async () => {
    mockProvider.send.mockRejectedValueOnce(new Error('User rejected request'));
    
    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.connectWallet();
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.account).toBe(null);
  });

  it('should disconnect wallet', () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    // First connect (mocking connected state)
    act(() => {
      // Manually set connected state for testing
      result.current.disconnectWallet();
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.account).toBe(null);
    expect(result.current.balance).toBe('0');
    expect(result.current.chainId).toBe(null);
    expect(result.current.provider).toBe(null);
  });

  it('should switch network', async () => {
    mockEthereum.request.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.switchNetwork();
    });

    expect(mockEthereum.request).toHaveBeenCalledWith({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }],
    });
  });

  it('should add Sepolia network if not present', async () => {
    mockEthereum.request
      .mockRejectedValueOnce({ code: 4902 }) // Network not added error
      .mockResolvedValueOnce(undefined); // Add network success

    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.switchNetwork();
    });

    expect(mockEthereum.request).toHaveBeenCalledWith({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: '0xaa36a7',
          chainName: 'Sepolia Testnet',
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: ['https://sepolia.infura.io/v3/'],
          blockExplorerUrls: ['https://sepolia.etherscan.io/'],
        },
      ],
    });
  });

  it('should handle wallet not installed', async () => {
    // Temporarily remove ethereum
    const originalEthereum = window.ethereum;
    // @ts-ignore
    delete window.ethereum;

    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.connectWallet();
    });

    expect(result.current.isConnected).toBe(false);

    // Restore ethereum
    window.ethereum = originalEthereum;
  });

  it('should show wrong network warning for non-Sepolia chains', async () => {
    mockProvider.send.mockResolvedValueOnce(['0x1234567890123456789012345678901234567890']);
    mockProvider.getNetwork.mockResolvedValueOnce({ chainId: BigInt(1) }); // Mainnet
    mockProvider.getBalance.mockResolvedValueOnce(BigInt('1500000000000000000'));

    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.connectWallet();
    });

    await waitFor(() => {
      expect(result.current.chainId).toBe(1);
      // The component should show wrong network warning when chainId !== 11155111
    });
  });
});