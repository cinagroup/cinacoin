import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cinacoin Farcaster App',
  description: 'Cinacoin Farcaster Mini App — wallet, transfer, sign & more',
  openGraph: {
    title: 'Cinacoin Farcaster App',
    description: 'Cinacoin Farcaster Mini App',
    images: ['/og-default.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--color-ink)] text-[var(--color-on-primary)] antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-[var(--cc-ink)] focus:rounded">
          Skip to main content
        </a>
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
