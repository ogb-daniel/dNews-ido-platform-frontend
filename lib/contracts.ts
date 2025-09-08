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
