import type { Metadata } from "next";
import { Geist } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

// Geist fonts: geometric sans + monospace for modern blockchain UI
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});
const geistMono = GeistMono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

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
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <body className={`min-h-screen ${geist.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
