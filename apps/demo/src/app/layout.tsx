import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CinaCoin Demo",
    template: "%s | CinaCoin Demo",
  },
  description: "Interactive demo showcasing CinaCoin wallet features, transactions, multi-chain support, and DeFi capabilities. Experience the platform risk-free.",
  keywords: ["CinaCoin", "demo", "wallet", "transactions", "multi-chain", "DeFi", "blockchain demo"],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: "CinaCoin",
    title: "CinaCoin Demo",
    description: "Interactive demo for CinaCoin wallet and transactions",
  },
  twitter: {
    card: "summary",
    title: "CinaCoin Demo",
    description: "Interactive demo for CinaCoin wallet and transactions",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded">
          Skip to main content
        </a>
        <Providers>
          <main id="main-content">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
