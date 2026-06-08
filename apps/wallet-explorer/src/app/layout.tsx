import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Vercel-style fonts: Inter for geometric sans, JetBrains Mono for monospace
const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: 'swap',
});
const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"], 
  variable: "--font-mono",
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://wallet.cinacoin.com'),
  title: "Wallet Explorer — Cinacoin",
  description:
    "Browse, search, and discover 100+ crypto wallets. Filter by chain, platform, and type.",
  keywords: "wallet explorer, crypto wallets, web3, Cinacoin, wallet discovery",
  icons: { icon: "/wallets/logo.svg" },
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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={`min-h-screen ${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
