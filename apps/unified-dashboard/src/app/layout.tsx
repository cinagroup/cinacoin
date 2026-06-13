import type { Metadata } from "next";
import localFont from 'next/font/local';
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

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
  title: {
    default: "CinaCoin Unified Dashboard",
    template: "%s | CinaCoin Dashboard",
  },
  description: "Unified dashboard for CinaCoin platform monitoring. View system metrics, user growth, API calls, and real-time activity.",
  keywords: ["CinaCoin", "dashboard", "monitoring", "metrics", "analytics"],
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans">
        <AuthProvider>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[var(--cc-primary)] text-white rounded">
            Skip to main content
          </a>
          <main id="main-content">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
