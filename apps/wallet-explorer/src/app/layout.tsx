import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Wallet Explorer — Cinacoin",
  description:
    "Browse, search, and discover 100+ crypto wallets. Filter by chain, platform, and type.",
  keywords: "wallet explorer, crypto wallets, web3, Cinacoin, wallet discovery",
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]">
        {children}
      </body>
    </html>
  );
}
