import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CinaCoin Backend Dashboard",
  description: "Backend administration panel for CinaCoin platform",
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
