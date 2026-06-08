import type { Metadata, Viewport } from 'next';
import { Geist } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});
const geistMono = GeistMono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const siteUrl = 'https://analytics.cinacoin.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Cinacoin Analytics',
    template: '%s | Cinacoin',
  },
  description: 'On-ramp conversion analytics dashboard for Cinacoin. Monitor wallet activity, transaction performance, and conversion rates across chains.',
  keywords: ['analytics', 'dashboard', 'wallet', 'transactions', 'conversion', 'Cinacoin'],
  authors: [{ name: 'Cinacoin' }],
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.ico' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Cinacoin Analytics',
    title: 'Cinacoin Analytics',
    description: 'On-ramp conversion analytics dashboard for Cinacoin.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cinacoin Analytics',
    description: 'On-ramp conversion analytics dashboard for Cinacoin.',
  },
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <body className={`${geist.className} antialiased`} style={{ background: 'var(--cc-canvas-soft)', color: 'var(--cc-ink)' }}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--cc-primary)] focus:text-[var(--cc-on-primary)] focus:rounded-md">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
