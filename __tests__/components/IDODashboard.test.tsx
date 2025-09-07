import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IDODashboard } from '@/components/IDODashboard';
import { IDOContext } from '@/contexts/IDOContext';
import { WalletContext } from '@/contexts/WalletContext';
import { ReactNode } from 'react';

const mockIDOContextValue = {
  idoData: {
    saleActive: true,
    tokenPrice: '0.15',
    tokensRemaining: '75000000',
    totalRaised: '11250',
    hardCap: '22500',
    softCap: '7500',
    saleEndTime: Date.now() + 86400000 * 3, // 3 days from now
    userContribution: '0',
    userTokens: '0',
    phase: 'ACTIVE' as const,
  },
  loading: false,
  error: null,
  purchaseTokens: jest.fn(),
  claimTokens: jest.fn(),
  claimRefund: jest.fn(),
  refreshData: jest.fn(),
  approvepUSD: jest.fn(),
  getpUSDBalance: jest.fn().mockResolvedValue('1000'),
  getpUSDAllowance: jest.fn().mockResolvedValue('0'),
};

const mockWalletContextValue = {
  isConnected: true,
  account: '0x1234567890123456789012345678901234567890',
  balance: '1.5',
  chainId: 11155111,
  connectWallet: jest.fn(),
  disconnectWallet: jest.fn(),
  switchNetwork: jest.fn(),
  provider: {} as any,
};

const MockProviders = ({ 
  children, 
  idoValue = mockIDOContextValue, 
  walletValue = mockWalletContextValue 
}: { 
  children: ReactNode; 
  idoValue?: typeof mockIDOContextValue;
  walletValue?: typeof mockWalletContextValue;
}) => (
  <WalletContext.Provider value={walletValue}>
    <IDOContext.Provider value={idoValue}>
      {children}
    </IDOContext.Provider>
  </WalletContext.Provider>
);

