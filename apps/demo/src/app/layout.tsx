import type { Metadata, Viewport } from 'next';
// Font loading handled via CSS variables in globals.css
// Geist fonts are loaded through the design system
import { ToastProvider } from '@/lib/toast';
import { WorkerHealthProvider } from '@/lib/WorkerHealthProvider';
import { Providers } from '@/providers';
import './globals.css';



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
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className="bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]">
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
