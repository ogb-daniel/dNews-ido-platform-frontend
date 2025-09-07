import { ethers } from 'ethers';
import { TruthTokenABI } from './abi/TruthToken';
import { IDOContractABI } from './abi/IDOContract';
import { PAUDollarABI } from './abi/PAUDollar';
import { VestingContractABI } from './abi/VestingContract';

// Import contract addresses (will be populated by deployment script)
import contractAddresses from './addresses.json';

export interface ContractAddresses {
  TruthToken: string;
  IDOContract: string;
  PAUDollar: string;
  VestingContract: string;
}

// Contract addresses - these will be updated by the deployment script
export const ADDRESSES: ContractAddresses = contractAddresses as ContractAddresses;

// Contract factory functions
export function getTruthTokenContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(ADDRESSES.TruthToken, TruthTokenABI, signerOrProvider);
}

export function getIDOContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(ADDRESSES.IDOContract, IDOContractABI, signerOrProvider);
}

export function getPAUDollarContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(ADDRESSES.PAUDollar, PAUDollarABI, signerOrProvider);
}

export function getVestingContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(ADDRESSES.VestingContract, VestingContractABI, signerOrProvider);
}

// Network configuration
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_HEX = '0xaa36a7';

export const NETWORK_CONFIG = {
  chainId: SEPOLIA_CHAIN_HEX,
  chainName: 'Sepolia Testnet',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia.infura.io/v3/'],
  blockExplorerUrls: ['https://sepolia.etherscan.io/'],
};

// Contract interaction helpers
export class ContractHelpers {
  static formatTokenAmount(amount: string | bigint, decimals: number = 18): string {
    return ethers.formatUnits(amount, decimals);
  }

  static parseTokenAmount(amount: string, decimals: number = 18): bigint {
    return ethers.parseUnits(amount, decimals);
  }

  static formatAddress(address: string, length: number = 4): string {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-length)}`;
  }

  static async getGasEstimate(
    contract: ethers.Contract,
    method: string,
    args: any[] = [],
    overrides: any = {}
  ): Promise<bigint> {
    try {
      return await contract[method].estimateGas(...args, overrides);
    } catch (error) {
      console.error('Gas estimation failed:', error);
      // Return a default high gas limit if estimation fails
      return ethers.parseUnits('500000', 'wei');
    }
  }

  static async waitForTransaction(
    tx: ethers.TransactionResponse,
    confirmations: number = 1
  ): Promise<ethers.TransactionReceipt> {
    const receipt = await tx.wait(confirmations);
    if (!receipt) {
      throw new Error('Transaction receipt is null');
    }
    return receipt;
  }
}

// Event filter helpers
export class EventFilters {
  static createTokensPurchasedFilter(idoContract: ethers.Contract, buyer?: string) {
    return idoContract.filters.TokensPurchased(buyer || null);
  }

  static createTokensClaimedFilter(idoContract: ethers.Contract, claimer?: string) {
    return idoContract.filters.TokensClaimed(claimer || null);
  }

  static createTransferFilter(tokenContract: ethers.Contract, from?: string, to?: string) {
    return tokenContract.filters.Transfer(from || null, to || null);
  }
}

// Error handling
export class ContractError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly transaction?: ethers.TransactionResponse
  ) {
    super(message);
    this.name = 'ContractError';
  }

  static fromError(error: any): ContractError {
    if (error.code === 'CALL_EXCEPTION') {
      return new ContractError('Contract call failed: ' + error.reason, error.code);
    }
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return new ContractError('Insufficient funds for transaction', error.code);
    }

    if (error.code === 'USER_REJECTED') {
      return new ContractError('Transaction rejected by user', error.code);
    }

    if (error.code === 'NETWORK_ERROR') {
      return new ContractError('Network error: ' + error.message, error.code);
    }

    return new ContractError(error.message || 'Unknown contract error', error.code);
  }
}