/**
 * Integration Tests for IDO Flow
 * Tests the complete user journey from wallet connection to token purchase
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IDODashboard } from '@/components/IDODashboard';
import { WalletConnection } from '@/components/WalletConnection';
import { IDOProvider } from '@/contexts/IDOContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { ReactNode } from 'react';

const MockAppProviders = ({ children }: { children: ReactNode }) => (
  <WalletProvider>
    <IDOProvider>
      {children}
    </IDOProvider>
  </WalletProvider>
);

describe('IDO Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful wallet connection
    window.ethereum = {
      request: jest.fn()
        .mockImplementation((params) => {
          if (params.method === 'eth_requestAccounts') {
            return Promise.resolve(['0x1234567890123456789012345678901234567890']);
          }
          return Promise.resolve();
        }),
      on: jest.fn(),
      removeListener: jest.fn(),
    };
  });

  it('should complete full IDO participation flow', async () => {
    render(
      <MockAppProviders>
        <div>
          <WalletConnection />
          <IDODashboard />
        </div>
      </MockAppProviders>
    );

    // Step 1: Initially should show connect wallet button
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();

    // Step 2: Connect wallet
    fireEvent.click(screen.getByText('Connect Wallet'));

    // Wait for wallet connection (this would be mocked in real scenario)
    await waitFor(() => {
      // After connection, should see IDO dashboard
      expect(screen.getByText('Purchase TRUTH Tokens')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Step 3: Check if IDO statistics are displayed
    expect(screen.getByText('Total Raised')).toBeInTheDocument();
    expect(screen.getByText('Tokens Remaining')).toBeInTheDocument();
    expect(screen.getByText('Token Price')).toBeInTheDocument();

    // Step 4: Enter purchase amount
    const pUSDInput = screen.getByPlaceholderText(/enter.*pusd.*amount/i);
    fireEvent.change(pUSDInput, { target: { value: '100' } });

    // Step 5: Should calculate TRUTH tokens correctly
    await waitFor(() => {
      // Assuming 0.15 pUSD per TRUTH token: 100 / 0.15 = 666.67
      const truthDisplay = screen.getByDisplayValue(/666\.67|666.66/);
      expect(truthDisplay).toBeInTheDocument();
    });

    // Step 6: Check validation
    expect(screen.queryByText(/minimum contribution/i)).not.toBeInTheDocument();
  });

  it('should show proper error states', async () => {
    render(
      <MockAppProviders>
        <IDODashboard />
      </MockAppProviders>
    );

    // Test minimum contribution validation
    const pUSDInput = screen.getByPlaceholderText(/enter.*pusd.*amount/i);
    fireEvent.change(pUSDInput, { target: { value: '5' } });

    await waitFor(() => {
      expect(screen.getByText(/minimum contribution.*10.*pusd/i)).toBeInTheDocument();
    });

    // Test maximum contribution validation
    fireEvent.change(pUSDInput, { target: { value: '5000' } });

    await waitFor(() => {
      expect(screen.getByText(/maximum.*contribution.*2000.*pusd/i)).toBeInTheDocument();
    });
  });

  it('should handle different IDO phases correctly', async () => {
    // This would require mocking different IDO states
    // For now, just test that phase-specific UI elements are conditional
    
    render(
      <MockAppProviders>
        <IDODashboard />
      </MockAppProviders>
    );

    // In ACTIVE phase, should show purchase interface
    expect(screen.getByText('Purchase TRUTH Tokens')).toBeInTheDocument();
    
    // Should show current phase in progress bar area
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('should display portfolio information correctly', async () => {
    render(
      <MockAppProviders>
        <IDODashboard />
      </MockAppProviders>
    );

    // Switch to portfolio tab
    const portfolioTab = screen.getByText('Your Portfolio');
    fireEvent.click(portfolioTab);

    // Should show portfolio section
    expect(screen.getByText('Your contribution and token allocation')).toBeInTheDocument();
  });

  it('should handle network switching', async () => {
    // Mock wrong network initially
    window.ethereum.request = jest.fn()
      .mockImplementation((params) => {
        if (params.method === 'eth_requestAccounts') {
          return Promise.resolve(['0x1234567890123456789012345678901234567890']);
        }
        if (params.method === 'eth_chainId') {
          return Promise.resolve('0x1'); // Mainnet instead of Sepolia
        }
        return Promise.resolve();
      });

    render(
      <MockAppProviders>
        <WalletConnection />
      </MockAppProviders>
    );

    // Connect wallet first
    fireEvent.click(screen.getByText('Connect Wallet'));

    // Should eventually show wrong network warning
    await waitFor(() => {
      expect(screen.getByText('Wrong Network')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should show switch network button
    expect(screen.getByText('Switch Network')).toBeInTheDocument();
  });
});

describe('Error Handling Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle wallet connection failures gracefully', async () => {
    // Mock wallet connection failure
    window.ethereum = {
      request: jest.fn().mockRejectedValue(new Error('User rejected request')),
      on: jest.fn(),
      removeListener: jest.fn(),
    };

    render(
      <MockAppProviders>
        <WalletConnection />
      </MockAppProviders>
    );

    fireEvent.click(screen.getByText('Connect Wallet'));

    // Should remain in disconnected state
    await waitFor(() => {
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });
  });

  it('should handle missing MetaMask', async () => {
    // Remove ethereum from window
    const originalEthereum = window.ethereum;
    delete (window as any).ethereum;

    render(
      <MockAppProviders>
        <WalletConnection />
      </MockAppProviders>
    );

    fireEvent.click(screen.getByText('Connect Wallet'));

    // Should show connect button (no wallet detected)
    await waitFor(() => {
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    // Restore ethereum
    window.ethereum = originalEthereum;
  });
});