"use client";

import { WalletConnection } from "@/components/WalletConnection";
import { IDODashboard } from "@/components/IDODashboard";
import { CountdownTimer } from "@/components/CountdownTimer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIDO } from "@/contexts/IDOContext";
import { CurrencyHelpers, PAYMENT_TOKENS } from "@/lib/contracts";
import {
  Newspaper,
  Shield,
  Users,
  Zap,
  ExternalLink,
  Github,
  Twitter,
} from "lucide-react";

export default function HomePage() {
  const { idoData } = useIDO();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Newspaper className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">dNews</h1>
                <p className="text-xs text-muted-foreground">TRUTH Token IDO</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="hidden sm:inline-flex">
                <Zap className="mr-1 h-3 w-3" />
                Live on Sepolia
              </Badge>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    window.open("https://twitter.com/ogb404", "_blank")
                  }
                >
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    window.open("https://github.com/ogb-daniel", "_blank")
                  }
                >
                  <Github className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center space-y-6 py-12">
          <div className="space-y-4">
            <Badge variant="outline" className="animate-fade-in">
              <Shield className="mr-1 h-3 w-3" />
              Decentralized Media Platform
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground animate-fade-in relative">
              <span className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                TRUTH Token IDO
              </span>
              <span className="relative text-foreground">TRUTH Token IDO</span>
            </h1>
            <p
              className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              Join the future of decentralized journalism. Participate in the
              TRUTH Token Initial DEX Offering and become part of the dNews
              ecosystem.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 animate-slide-up">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {CurrencyHelpers.toNaira(idoData.totalRaised)}
              </div>
              <div className="text-sm text-muted-foreground">
                Raised
              </div>
            </div>
            <div className="hidden sm:block w-px h-8 bg-border"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">
                {Number.parseFloat(idoData.tokensRemaining).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Tokens Left</div>
            </div>
          </div>
        </section>

        {/* Wallet Connection */}
        <section>
          <WalletConnection />
        </section>

        {/* Countdown Timer */}
        <section>
          <CountdownTimer endTime={idoData.saleEndTime} />
        </section>

        {/* IDO Dashboard */}
        <section>
          <IDODashboard />
        </section>

        {/* About Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Newspaper className="h-5 w-5 text-primary" />
                <span>Decentralized Media</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                dNews is building the future of journalism through blockchain
                technology, ensuring transparency and truth in media.
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className="glass animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-secondary" />
                <span>Community Governed</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                TRUTH token holders participate in governance decisions, shaping
                the future of decentralized journalism.
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className="glass animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-accent" />
                <span>Fair Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                40% of tokens allocated to community rewards, ensuring fair
                distribution and long-term sustainability.
              </CardDescription>
            </CardContent>
          </Card>
        </section>

        {/* Tokenomics */}
        <section>
          <Card className="glass-strong animate-slide-up">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Tokenomics</CardTitle>
              <CardDescription>
                Total Supply: 1,000,000,000 TRUTH Tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="text-center p-4 rounded-lg bg-chart-1/10 border border-chart-1/20">
                  <div className="text-2xl font-bold text-chart-1">40%</div>
                  <div className="text-sm text-muted-foreground">
                    Community Rewards
                  </div>
                  <div className="text-xs text-muted-foreground">
                    400M TRUTH
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg bg-chart-2/10 border border-chart-2/20">
                  <div className="text-2xl font-bold text-chart-2">20%</div>
                  <div className="text-sm text-muted-foreground">
                    Team & Founders
                  </div>
                  <div className="text-xs text-muted-foreground">
                    200M TRUTH
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg bg-chart-3/10 border border-chart-3/20">
                  <div className="text-2xl font-bold text-chart-3">15%</div>
                  <div className="text-sm text-muted-foreground">IDO Sale</div>
                  <div className="text-xs text-muted-foreground">
                    150M TRUTH
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg bg-chart-4/10 border border-chart-4/20">
                  <div className="text-2xl font-bold text-chart-4">15%</div>
                  <div className="text-sm text-muted-foreground">
                    DAO Treasury
                  </div>
                  <div className="text-xs text-muted-foreground">
                    150M TRUTH
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg bg-chart-5/10 border border-chart-5/20">
                  <div className="text-2xl font-bold text-chart-5">10%</div>
                  <div className="text-sm text-muted-foreground">
                    Private Investors
                  </div>
                  <div className="text-xs text-muted-foreground">
                    100M TRUTH
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/80 backdrop-blur-md mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Newspaper className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold">dNews TRUTH Token</div>
                <div className="text-sm text-muted-foreground">
                  Decentralized Media Platform
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4 mr-1" />
                Whitepaper
              </Button>
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4 mr-1" />
                Documentation
              </Button>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-border/50 text-center text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} dNews. Built for the decentralized
              future of journalism.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
