import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import AuthProvider from "@/lib/AuthProvider";
import AuthGuard from "@/components/AuthGuard";

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
    <html lang="en">
      <body className="bg-dashboard-bg min-h-screen">
        <AuthProvider>
          <AuthGuard>
            <AppShell>{children}</AppShell>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
