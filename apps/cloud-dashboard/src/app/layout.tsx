import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Cinacoin Cloud Dashboard',
  description: 'Developer portal for Cinacoin — manage projects, API keys, and usage analytics',
  icons: { icon: '/dashboard/logo.svg' },
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
    <html lang="en" data-theme="light" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)] antialiased">
        <ThemeProvider>
          <a href="#main-content" className="cc-skip-link">Skip to main content</a>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
