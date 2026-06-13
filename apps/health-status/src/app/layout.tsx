import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider, I18nProvider } from "@/providers";

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
    default: "CinaCoin Health Status",
    template: "%s | CinaCoin Status",
  },
  description: "Real-time system health status and uptime monitoring for CinaCoin services. Check operational status of all platform components.",
  keywords: ["CinaCoin", "status", "health", "uptime", "monitoring", "service status"],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: "CinaCoin",
    title: "CinaCoin Health Status",
    description: "Real-time system health status for CinaCoin services",
  },
  twitter: {
    card: "summary",
    title: "CinaCoin Health Status",
    description: "Real-time system health status for CinaCoin services",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} data-theme="dark">
      <body className="min-h-screen antialiased bg-[var(--cc-canvas)] font-sans">
        <ThemeProvider>
          <I18nProvider>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-[var(--cc-ink)] focus:rounded">
              Skip to main content
            </a>
            <main id="main-content" className="mx-auto max-w-4xl px-4 py-8">
              {children}
            </main>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
