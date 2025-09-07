"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/contexts/WalletContext"
import { Wallet, Power, AlertTriangle } from "lucide-react"

export function WalletConnection() {
  const { isConnected, account, balance, chainId, connectWallet, disconnectWallet, switchNetwork } = useWallet()

  const isWrongNetwork = chainId && chainId !== 11155111 // Sepolia

  if (!isConnected) {
    return (
      <Card className="glass p-6 animate-fade-in">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
            <p className="text-sm text-muted-foreground">Connect your wallet to participate in the TRUTH Token IDO</p>
          </div>
          <Button onClick={connectWallet} className="w-full animate-pulse-glow" size="lg">
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="glass p-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </span>
              {isWrongNetwork ? (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Wrong Network
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Sepolia
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{Number.parseFloat(balance).toFixed(4)} ETH</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isWrongNetwork && (
            <Button onClick={switchNetwork} variant="outline" size="sm">
              Switch Network
            </Button>
          )}
          <Button onClick={disconnectWallet} variant="ghost" size="sm">
            <Power className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
