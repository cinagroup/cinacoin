"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import Header from "@/components/Header";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useState, useEffect } from "react";

/**
 * Client component that conditionally renders sidebar + header
 * based on the current route.
 * Mobile: Sidebar is a slide-in drawer toggled from Header.
 * Desktop: Sidebar is always visible.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(15000);

  // Read settings from localStorage on mount
  useEffect(() => {
    try {
      const settings = localStorage.getItem("dashboard-settings");
      if (settings) {
        const parsed = JSON.parse(settings);
        setRefreshInterval((parsed.refreshInterval || 15) * 1000);
      }
    } catch { /* ignore */ }
  }, []);

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* Sidebar: hidden on mobile, shown on lg+ */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile drawer sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setMobileSidebarOpen(false)} />
      </div>

      <div className="flex-1 min-w-0">
        <Header onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} refreshInterval={refreshInterval} />
        <Breadcrumbs />
        <main id="main-content" className="p-4 sm:p-6" role="main">{children}</main>
      </div>
    </div>
  );
}
