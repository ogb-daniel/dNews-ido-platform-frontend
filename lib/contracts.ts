import { ethers } from "ethers";

export class ContractError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "ContractError";
    this.code = code;
  }

  static fromError(error: any): ContractError {
    return new ContractError(error.message || "Contract error", error.code);
  }
}

export const ContractHelpers = {
  formatTokenAmount: (amount: bigint, decimals: number = 18): string => {
    return ethers.formatUnits(amount, decimals);
  },

  parseTokenAmount: (amount: string, decimals: number = 18): bigint => {
    return ethers.parseUnits(amount, decimals);
  },

  getGasEstimate: async (
    contract: any,
    method: string,
    args: any[]
  ): Promise<bigint> => {
    try {
      return await contract[method].estimateGas(...args);
    } catch (error) {
      // Return default gas estimate if estimation fails
      return BigInt("150000");
    }
  },

  waitForTransaction: async (
    tx: ethers.TransactionResponse
  ): Promise<ethers.TransactionReceipt | null> => {
    return await tx.wait();
  },
};

// Contract addresses - these should be set from environment or deployment
const CONTRACTS = {
  IDO: process.env.NEXT_PUBLIC_IDO_CONTRACT_ADDRESS || "",
  PAUSD: process.env.NEXT_PUBLIC_PAUSD_CONTRACT_ADDRESS || "",
  TRUTH: process.env.NEXT_PUBLIC_TRUTH_CONTRACT_ADDRESS || "",
};

// ABI imports would go here - for now using minimal interfaces
const IDO_ABI = [
  "function getSaleInfo() view returns (uint8, uint256, uint256, uint256, uint256, bool)",
  "function tokenPrice() view returns (uint256)",
  "function tokensForSale() view returns (uint256)",
  "function hardCap() view returns (uint256)",
  "function softCap() view returns (uint256)",
  "function getRemainingTokens() view returns (uint256)",
  "function contributions(address) view returns (uint256)",
  "function tokenAllocations(address) view returns (uint256)",
  "function buyTokens(uint256) payable",
  "function claimTokens()",
  "function claimRefund()",
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address, address) view returns (uint256)",
  "function approve(address, uint256) returns (bool)",
  "function transfer(address, uint256) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

export function getIDOContract(provider: ethers.Provider | ethers.Signer) {
  return new ethers.Contract(CONTRACTS.IDO, IDO_ABI, provider);
}

export function getPAUDollarContract(
  provider: ethers.Provider | ethers.Signer
) {
  return new ethers.Contract(CONTRACTS.PAUSD, ERC20_ABI, provider);
}

export function getTruthTokenContract(
  provider: ethers.Provider | ethers.Signer
) {
  return new ethers.Contract(CONTRACTS.TRUTH, ERC20_ABI, provider);
}

// Payment token configuration
export interface PaymentToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  nairaRate: number; // How much 1 token is worth in Naira
  truthRate: number; // How much 1 token gets you in TRUTH tokens
}

// Supported payment tokens
export const PAYMENT_TOKENS: { [key: string]: PaymentToken } = {
  pUSD: {
    symbol: 'pUSD',
    name: 'PAU Dollar',
    address: CONTRACTS.PAUSD,
    decimals: 0,
    nairaRate: 1500, // 1 pUSD = ₦1,500
    truthRate: 1, // 1 pUSD = 1 TRUTH
  },
  // Future tokens can be added here
  // USDT: {
  //   symbol: 'USDT',
  //   name: 'Tether USD',
  //   address: '0x...',
  //   decimals: 6,
  //   nairaRate: 1600, // 1 USDT = ₦1,600
  //   truthRate: 1.067, // 1 USDT = 1.067 TRUTH
  // }
};

// Currency conversion utilities
export const CurrencyHelpers = {
  // Convert payment token amount to Naira
  toNaira: (tokenAmount: string, tokenSymbol: string = 'pUSD'): string => {
    const token = PAYMENT_TOKENS[tokenSymbol];
    if (!token) throw new Error(`Unsupported payment token: ${tokenSymbol}`);
    
    const amount = parseFloat(tokenAmount);
    const naira = amount * token.nairaRate;
    return naira.toLocaleString('en-NG', { 
      style: 'currency', 
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    });
  },

  // Convert payment token amount to TRUTH tokens
  toTruth: (tokenAmount: string, tokenSymbol: string = 'pUSD'): string => {
    const token = PAYMENT_TOKENS[tokenSymbol];
    if (!token) throw new Error(`Unsupported payment token: ${tokenSymbol}`);
    
    const amount = parseFloat(tokenAmount);
    const truth = amount * token.truthRate;
    return truth.toFixed(2);
  },

  // Format Naira amount
  formatNaira: (amount: number): string => {
    return amount.toLocaleString('en-NG', { 
      style: 'currency', 
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    });
  },

  // Get payment token info
  getPaymentToken: (symbol: string): PaymentToken => {
    const token = PAYMENT_TOKENS[symbol];
    if (!token) throw new Error(`Unsupported payment token: ${symbol}`);
    return token;
  },

  // Get all supported payment tokens
  getSupportedTokens: (): PaymentToken[] => {
    return Object.values(PAYMENT_TOKENS);
  },

  // Calculate TRUTH token price in Naira for a specific payment token
  getTruthPriceInNaira: (paymentTokenSymbol: string = 'pUSD'): number => {
    const token = PAYMENT_TOKENS[paymentTokenSymbol];
    if (!token) throw new Error(`Unsupported payment token: ${paymentTokenSymbol}`);
    
    // Price of 1 TRUTH in Naira = (1 / truthRate) * nairaRate
    return (1 / token.truthRate) * token.nairaRate;
  },
};
