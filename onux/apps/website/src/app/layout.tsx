import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Providers } from '@/providers'



const siteUrl = 'https://cinacoin.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Cinacoin — Onchain Access, Simplified',
    template: '%s | Cinacoin',
  },
  description: 'The onchain access layer for wallets, dApps, and chains. Connect, authenticate, and transact across 16+ blockchain networks.',
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
    description: 'The onchain access layer for wallets, dApps, and chains. Connect, authenticate, and transact across 16+ blockchain networks.',
    images: [
      { url: '/og-image.png', width: 1200, height: 630, alt: 'Cinacoin — Onchain Access, Simplified' },
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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://github.com" />
        <link rel="preconnect" href="https://github.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': `${siteUrl}#organization`,
                  name: 'Cinacoin',
                  url: siteUrl,
                  logo: `${siteUrl}/logo.png`,
                  sameAs: [
                    'https://github.com/cinagroup',
                    'https://twitter.com/cinacoin',
                  ],
                },
                {
                  '@type': 'WebSite',
                  '@id': `${siteUrl}#website`,
                  url: siteUrl,
                  name: 'Cinacoin',
                  description: 'The onchain access layer for wallets, dApps, and chains. Connect, authenticate, and transact across 16+ blockchain networks.',
                  publisher: {
                    '@id': `${siteUrl}#organization`,
                  },
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                      '@type': 'EntryPoint',
                      urlTemplate: `${siteUrl}/docs/search?q={search_term_string}`,
                    },
                    'query-input': 'required name=search_term_string',
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="antialiased bg-[var(--cc-canvas-soft)] font-sans">
        <a href="#main-content" className="cc-skip-link">Skip to main content</a>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
