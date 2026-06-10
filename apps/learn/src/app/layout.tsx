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
        <ResponsiveShell>{children}</ResponsiveShell>
      </body>
    </html>
  );
}
