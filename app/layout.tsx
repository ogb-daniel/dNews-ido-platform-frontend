import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { WalletProvider } from "@/contexts/WalletContext"
import { IDOProvider } from "@/contexts/IDOContext"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "TRUTH Token IDO - dNews Decentralized Media Platform",
  description:
    "Join the TRUTH Token Initial DEX Offering (IDO) for dNews, the future of decentralized journalism and media.",
  generator: "v0.app",
  keywords: ["TRUTH Token", "IDO", "dNews", "DeFi", "Decentralized Media", "Blockchain"],
  openGraph: {
    title: "TRUTH Token IDO - dNews",
    description: "Join the TRUTH Token Initial DEX Offering (IDO)",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Suspense fallback={<div>Loading...</div>}>
            <WalletProvider>
              <IDOProvider>
                <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
                  {children}
                </div>
                <Toaster />
              </IDOProvider>
            </WalletProvider>
          </Suspense>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
