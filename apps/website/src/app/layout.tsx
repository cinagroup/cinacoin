import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

const siteUrl = 'https://cinacoin.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Cinacoin — Onchain Access, Simplified',
    template: '%s | Cinacoin',
  },
  description: 'The onchain access layer for wallets, dApps, and chains. Connect, authenticate, and transact across 100+ blockchains.',
  keywords: ['blockchain', 'wallet', 'cross-chain', 'Web3', 'SDK', 'dApp'],
  authors: [{ name: 'Cinacoin' }],
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Cinacoin',
    title: 'Cinacoin — Onchain Access, Simplified',
    description: 'The onchain access layer for wallets, dApps, and chains. Connect, authenticate, and transact across 100+ blockchains.',
    images: [
      { url: '/logo.png', width: 1200, height: 630, alt: 'Cinacoin — Onchain Access, Simplified' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cinacoin — Onchain Access, Simplified',
    description: 'The onchain access layer for wallets, dApps, and chains.',
    site: '@cinacoin',
    creator: '@cinacoin',
  },
  alternates: { canonical: siteUrl },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  colorScheme: 'light dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://github.com" />
        <link rel="preconnect" href="https://github.com" />
      </head>
      <body className="antialiased bg-[var(--cc-canvas-soft)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
