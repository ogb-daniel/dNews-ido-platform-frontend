"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useWallet } from "./WalletContext";
import { toast } from "@/hooks/use-toast";
import {
  getIDOContract,
  getPAUDollarContract,
  getTruthTokenContract,
  ContractHelpers,
  ContractError,
} from "@/lib/contracts";
import { ethers } from "ethers";

export interface IDOData {
  saleActive: boolean;
  tokenPrice: string;
  tokensRemaining: string;
  totalRaised: string;
  hardCap: string;
  softCap: string;
  saleEndTime: number;
  userContribution: string;
  userTokens: string;
  phase: "PREPARATION" | "ACTIVE" | "FINALIZATION" | "CLAIM" | "ENDED";
}

export interface IDOContextType {
  idoData: IDOData;
  loading: boolean;
  error: string | null;
  purchaseTokens: (
    pUSDAmount: string
  ) => Promise<ethers.TransactionResponse | null>;
  claimTokens: () => Promise<ethers.TransactionResponse | null>;
  claimRefund: () => Promise<ethers.TransactionResponse | null>;
  refreshData: () => Promise<void>;
  approvepUSD: (amount: string) => Promise<ethers.TransactionResponse | null>;
  getpUSDBalance: () => Promise<string>;
  getpUSDAllowance: () => Promise<string>;
}

export const IDOContext = createContext<IDOContextType | undefined>(undefined);

