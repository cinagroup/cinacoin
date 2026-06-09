import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CinaCoin Health Status",
  description: "Real-time system health status for CinaCoin services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="mx-auto max-w-4xl px-4 py-8">
          {children}
        </div>
      </body>
    </html>
  );
}
