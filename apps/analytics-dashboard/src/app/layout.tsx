import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
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
  icons: { icon: '/analytics/logo.svg' },
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
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={`${inter.className} antialiased`} style={{ background: 'var(--cc-canvas-soft)', color: 'var(--cc-ink)' }}>
        {children}
      </body>
    </html>
  );
}
