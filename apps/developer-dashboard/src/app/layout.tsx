import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Cinacoin Developer Dashboard",
  description: "Manage your Cinacoin projects, API keys, and analytics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 p-6 bg-canvas-soft-2">{children}</main>
        </div>
      </body>
    </html>
  );
}
