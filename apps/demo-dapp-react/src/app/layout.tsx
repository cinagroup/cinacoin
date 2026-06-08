import React from 'react';
import type { Metadata } from 'next';
import CinacoinClientProvider from './CinacoinClientProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cinacoin SDK Demo - Multi-Chain Wallet Integration',
  description: 'Interactive demo showcasing Cinacoin SDK: connect wallets, sign messages, send transactions, batch operations, and NFT gallery across 16+ chains.',
  keywords: ['Cinacoin', 'SDK', 'Web3', 'Wallet', 'Multi-chain', 'Ethereum', 'Polygon', 'BSC', 'Demo'],
  authors: [{ name: 'Cinacoin Team' }],
  openGraph: {
    title: 'Cinacoin SDK Demo',
    description: 'Interactive multi-chain wallet integration demo',
    type: 'website',
    url: 'https://react.cinacoin.com',
    siteName: 'Cinacoin',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Cinacoin SDK Demo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cinacoin SDK Demo',
    description: 'Interactive multi-chain wallet integration demo',
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
      <body>
        <CinacoinClientProvider>
          {children}
        </CinacoinClientProvider>
      </body>
    </html>
  );
}