export function IDOProvider({ children }: { children: ReactNode }) {
  const { provider, account, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [idoData, setIdoData] = useState<IDOData>({
    saleActive: false,
    tokenPrice: "1",
    tokensRemaining: "0",
    totalRaised: "0",
    hardCap: "0",
    softCap: "0",
    saleEndTime: 0,
    userContribution: "0",
    userTokens: "0",
    phase: "PREPARATION",
  });

  const refreshData = async () => {
    if (!provider) return;

    setLoading(true);
    try {
      const idoContract = getIDOContract(provider);

      // Get sale info (public data)
      const [phase, startTime, endTime, raised, participants, finalized] =
        await idoContract.getSaleInfo();

      // Get configuration (public data)
      const tokenPrice = await idoContract.tokenPrice();
      const tokensForSale = await idoContract.tokensForSale();
      const hardCap = await idoContract.hardCap();
      const softCap = await idoContract.softCap();
      const remainingTokens = await idoContract.getRemainingTokens();

      // Get user-specific data only if wallet is connected
      let userContribution = BigInt(0);
      let userTokens = BigInt(0);
      if (account) {
        userContribution = await idoContract.contributions(account);
        userTokens = await idoContract.tokenAllocations(account);
      }

      // Convert phase number to string
      const phases = [
        "PREPARATION",
        "ACTIVE",
        "FINALIZATION",
        "CLAIM",
        "ENDED",
      ] as const;
      const phaseString = phases[Number(phase)] || "PREPARATION";

      setIdoData({
        saleActive: Number(phase) === 1, // ACTIVE phase
        tokenPrice: ContractHelpers.formatTokenAmount(tokenPrice, 0), // pUSD has 0 decimals
        tokensRemaining: ContractHelpers.formatTokenAmount(remainingTokens),
        totalRaised: ContractHelpers.formatTokenAmount(raised),
        hardCap: ContractHelpers.formatTokenAmount(hardCap),
        softCap: ContractHelpers.formatTokenAmount(softCap),
        saleEndTime: Number(endTime) * 1000, // Convert to milliseconds
        userContribution: ContractHelpers.formatTokenAmount(userContribution),
        userTokens: ContractHelpers.formatTokenAmount(userTokens),
        phase: phaseString,
      });

      setError(null);
    } catch (err) {
      const contractError = ContractError.fromError(err);
      setError(contractError.message);
      console.error("Refresh error:", err);
    } finally {
      setLoading(false);
    }
  };

  const purchaseTokens = async (
    pUSDAmount: string
  ): Promise<ethers.TransactionResponse | null> => {
    if (!provider || !account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const idoContract = getIDOContract(signer);
      const pUSDContract = getPAUDollarContract(signer);

      // Get pUSD token decimals
      const decimals = await pUSDContract.decimals();
      const pUSDDecimals = Number(decimals);
      
      const amount = ContractHelpers.parseTokenAmount(pUSDAmount, pUSDDecimals);

      // Check if user has enough pUSD balance
      const balance = await pUSDContract.balanceOf(account);
      console.log("Raw balance:", balance);
      console.log("Required amount:", amount);
      console.log("pUSD decimals:", pUSDDecimals);
      console.log(
        "Balance formatted:",
        ContractHelpers.formatTokenAmount(balance, pUSDDecimals)
      );
      console.log(
        "Amount formatted:",
        ContractHelpers.formatTokenAmount(amount, pUSDDecimals)
      );

      if (balance < amount) {
        const balanceFormatted = ContractHelpers.formatTokenAmount(balance, pUSDDecimals);
        const amountFormatted = ContractHelpers.formatTokenAmount(amount, pUSDDecimals);
        throw new Error(
          `Insufficient pUSD balance. You have ${balanceFormatted} pUSD but need ${amountFormatted} pUSD`
        );
      }

      // Check allowance
      const allowance = await pUSDContract.allowance(
        account,
        await idoContract.getAddress()
      );
      console.log("Raw allowance:", allowance);
      console.log("Allowance formatted:", ContractHelpers.formatTokenAmount(allowance, pUSDDecimals));
      
      if (allowance < amount) {
        const allowanceFormatted = ContractHelpers.formatTokenAmount(allowance, pUSDDecimals);
        const amountFormatted = ContractHelpers.formatTokenAmount(amount, pUSDDecimals);
        throw new Error(
          `Insufficient pUSD allowance. You have ${allowanceFormatted} pUSD approved but need ${amountFormatted} pUSD. Please approve pUSD spending first.`
        );
      }

      // Estimate gas
      const gasEstimate = await ContractHelpers.getGasEstimate(
        idoContract,
        "buyTokens",
        [amount]
      );

      const tx = await idoContract.buyTokens(amount, {
        gasLimit: gasEstimate,
      });

      toast({
        title: "Transaction Submitted",
        description: `Transaction hash: ${tx.hash}`,
      });

      const receipt = await ContractHelpers.waitForTransaction(tx);

      // Refresh data after successful transaction
      await refreshData();

      const truthAmount = (
        parseFloat(pUSDAmount) / parseFloat(idoData.tokenPrice)
      ).toFixed(2);
      toast({
        title: "Purchase Successful",
        description: `Successfully purchased ${truthAmount} TRUTH tokens!`,
      });

      return tx;
    } catch (err: any) {
      const contractError = ContractError.fromError(err);
      console.error("Purchase error:", err);
      toast({
        title: "Purchase Failed",
        description: contractError.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const claimTokens = async (): Promise<ethers.TransactionResponse | null> => {
    if (!provider || !account) return null;

    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const idoContract = getIDOContract(signer);

      // Check if user has tokens to claim
      const claimableAmount = await idoContract.getClaimableTokens(account);
      if (claimableAmount === BigInt(0)) {
        throw new Error("No tokens available to claim");
      }

      const gasEstimate = await ContractHelpers.getGasEstimate(
        idoContract,
        "claimTokens",
        []
      );

      const tx = await idoContract.claimTokens({
        gasLimit: gasEstimate,
      });

      toast({
        title: "Transaction Submitted",
        description: `Claiming your TRUTH tokens...`,
      });

      await ContractHelpers.waitForTransaction(tx);

      // Refresh data after successful transaction
      await refreshData();

      toast({
        title: "Tokens Claimed",
        description: "Successfully claimed your TRUTH tokens!",
      });

      return tx;
    } catch (err) {
      const contractError = ContractError.fromError(err);
      console.error("Claim error:", err);
      toast({
        title: "Claim Failed",
        description: contractError.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const claimRefund = async (): Promise<ethers.TransactionResponse | null> => {
    if (!provider || !account) return null;

    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const idoContract = getIDOContract(signer);

      // Check if user has contribution to refund
      const contribution = await idoContract.contributions(account);
      if (contribution === BigInt(0)) {
        throw new Error("No contribution to refund");
      }

      const gasEstimate = await ContractHelpers.getGasEstimate(
        idoContract,
        "claimRefund",
        []
      );

      const tx = await idoContract.claimRefund({
        gasLimit: gasEstimate,
      });

      toast({
        title: "Transaction Submitted",
        description: `Processing your refund...`,
      });

      await ContractHelpers.waitForTransaction(tx);

      // Refresh data after successful transaction
      await refreshData();

      toast({
        title: "Refund Claimed",
        description: "Successfully claimed your refund!",
      });

      return tx;
    } catch (err) {
      const contractError = ContractError.fromError(err);
      console.error("Refund error:", err);
      toast({
        title: "Refund Failed",
        description: contractError.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const approvepUSD = async (
    amount: string
  ): Promise<ethers.TransactionResponse | null> => {
    if (!provider || !account) return null;

    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const pUSDContract = getPAUDollarContract(signer);
      const idoContract = getIDOContract(provider);

      // Get pUSD token decimals
      const decimals = await pUSDContract.decimals();
      const pUSDDecimals = Number(decimals);
      
      const parsedAmount = ContractHelpers.parseTokenAmount(amount, pUSDDecimals);
      const idoAddress = await idoContract.getAddress();

      const gasEstimate = await ContractHelpers.getGasEstimate(
        pUSDContract,
        "approve",
        [idoAddress, parsedAmount]
      );

      const tx = await pUSDContract.approve(idoAddress, parsedAmount, {
        gasLimit: gasEstimate,
      });

      toast({
        title: "Approval Submitted",
        description: `Approving pUSD spending...`,
      });

      await ContractHelpers.waitForTransaction(tx);

      toast({
        title: "Approval Successful",
        description: `Successfully approved pUSD spending for IDO contract`,
      });

      return tx;
    } catch (err) {
      const contractError = ContractError.fromError(err);
      console.error("Approval error:", err);
      toast({
        title: "Approval Failed",
        description: contractError.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getpUSDBalance = async (): Promise<string> => {
    if (!provider || !account) return "0";

    try {
      const pUSDContract = getPAUDollarContract(provider);
      const balance = await pUSDContract.balanceOf(account);
      const decimals = await pUSDContract.decimals();
      const formatted = ContractHelpers.formatTokenAmount(balance, Number(decimals));
      console.log("Fetched pUSD balance:", formatted);
      return formatted;
    } catch (err) {
      console.error("Error fetching pUSD balance:", err);
      return "0";
    }
  };

  const getpUSDAllowance = async (): Promise<string> => {
    if (!provider || !account) return "0";

    try {
      const pUSDContract = getPAUDollarContract(provider);
      const idoContract = getIDOContract(provider);
      const idoAddress = await idoContract.getAddress();
      const allowance = await pUSDContract.allowance(account, idoAddress);
      const decimals = await pUSDContract.decimals();
      return ContractHelpers.formatTokenAmount(allowance, Number(decimals));
    } catch (err) {
      console.error("Error fetching pUSD allowance:", err);
      return "0";
    }
  };

  useEffect(() => {
    if (isConnected && provider && account) {
      refreshData();
      const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isConnected, provider, account]);

  const value = {
    idoData,
    loading,
    error,
    purchaseTokens,
    claimTokens,
    claimRefund,
    refreshData,
    approvepUSD,
    getpUSDBalance,
    getpUSDAllowance,
  };

  return <IDOContext.Provider value={value}>{children}</IDOContext.Provider>;
}

export function useIDO() {
  const context = useContext(IDOContext);
  if (context === undefined) {
    throw new Error("useIDO must be used within an IDOProvider");
  }
  return context;
}
