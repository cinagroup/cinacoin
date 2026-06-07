import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import AuthProvider from "@/lib/AuthProvider";
import AuthGuard from "@/components/AuthGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Providers } from "@/providers";

export const metadata: Metadata = {
  title: "Cinacoin — Backend Dashboard",
  description: "Management dashboard for Cinacoin Cloudflare Workers services",
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'Cinacoin — Backend Dashboard',
    description: 'Management dashboard for Cinacoin Cloudflare Workers services',
    type: 'website',
    siteName: 'Cinacoin',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cinacoin — Backend Dashboard',
    description: 'Management dashboard for Cinacoin Cloudflare Workers services',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className="bg-[var(--cc-canvas-soft)] min-h-screen">
        <a href="#main-content" className="cc-skip-link">Skip to main content</a>
        <Providers>
          <AuthProvider>
            <AuthGuard>
              <ErrorBoundary>
                <AppShell>{children}</AppShell>
              </ErrorBoundary>
            </AuthGuard>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