describe('IDODashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render IDO statistics correctly', () => {
    render(
      <MockProviders>
        <IDODashboard />
      </MockProviders>
    );

    // Check if main stats are displayed
    expect(screen.getByText('11,250 pUSD')).toBeInTheDocument();
    expect(screen.getByText('75,000,000')).toBeInTheDocument();
    expect(screen.getByText('0.15 pUSD')).toBeInTheDocument();
  });

  it('should show purchase interface when IDO is active', () => {
    render(
      <MockProviders>
        <IDODashboard />
      </MockProviders>
    );

    expect(screen.getByText('Purchase TRUTH Tokens')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter pUSD amount')).toBeInTheDocument();
  });

  it('should calculate token amount correctly when pUSD input changes', async () => {
    render(
      <MockProviders>
        <IDODashboard />
      </MockProviders>
    );

    const pUSDInput = screen.getByPlaceholderText('Enter pUSD amount');
    fireEvent.change(pUSDInput, { target: { value: '150' } });

    // 150 pUSD / 0.15 = 1000 TRUTH tokens
    await waitFor(() => {
      const truthInput = screen.getByDisplayValue('1000.00');
      expect(truthInput).toBeInTheDocument();
    });
  });

  it('should show validation error for amount below minimum', async () => {
    render(
      <MockProviders>
        <IDODashboard />
      </MockProviders>
    );

    const pUSDInput = screen.getByPlaceholderText('Enter pUSD amount');
    fireEvent.change(pUSDInput, { target: { value: '5' } });

    await waitFor(() => {
      expect(screen.getByText('Minimum contribution: 10 pUSD')).toBeInTheDocument();
    });
  });

  it('should show approval button when allowance is insufficient', async () => {
    const mockGetAllowance = jest.fn().mockResolvedValue('0');
    const idoValueWithLowAllowance = {
      ...mockIDOContextValue,
      getpUSDAllowance: mockGetAllowance,
    };

    render(
      <MockProviders idoValue={idoValueWithLowAllowance}>
        <IDODashboard />
      </MockProviders>
    );

    const pUSDInput = screen.getByPlaceholderText('Enter pUSD amount');
    fireEvent.change(pUSDInput, { target: { value: '100' } });

    await waitFor(() => {
      expect(screen.getByText('Approve pUSD')).toBeInTheDocument();
    });
  });

  it('should call approvepUSD when approve button is clicked', async () => {
    const mockApprovepUSD = jest.fn().mockResolvedValue({});
    const idoValueWithApprove = {
      ...mockIDOContextValue,
      approvepUSD: mockApprovepUSD,
      getpUSDAllowance: jest.fn().mockResolvedValue('0'),
    };

    render(
      <MockProviders idoValue={idoValueWithApprove}>
        <IDODashboard />
      </MockProviders>
    );

    const pUSDInput = screen.getByPlaceholderText('Enter pUSD amount');
    fireEvent.change(pUSDInput, { target: { value: '100' } });

    await waitFor(() => {
      const approveButton = screen.getByText('Approve pUSD');
      fireEvent.click(approveButton);
      expect(mockApprovepUSD).toHaveBeenCalledWith('100');
    });
  });

  it('should call purchaseTokens when purchase button is clicked', async () => {
    const mockPurchaseTokens = jest.fn().mockResolvedValue({});
    const idoValueWithPurchase = {
      ...mockIDOContextValue,
      purchaseTokens: mockPurchaseTokens,
      getpUSDAllowance: jest.fn().mockResolvedValue('1000'), // Sufficient allowance
    };

    render(
      <MockProviders idoValue={idoValueWithPurchase}>
        <IDODashboard />
      </MockProviders>
    );

    const pUSDInput = screen.getByPlaceholderText('Enter pUSD amount');
    fireEvent.change(pUSDInput, { target: { value: '100' } });

    await waitFor(() => {
      const purchaseButton = screen.getByText('Purchase Tokens');
      fireEvent.click(purchaseButton);
      expect(mockPurchaseTokens).toHaveBeenCalledWith('100');
    });
  });

  it('should show portfolio information when wallet is connected', () => {
    const idoValueWithContribution = {
      ...mockIDOContextValue,
      idoData: {
        ...mockIDOContextValue.idoData,
        userContribution: '500',
        userTokens: '3333.33',
      },
    };

    render(
      <MockProviders idoValue={idoValueWithContribution}>
        <IDODashboard />
      </MockProviders>
    );

    // Switch to portfolio tab
    fireEvent.click(screen.getByText('Your Portfolio'));

    expect(screen.getByText('500 pUSD')).toBeInTheDocument();
    expect(screen.getByText('3333.33 TRUTH')).toBeInTheDocument();
  });

  it('should show connect wallet message in portfolio when not connected', () => {
    const walletNotConnected = {
      ...mockWalletContextValue,
      isConnected: false,
      account: null,
    };

    render(
      <MockProviders walletValue={walletNotConnected}>
        <IDODashboard />
      </MockProviders>
    );

    // Switch to portfolio tab
    fireEvent.click(screen.getByText('Your Portfolio'));

    expect(screen.getByText('Connect your wallet to view your portfolio')).toBeInTheDocument();
  });

  it('should show claim button when IDO is in CLAIM phase', () => {
    const idoValueClaimPhase = {
      ...mockIDOContextValue,
      idoData: {
        ...mockIDOContextValue.idoData,
        phase: 'CLAIM' as const,
        userTokens: '1000',
      },
    };

    render(
      <MockProviders idoValue={idoValueClaimPhase}>
        <IDODashboard />
      </MockProviders>
    );

    expect(screen.getByText('Claim TRUTH Tokens')).toBeInTheDocument();
  });

  it('should show refund button when IDO ended without reaching soft cap', () => {
    const idoValueEndedFailed = {
      ...mockIDOContextValue,
      idoData: {
        ...mockIDOContextValue.idoData,
        phase: 'ENDED' as const,
        totalRaised: '5000', // Below soft cap of 7500
        userContribution: '100',
      },
    };

    render(
      <MockProviders idoValue={idoValueEndedFailed}>
        <IDODashboard />
      </MockProviders>
    );

    expect(screen.getByText('Claim Refund')).toBeInTheDocument();
  });
});