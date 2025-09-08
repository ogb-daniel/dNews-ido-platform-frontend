import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletConnection } from '@/components/WalletConnection';
import { WalletContext } from '@/contexts/WalletContext';
import type { WalletContextType } from '@/contexts/WalletContext';
import { ReactNode } from 'react';

// Mock ethers
jest.mock("ethers", () => ({
  BrowserProvider: jest.fn(() => ({
    send: jest.fn(),
    getNetwork: jest.fn(),
    getBalance: jest.fn(),
    getSigner: jest.fn(),
  })),
  formatEther: jest.fn((wei) => '1.5000'),
}));

const mockWalletContextValue: WalletContextType = {
  isConnected: false,
  account: null,
  balance: '0',
  chainId: null,
  connectWallet: jest.fn(),
  disconnectWallet: jest.fn(),
  switchNetwork: jest.fn(),
  provider: null,
};

const MockWalletProvider = ({ children, value = mockWalletContextValue }: { 
  children: ReactNode; 
  value?: WalletContextType;
}) => (
  <WalletContext.Provider value={value}>
    {children}
  </WalletContext.Provider>
);

describe('WalletConnection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render connect button when wallet not connected', () => {
    render(
      <MockWalletProvider>
        <WalletConnection />
      </MockWalletProvider>
    );

    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    expect(screen.getByText('Connect your wallet to participate in the TRUTH Token IDO')).toBeInTheDocument();
  });

  it('should call connectWallet when connect button is clicked', async () => {
    const mockConnectWallet = jest.fn();
    
    render(
      <MockWalletProvider value={{...mockWalletContextValue, connectWallet: mockConnectWallet}}>
        <WalletConnection />
      </MockWalletProvider>
    );

    const connectButton = screen.getByRole('button', { name: /connect wallet/i });
    fireEvent.click(connectButton);

    expect(mockConnectWallet).toHaveBeenCalledTimes(1);
  });

  it('should display wallet info when connected', () => {
    const connectedValue: WalletContextType = {
      ...mockWalletContextValue,
      isConnected: true,
      account: '0x1234567890123456789012345678901234567890',
      balance: '1.5',
      chainId: 11155111, // Sepolia
    };

    render(
      <MockWalletProvider value={connectedValue}>
        <WalletConnection />
      </MockWalletProvider>
    );

    expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
    expect(screen.getByText('1.5000 ETH')).toBeInTheDocument();
    expect(screen.getByText('Sepolia')).toBeInTheDocument();
  });

  it('should show wrong network warning when not on Sepolia', () => {
    const wrongNetworkValue: WalletContextType = {
      ...mockWalletContextValue,
      isConnected: true,
      account: '0x1234567890123456789012345678901234567890',
      balance: '1.5',
      chainId: 1, // Mainnet
    };

    render(
      <MockWalletProvider value={wrongNetworkValue}>
        <WalletConnection />
      </MockWalletProvider>
    );

    expect(screen.getByText('Wrong Network')).toBeInTheDocument();
    expect(screen.getByText('Switch Network')).toBeInTheDocument();
  });

  it('should call switchNetwork when switch network button is clicked', async () => {
    const mockSwitchNetwork = jest.fn();
    const wrongNetworkValue = {
      ...mockWalletContextValue,
      isConnected: true,
      account: '0x1234567890123456789012345678901234567890',
      balance: '1.5',
      chainId: 1, // Mainnet
      switchNetwork: mockSwitchNetwork,
    };

    render(
      <MockWalletProvider value={wrongNetworkValue}>
        <WalletConnection />
      </MockWalletProvider>
    );

    const switchButton = screen.getByText('Switch Network');
    fireEvent.click(switchButton);

    expect(mockSwitchNetwork).toHaveBeenCalledTimes(1);
  });

  it('should call disconnectWallet when disconnect button is clicked', async () => {
    const mockDisconnectWallet = jest.fn();
    const connectedValue = {
      ...mockWalletContextValue,
      isConnected: true,
      account: '0x1234567890123456789012345678901234567890',
      balance: '1.5',
      chainId: 11155111,
      disconnectWallet: mockDisconnectWallet,
    };

    render(
      <MockWalletProvider value={connectedValue}>
        <WalletConnection />
      </MockWalletProvider>
    );

    // Find the disconnect button (power icon button)
    const disconnectButton = screen.getByRole('button', { name: '' }); // Power icon button has no text
    fireEvent.click(disconnectButton);

    expect(mockDisconnectWallet).toHaveBeenCalledTimes(1);
  });
});