import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CinaCoin Unified Dashboard",
  description: "Unified dashboard for CinaCoin platform monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
