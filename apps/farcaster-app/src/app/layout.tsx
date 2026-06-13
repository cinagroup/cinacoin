import type { Metadata } from 'next';
import localFont from 'next/font/local';
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
  metadataBase: new URL('https://cinacoin-farcaster-app.pages.dev'),
  title: 'CinaCoin Farcaster App',
  description: 'CinaCoin Farcaster Mini App — wallet, transfer, sign & more',
  openGraph: {
    title: 'CinaCoin Farcaster App',
    description: 'CinaCoin Farcaster Mini App',
    images: ['/og-default.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} data-theme="dark">
      <body className={`${geistSans.className} min-h-screen antialiased`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--cc-primary)] focus:text-[var(--cc-on-primary)] focus:rounded-sm">
          Skip to main content
        </a>
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
