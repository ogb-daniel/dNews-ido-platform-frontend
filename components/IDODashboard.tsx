"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIDO } from "@/contexts/IDOContext";
import { useWallet } from "@/contexts/WalletContext";
import {
  Coins,
  Clock,
  Target,
  TrendingUp,
  Wallet,
  ExternalLink,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function IDODashboard() {
  const {
    idoData,
    loading,
    purchaseTokens,
    claimTokens,
    claimRefund,
    approvepUSD,
    getpUSDBalance,
    getpUSDAllowance,
  } = useIDO();
  const { isConnected, account } = useWallet();
  const [pUSDAmount, setPUSDAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pUSDBalance, setPUSDBalance] = useState("0");
  const [pUSDAllowance, setPUSDAllowance] = useState("0");
  const [needsApproval, setNeedsApproval] = useState(false);

  const calculateTokenAmount = (pUSD: string) => {
    if (!pUSD || isNaN(Number.parseFloat(pUSD))) return "0";
    return (
      Number.parseFloat(pUSD) / Number.parseFloat(idoData.tokenPrice)
    ).toFixed(2);
  };

  // Fetch pUSD balance and allowance
  useEffect(() => {
    if (isConnected && account) {
      const fetchBalances = async () => {
        try {
          const [balance, allowance] = await Promise.all([
            getpUSDBalance(),
            getpUSDAllowance()
          ]);
          setPUSDBalance(balance);
          setPUSDAllowance(allowance);
        } catch (error) {
          console.error("Error fetching balances:", error);
        }
      };
      fetchBalances();
    }
  }, [isConnected, account, getpUSDBalance, getpUSDAllowance]);

  // Check if approval is needed when amount changes
  useEffect(() => {
    if (pUSDAmount && pUSDAllowance) {
      const amount = parseFloat(pUSDAmount);
      const allowance = parseFloat(pUSDAllowance);
      setNeedsApproval(amount > allowance);
    } else {
      setNeedsApproval(false);
    }
  }, [pUSDAmount, pUSDAllowance]);

  const handleApprove = async () => {
    if (!pUSDAmount || !isConnected) return;

    setIsSubmitting(true);
    try {
      const tx = await approvepUSD(pUSDAmount);
      if (tx) {
        // Refresh allowance after approval
        const newAllowance = await getpUSDAllowance();
        setPUSDAllowance(newAllowance);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePurchase = async () => {
    if (!pUSDAmount || !isConnected) return;

    const amount = Number.parseFloat(pUSDAmount);
    
    // Check balance
    if (amount > parseFloat(pUSDBalance)) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough pUSD tokens",
        variant: "destructive",
      });
      return;
    }

    // Validate contribution limits
    const currentContribution = parseFloat(idoData.userContribution);
    const newTotal = currentContribution + amount;

    if (amount < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum contribution: 10 pUSD",
        variant: "destructive",
      });
      return;
    }

    if (newTotal > 2000) {
      toast({
        title: "Invalid Amount",
        description: `Maximum total contribution: 2000 pUSD. You can contribute ${(
          2000 - currentContribution
        ).toFixed(2)} more pUSD.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const tx = await purchaseTokens(pUSDAmount);
      if (tx) {
        setPUSDAmount("");
        // Refresh balances
        const [newBalance, newAllowance] = await Promise.all([
          getpUSDBalance(),
          getpUSDAllowance()
        ]);
        setPUSDBalance(newBalance);
        setPUSDAllowance(newAllowance);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaim = async () => {
    if (!isConnected) return;

    setIsSubmitting(true);
    try {
      await claimTokens();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefund = async () => {
    if (!isConnected) return;

    setIsSubmitting(true);
    try {
      await claimRefund();
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage =
    (Number.parseFloat(idoData.totalRaised) /
      Number.parseFloat(idoData.hardCap)) *
    100;
  const timeRemaining = Math.max(0, idoData.saleEndTime - Date.now());
  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor(
    (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  return (
    <div className="space-y-6" data-testid="ido-dashboard" role="main">
      {/* IDO Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Number.parseFloat(idoData.totalRaised).toLocaleString()} pUSD
            </div>
            <p className="text-xs text-muted-foreground">
              of {Number.parseFloat(idoData.hardCap).toLocaleString()} PAU
              Dollar (pUSD) hard cap
            </p>
          </CardContent>
        </Card>

        <Card
          className="glass animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tokens Remaining
            </CardTitle>
            <Coins className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {Number.parseFloat(idoData.tokensRemaining).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              TRUTH tokens available
            </p>
          </CardContent>
        </Card>

        <Card
          className="glass animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Price</CardTitle>
            <Target className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {idoData.tokenPrice} pUSD
            </div>
            <p className="text-xs text-muted-foreground">
              per TRUTH token (PAU Dollar)
            </p>
          </CardContent>
        </Card>

        <Card
          className="glass animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Time Remaining
            </CardTitle>
            <Clock className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">
              {daysRemaining}d {hoursRemaining}h
            </div>
            <p className="text-xs text-muted-foreground">until sale ends</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="glass animate-slide-up">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>IDO Progress</CardTitle>
            <Badge variant={idoData.saleActive ? "default" : "secondary"}>
              {idoData.phase}
            </Badge>
          </div>
          <CardDescription>
            {progressPercentage.toFixed(1)}% of hard cap reached
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>
              Soft Cap: {Number.parseFloat(idoData.softCap).toLocaleString()}{" "}
              PAU Dollar (pUSD)
            </span>
            <span>
              Hard Cap: {Number.parseFloat(idoData.hardCap).toLocaleString()}{" "}
              PAU Dollar (pUSD)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Interface */}
      <Tabs defaultValue="purchase" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="purchase">Purchase Tokens</TabsTrigger>
          <TabsTrigger value="portfolio">Your Portfolio</TabsTrigger>
        </TabsList>

        <TabsContent value="purchase">
          <Card className="glass-strong animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Coins className="h-5 w-5 text-primary" />
                <span>Purchase TRUTH Tokens</span>
              </CardTitle>
              <CardDescription>
                Minimum: 10 PAU Dollar (pUSD) • Maximum: 2000 PAU Dollar (pUSD)
                per address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isConnected && (
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <div className="flex justify-between items-center text-sm">
                    <span>Your pUSD Balance:</span>
                    <span className="font-medium">{parseFloat(pUSDBalance).toLocaleString()} pUSD</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pusd-amount">pUSD Amount</Label>
                  <Input
                    id="pusd-amount"
                    type="number"
                    placeholder="Enter pUSD amount"
                    value={pUSDAmount}
                    onChange={(e) => setPUSDAmount(e.target.value)}
                    min="10"
                    max="2000"
                    step="1"
                    disabled={idoData.phase !== "ACTIVE"}
                    aria-label="pUSD amount to purchase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="truth-amount">TRUTH Tokens</Label>
                  <Input
                    id="truth-amount"
                    type="text"
                    placeholder="TRUTH tokens"
                    value={calculateTokenAmount(pUSDAmount)}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>

              {pUSDAmount && (
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>PAU Dollar Amount:</span>
                    <span className="font-medium">{pUSDAmount} pUSD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>TRUTH Tokens:</span>
                    <span className="font-medium">
                      {calculateTokenAmount(pUSDAmount)} TRUTH
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Price per Token:</span>
                    <span className="font-medium">
                      {idoData.tokenPrice} PAU Dollar (pUSD)
                    </span>
                  </div>
                </div>
              )}

              {/* Purchase/Approval Buttons */}
              {idoData.phase === "ACTIVE" && (
                <div className="space-y-2">
                  {needsApproval ? (
                    <Button
                      onClick={handleApprove}
                      disabled={
                        !isConnected || !pUSDAmount || isSubmitting || loading
                      }
                      className="w-full"
                      size="lg"
                      variant="outline"
                    >
                      {isSubmitting ? "Approving..." : "Approve pUSD"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handlePurchase}
                      disabled={
                        !isConnected || !pUSDAmount || isSubmitting || loading
                      }
                      className="w-full animate-pulse-glow"
                      size="lg"
                    >
                      {isSubmitting
                        ? "Processing..."
                        : !isConnected
                        ? "Connect Wallet First"
                        : "Purchase Tokens"}
                    </Button>
                  )}
                </div>
              )}

              {/* Claim Tokens Button */}
              {idoData.phase === "CLAIM" &&
                parseFloat(idoData.userTokens) > 0 && (
                  <Button
                    onClick={handleClaim}
                    disabled={!isConnected || isSubmitting}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? "Claiming..." : "Claim TRUTH Tokens"}
                  </Button>
                )}

              {/* Refund Button */}
              {idoData.phase === "ENDED" &&
                parseFloat(idoData.totalRaised) < parseFloat(idoData.softCap) &&
                parseFloat(idoData.userContribution) > 0 && (
                  <Button
                    onClick={handleRefund}
                    disabled={!isConnected || isSubmitting}
                    className="w-full"
                    size="lg"
                    variant="destructive"
                  >
                    {isSubmitting ? "Processing..." : "Claim Refund"}
                  </Button>
                )}

              {/* IDO Not Active Message */}
              {idoData.phase === "PREPARATION" && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    IDO hasn't started yet
                  </p>
                </div>
              )}

              {idoData.phase === "ENDED" &&
                parseFloat(idoData.totalRaised) >=
                  parseFloat(idoData.softCap) && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      IDO has ended successfully
                    </p>
                  </div>
                )}

              {/* Validation Messages */}
              {pUSDAmount && (
                <>
                  {parseFloat(pUSDAmount) > 0 &&
                    parseFloat(pUSDAmount) < 10 && (
                      <p className="text-sm text-destructive">
                        Minimum contribution: 10 pUSD
                      </p>
                    )}
                  {parseFloat(pUSDAmount) > parseFloat(pUSDBalance) && (
                    <p className="text-sm text-destructive">
                      Insufficient pUSD balance
                    </p>
                  )}
                  {parseFloat(pUSDAmount) +
                    parseFloat(idoData.userContribution) >
                    2000 && (
                    <p className="text-sm text-destructive">
                      Maximum total contribution: 2000 pUSD. You can contribute{" "}
                      {(2000 - parseFloat(idoData.userContribution)).toFixed(2)}{" "}
                      more pUSD.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio">
          <Card className="glass-strong animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="h-5 w-5 text-secondary" />
                <span>Your Portfolio</span>
              </CardTitle>
              <CardDescription>
                Your contribution and token allocation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isConnected ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                      <div className="text-sm text-muted-foreground">pUSD Balance</div>
                      <div className="text-2xl font-bold text-accent">
                        {Number.parseFloat(pUSDBalance).toLocaleString()} pUSD
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="text-sm text-muted-foreground">
                        Your Contribution
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {Number.parseFloat(
                          idoData.userContribution
                        ).toLocaleString()}{" "}
                        pUSD
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/5 border border-secondary/20">
                      <div className="text-sm text-muted-foreground">
                        Your Tokens
                      </div>
                      <div className="text-2xl font-bold text-secondary">
                        {Number.parseFloat(idoData.userTokens).toFixed(2)} TRUTH
                      </div>
                    </div>
                  </div>

                  {Number.parseFloat(idoData.userContribution) > 0 && (
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Transaction History
                        </span>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View on Etherscan
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        You have successfully contributed{" "}
                        {Number.parseFloat(
                          idoData.userContribution
                        ).toLocaleString()}{" "}
                        PAU Dollar (pUSD) to the TRUTH Token IDO.
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Connect your wallet to view your portfolio
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
