import type { Metadata } from "next";
import "./globals.css";
import ResponsiveShell from "@/components/ResponsiveShell";

export const metadata: Metadata = {
  title: "Cinacoin Learn — Web3 Education Platform",
  description:
    "Learn Web3 development with Cinacoin. Tutorials on wallet integration, multichain development, and best practices.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg-primary text-text-primary">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded">
          Skip to main content
        </a>
        <main id="main-content">
          <ResponsiveShell>{children}</ResponsiveShell>
        </main>
      </body>
    </html>
  );
}
