import React from 'react';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import CinacoinClientProvider from './CinacoinClientProvider';
import './globals.css';

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
  title: 'CinaCoin SDK demo. Multi-chain wallet integration.',
  description: 'Interactive demo showcasing CinaCoin SDK: connect wallets, sign messages, send transactions, batch operations, and NFT gallery across 16+ chains.',
  keywords: ['CinaCoin', 'SDK', 'Web3', 'Wallet', 'Multi-chain', 'Ethereum', 'Polygon', 'BSC', 'Demo'],
  authors: [{ name: 'CinaCoin Team' }],
  openGraph: {
    title: 'CinaCoin SDK demo.',
    description: 'Interactive multi-chain wallet integration demo.',
    type: 'website',
    url: 'https://react.cinacoin.com',
    siteName: 'CinaCoin',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CinaCoin SDK demo.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CinaCoin SDK demo.',
    description: 'Interactive multi-chain wallet integration demo.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: 'https://react.cinacoin.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <a href="#main-content" className="sr-only focus:not-sr-only" style={{ position: 'fixed', top: 'var(--cc-space-md)', left: 'var(--cc-space-md)', zIndex: 50, padding: 'var(--cc-space-xs) var(--cc-space-md)', background: 'var(--cc-accent)', color: 'var(--cc-on-primary)', borderRadius: 'var(--cc-radius-md)', fontSize: 'var(--cc-text-sm)', fontWeight: 'var(--cc-weight-medium)', textDecoration: 'none' }}>
          Skip to main content.
        </a>
        <CinacoinClientProvider>
          <main id="main-content">
            {children}
          </main>
        </CinacoinClientProvider>
      </body>
    </html>
  );
}
