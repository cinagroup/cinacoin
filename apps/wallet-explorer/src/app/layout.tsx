import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CinaCoin Wallet Explorer",
  description: "Explore wallets, transactions, and balances on the CinaCoin blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas-soft text-ink antialiased">
        <div className="mx-auto max-w-6xl px-4 py-8">
          {children}
        </div>
      </body>
    </html>
  );
}
