"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useWallet } from "./WalletContext"
import { toast } from "@/hooks/use-toast"

interface IDOData {
  saleActive: boolean
  tokenPrice: string
  tokensRemaining: string
  totalRaised: string
  hardCap: string
  softCap: string
  saleEndTime: number
  userContribution: string
  userTokens: string
  phase: "PREPARATION" | "ACTIVE" | "FINALIZATION" | "CLAIM" | "ENDED"
}

interface IDOContextType {
  idoData: IDOData
  loading: boolean
  error: string | null
  purchaseTokens: (pUSDAmount: string) => Promise<void>
  claimTokens: () => Promise<void>
  claimRefund: () => Promise<void>
  refreshData: () => Promise<void>
}

const IDOContext = createContext<IDOContextType | undefined>(undefined)

// Mock contract addresses (replace with actual deployed addresses)
const IDO_CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"
const TRUTH_TOKEN_ADDRESS = "0x0987654321098765432109876543210987654321"
const PUSD_TOKEN_ADDRESS = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"

export function IDOProvider({ children }: { children: ReactNode }) {
  const { provider, account, isConnected } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [idoData, setIdoData] = useState<IDOData>({
    saleActive: true,
    tokenPrice: "0.15", // Updated comment to show PAU Dollar (pUSD) per TRUTH token
    tokensRemaining: "75000000",
    totalRaised: "11250", // Updated comment to show PAU Dollar (pUSD) raised
    hardCap: "22500", // Updated comment to show PAU Dollar (pUSD) hard cap
    softCap: "7500", // Updated comment to show PAU Dollar (pUSD) soft cap
    saleEndTime: Date.now() + 86400000 * 3, // 3 days from now
    userContribution: "0",
    userTokens: "0",
    phase: "ACTIVE",
  })

  const refreshData = async () => {
    if (!provider || !account) return

    setLoading(true)
    try {
      // In real implementation, fetch data from smart contract
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock updated data
      setIdoData((prev) => ({
        ...prev,
        totalRaised: (Number.parseFloat(prev.totalRaised) + Math.random() * 100).toFixed(0),
        tokensRemaining: (Number.parseFloat(prev.tokensRemaining) - Math.random() * 1000).toFixed(0),
      }))

      setError(null)
    } catch (err) {
      setError("Failed to refresh IDO data")
      console.error("Refresh error:", err)
    } finally {
      setLoading(false)
    }
  }

  const purchaseTokens = async (pUSDAmount: string) => {
    if (!provider || !account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const amount = Number.parseFloat(pUSDAmount)
      if (amount < 10 || amount > 2000) {
        throw new Error("Amount must be between 10 and 2000 PAU Dollar (pUSD)") // Updated error message to show PAU Dollar (pUSD)
      }

      const signer = await provider.getSigner()

      const tx = await signer.sendTransaction({
        to: PUSD_TOKEN_ADDRESS,
        value: 0, // No ETH value for token transfer
        gasLimit: 150000,
      })

      toast({
        title: "Transaction Submitted",
        description: `Transaction hash: ${tx.hash}`,
      })

      await tx.wait()

      setIdoData((prev) => ({
        ...prev,
        userContribution: (Number.parseFloat(prev.userContribution) + amount).toString(),
        userTokens: (Number.parseFloat(prev.userTokens) + amount / Number.parseFloat(prev.tokenPrice)).toString(),
        totalRaised: (Number.parseFloat(prev.totalRaised) + amount).toString(),
        tokensRemaining: (
          Number.parseFloat(prev.tokensRemaining) -
          amount / Number.parseFloat(prev.tokenPrice)
        ).toString(),
      }))

      toast({
        title: "Purchase Successful",
        description: `Successfully purchased ${(amount / Number.parseFloat(idoData.tokenPrice)).toFixed(2)} TRUTH tokens with PAU Dollar (pUSD)!`, // Updated success message to show PAU Dollar (pUSD)
      })
    } catch (err: any) {
      console.error("Purchase error:", err)
      toast({
        title: "Purchase Failed",
        description: err.message || "Transaction failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const claimTokens = async () => {
    if (!provider || !account) return

    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Tokens Claimed",
        description: "Successfully claimed your TRUTH tokens!",
      })
    } catch (err) {
      console.error("Claim error:", err)
      toast({
        title: "Claim Failed",
        description: "Failed to claim tokens. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const claimRefund = async () => {
    if (!provider || !account) return

    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Refund Claimed",
        description: "Successfully claimed your refund!",
      })
    } catch (err) {
      console.error("Refund error:", err)
      toast({
        title: "Refund Failed",
        description: "Failed to claim refund. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected) {
      refreshData()
      const interval = setInterval(refreshData, 30000)
      return () => clearInterval(interval)
    }
  }, [isConnected, provider, account])

  const value = {
    idoData,
    loading,
    error,
    purchaseTokens,
    claimTokens,
    claimRefund,
    refreshData,
  }

  return <IDOContext.Provider value={value}>{children}</IDOContext.Provider>
}

export function useIDO() {
  const context = useContext(IDOContext)
  if (context === undefined) {
    throw new Error("useIDO must be used within an IDOProvider")
  }
  return context
}
