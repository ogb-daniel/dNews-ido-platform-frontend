"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { BrowserProvider, formatEther } from "ethers";
import { toast } from "@/hooks/use-toast";

export interface WalletContextType {
  isConnected: boolean;
  account: string | null;
  balance: string;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: () => Promise<void>;
  provider: BrowserProvider | null;
}

export const WalletContext = createContext<WalletContextType | undefined>(
  undefined
);

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_CHAIN_HEX = "0xaa36a7";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState("0");
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        toast({
          title: "Wallet Not Found",
          description: "Please install MetaMask or another Web3 wallet.",
          variant: "destructive",
        });
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();

      if (accounts.length > 0) {
        const account = accounts[0];
        const balance = await provider.getBalance(account);

        setProvider(provider);
        setAccount(account);
        setBalance(formatEther(balance));
        setChainId(Number(network.chainId));
        setIsConnected(true);

        // Check if on Sepolia
        if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
          toast({
            title: "Wrong Network",
            description: "Please switch to Sepolia testnet.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Wallet Connected",
            description: `Connected to ${account.slice(0, 6)}...${account.slice(
              -4
            )}`,
          });
        }
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAccount(null);
    setBalance("0");
    setChainId(null);
    setProvider(null);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  const switchNetwork = async () => {
    try {
      if (!window.ethereum) return;

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_HEX }],
      });

      toast({
        title: "Network Switched",
        description: "Successfully switched to Sepolia testnet.",
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added to wallet
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: SEPOLIA_CHAIN_HEX,
                chainName: "Sepolia Testnet",
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://sepolia.infura.io/v3/"],
                blockExplorerUrls: ["https://sepolia.etherscan.io/"],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add network:", addError);
        }
      } else {
        console.error("Failed to switch network:", error);
        toast({
          title: "Network Switch Failed",
          description: "Failed to switch to Sepolia testnet.",
          variant: "destructive",
        });
      }
    }
  };

  // Listen for account and network changes
  // Create read-only provider when ethereum is available but wallet not connected
  useEffect(() => {
    if (window.ethereum && !provider && !isConnected) {
      const readOnlyProvider = new BrowserProvider(window.ethereum);
      setProvider(readOnlyProvider);
    }
  }, [provider, isConnected]);

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          // Refresh balance
          if (provider) {
            provider.getBalance(accounts[0]).then((balance) => {
              setBalance(formatEther(balance));
            });
          }
        }
      };

      const handleChainChanged = (chainId: string) => {
        setChainId(Number.parseInt(chainId, 16));
        window.location.reload(); // Recommended by MetaMask
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum?.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum?.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [account, provider]);

  const value = {
    isConnected,
    account,
    balance,
    chainId,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    provider,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

// Extend window object for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
