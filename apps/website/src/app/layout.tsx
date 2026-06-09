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
  metadataBase: new URL('https://cinacoin.com'),
  title: {
    default: 'CINAcoin - The Future of Decentralized Finance',
    template: '%s | CINAcoin',
  },
  description: 'Build, deploy, and scale your Web3 applications with CINAcoin. Multi-chain wallet, cloud infrastructure, and DeFi tools.',
  applicationName: 'CINAcoin',
  keywords: ['CINAcoin', 'cryptocurrency', 'DeFi', 'Web3', 'blockchain', 'wallet', 'staking', 'exchange', 'multi-chain'],
  authors: [{ name: 'CINAcoin' }],
  creator: 'CINAcoin',
  publisher: 'CINAcoin',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    siteName: 'CINAcoin',
    title: 'CINAcoin - The Future of Decentralized Finance',
    description: 'Build, deploy, and scale your Web3 applications with CINAcoin.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'CINAcoin' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@cinacoin',
    title: 'CINAcoin - The Future of Decentralized Finance',
    description: 'Build, deploy, and scale your Web3 applications with CINAcoin.',
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
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
