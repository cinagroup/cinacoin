import type { Metadata } from "next";
import { GeistSans, GeistMono } from "geist/font";
import "./globals.css";



export const metadata: Metadata = {
  metadataBase: new URL('https://wallet.cinacoin.com'),
  title: "Wallet Explorer — Cinacoin",
  description:
    "Browse, search, and discover 100+ crypto wallets. Filter by chain, platform, and type.",
  keywords: "wallet explorer, crypto wallets, web3, Cinacoin, wallet discovery",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Wallet Explorer — Cinacoin",
    description: "Browse, search, and discover 100+ crypto wallets. Filter by chain, platform, and type.",
    type: "website",
    url: "https://wallet.cinacoin.com",
    siteName: "Cinacoin Wallet Explorer",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wallet Explorer — Cinacoin",
    description: "Browse, search, and discover 100+ crypto wallets. Filter by chain, platform, and type.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`min-h-screen antialiased ${GeistSans.variable} ${GeistMono.variable}`} style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
