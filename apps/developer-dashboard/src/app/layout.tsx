import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/providers/AuthProvider";
import { Providers } from "@/providers";
import CommandPalette from "@/components/CommandPalette";
import DebugPanel from "@/components/DebugPanel";
import OfflineBanner from "@/components/OfflineBanner";

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
  title: "Cinacoin Developer Dashboard",
  description: "Manage your Cinacoin projects, API keys, and analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" className={`dark ${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen font-sans">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Providers>
          <OfflineBanner />
          <AuthProvider>
            <ToastProvider>
              <Sidebar />
              <div className="flex-1 flex flex-col">
                <Navbar />
                <main id="main-content" className="flex-1 p-6 bg-[var(--cc-canvas-soft-2)]">
                  {children}
                </main>
              </div>
              <CommandPalette />
              <DebugPanel />
            </ToastProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
