import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Cinacoin Cloud Dashboard',
  description: 'Developer portal for Cinacoin — manage projects, API keys, and usage analytics',
  icons: { icon: '/logo.svg' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)] antialiased">
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
