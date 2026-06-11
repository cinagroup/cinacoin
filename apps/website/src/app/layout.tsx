import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/providers";

export const metadata: Metadata = {
  metadataBase: new URL('https://cinacoin.com'),
  title: {
    default: 'CinaCoin - The Future of Decentralized Finance',
    template: '%s | CinaCoin',
  },
  description: 'Build, deploy, and scale your Web3 applications with CinaCoin. Multi-chain wallet, cloud infrastructure, and DeFi tools.',
  applicationName: 'CinaCoin',
  keywords: ['CinaCoin', 'cryptocurrency', 'DeFi', 'Web3', 'blockchain', 'wallet', 'staking', 'exchange', 'multi-chain'],
  authors: [{ name: 'CinaCoin' }],
  creator: 'CinaCoin',
  publisher: 'CinaCoin',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    siteName: 'CinaCoin',
    title: 'CinaCoin - The Future of Decentralized Finance',
    description: 'Build, deploy, and scale your Web3 applications with CinaCoin.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'CinaCoin' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@cinacoin',
    title: 'CinaCoin - The Future of Decentralized Finance',
    description: 'Build, deploy, and scale your Web3 applications with CinaCoin.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
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
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[var(--cc-primary)] text-white rounded">
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
