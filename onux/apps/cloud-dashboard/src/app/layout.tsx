import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Cinacoin Cloud Dashboard',
  description: 'Developer portal for Cinacoin — manage projects, API keys, and usage analytics',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'Cinacoin Cloud Dashboard',
    description: 'Developer portal for Cinacoin — manage projects, API keys, and usage analytics',
    type: 'website',
    url: 'https://cloud.cinacoin.com',
    siteName: 'Cinacoin Cloud',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cinacoin Cloud Dashboard',
    description: 'Developer portal for Cinacoin — manage projects, API keys, and usage analytics',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)] antialiased">
        <ThemeProvider>
          <a href="#main-content" className="cc-skip-link">Skip to main content</a>
          <div className="min-h-screen flex">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
