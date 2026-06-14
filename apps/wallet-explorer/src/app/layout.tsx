import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { ThemeProvider, I18nProvider } from "@/providers";

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
    default: "Cinacoin Wallet Explorer",
    template: "%s | Cinacoin Explorer",
  },
  description: "Explore wallets, transactions, and balances on the Cinacoin blockchain. Search addresses, view transaction history, and track token holdings.",
  keywords: ["Cinacoin", "wallet explorer", "blockchain explorer", "transactions", "addresses", "balances"],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: "Cinacoin",
    title: "Cinacoin Wallet Explorer",
    description: "Explore wallets, transactions, and balances on the Cinacoin blockchain",
  },
  twitter: {
    card: "summary",
    title: "Cinacoin Wallet Explorer",
    description: "Explore wallets, transactions, and balances on the Cinacoin blockchain",
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)] antialiased`}>
        <ThemeProvider>
          <I18nProvider>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-[var(--cc-ink)] focus:rounded">
              Skip to main content
            </a>
            <div className="mx-auto max-w-6xl px-4 py-8">
              <Navigation />
              <main id="main-content">
                {children}
              </main>
            </div>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
