import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/providers";

const geistSans = localFont({
  src: [
    { path: '../../../../packages/design-tokens/assets/Geist-Regular.woff2', weight: '400' },
    { path: '../../../../packages/design-tokens/assets/Geist-Medium.woff2', weight: '500' },
    { path: '../../../../packages/design-tokens/assets/Geist-SemiBold.woff2', weight: '600' },
  ],
  variable: '--font-geist-sans',
});

const geistMono = localFont({
  src: [
    { path: '../../../../packages/design-tokens/assets/GeistMono-Regular.woff2', weight: '400' },
  ],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: {
    default: "Cinacoin Demo",
    template: "%s | Cinacoin Demo",
  },
  description: "Interactive demo showcasing Cinacoin wallet features, transactions, multi-chain support, and DeFi capabilities. Experience the platform risk-free.",
  keywords: ["Cinacoin", "demo", "wallet", "transactions", "multi-chain", "DeFi", "blockchain demo"],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: "Cinacoin",
    title: "Cinacoin Demo",
    description: "Interactive demo for Cinacoin wallet and transactions",
  },
  twitter: {
    card: "summary",
    title: "Cinacoin Demo",
    description: "Interactive demo for Cinacoin wallet and transactions",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--cc-canvas)] focus:text-[var(--cc-ink)] focus:rounded">
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
