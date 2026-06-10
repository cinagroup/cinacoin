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
        {children}
      </body>
    </html>
  );
}
