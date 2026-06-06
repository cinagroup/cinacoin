import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wallet Explorer — Cinacoin",
  description:
    "Browse, search, and discover 100+ crypto wallets. Filter by chain, platform, and type.",
  keywords: "wallet explorer, crypto wallets, web3, Cinacoin, wallet discovery",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]">
        {children}
      </body>
    </html>
  );
}
