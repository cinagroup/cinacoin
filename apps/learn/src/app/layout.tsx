import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

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
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-64 p-8 lg:p-12">{children}</main>
        </div>
      </body>
    </html>
  );
}
