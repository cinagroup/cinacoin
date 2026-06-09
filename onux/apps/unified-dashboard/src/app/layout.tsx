import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/providers";
import DashboardLayout from "@/components/DashboardLayout";

export const metadata: Metadata = {
  title: "Cinacoin — Unified Dashboard",
  description:
    "Single pane of glass across all Cinacoin applications and services",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Cinacoin — Unified Dashboard",
    description:
      "Single pane of glass across all Cinacoin applications and services",
    type: "website",
    siteName: "Cinacoin",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-[var(--cc-canvas-soft)] min-h-screen">
        <a href="#main-content" className="cc-skip-link">
          Skip to main content
        </a>
        <Providers>
          <DashboardLayout>{children}</DashboardLayout>
        </Providers>
      </body>
    </html>
  );
}
