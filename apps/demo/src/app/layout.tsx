import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ToastProvider } from '@/lib/toast';
import { WorkerHealthProvider } from '@/lib/WorkerHealthProvider';
import { Providers } from '@/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

const siteUrl = 'https://demo.cinacoin.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: '%s | Cinacoin',
    default: 'Cinacoin — Wallet Connection Toolkit',
  },
  description: 'Open-source wallet connection toolkit for 16 chains. Connect wallets, swap tokens, bridge chains. Self-hosted, zero vendor lock-in.',
  keywords: ['wallet', 'Web3', 'blockchain', 'cross-chain', 'Cinacoin', 'SDK'],
  authors: [{ name: 'Cinacoin' }],
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'Cinacoin — Wallet Connection Toolkit',
    description: 'Open-source wallet connection toolkit for 16 chains. Connect wallets, swap tokens, bridge chains.',
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Cinacoin',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Cinacoin — Wallet Connection Toolkit',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cinacoin — Wallet Connection Toolkit',
    description: 'Open-source wallet connection toolkit for 16 chains.',
    site: '@cinacoin',
    creator: '@cinacoin',
  },
  alternates: {
    canonical: siteUrl,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={`${inter.className} bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]`}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <Providers>
          <ToastProvider>
            <WorkerHealthProvider>
              {children}
            </WorkerHealthProvider>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  )
}
