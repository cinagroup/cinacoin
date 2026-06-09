"use client";

import { useState } from "react";
import GlobalHeader from "@/components/GlobalHeader";
import Sidebar from "@/components/Sidebar";
import AppSwitcher from "@/components/AppSwitcher";

/**
 * Main dashboard layout: GlobalHeader + Sidebar + content area.
 * Responsive: sidebar collapses to drawer on mobile.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — sticky on desktop, drawer on mobile */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-[var(--cc-sidebar-width)] transform transition-transform duration-200 lg:static lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <GlobalHeader
          onMenuClick={() => setSidebarOpen(true)}
          onAppSwitcherClick={() => setAppSwitcherOpen(true)}
        />

        <main
          id="main-content"
          className="flex-1 overflow-y-auto cc-scrollbar p-4 md:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>

      {/* App Switcher Modal (Cmd+K) */}
      <AppSwitcher
        open={appSwitcherOpen}
        onClose={() => setAppSwitcherOpen(false)}
      />
    </div>
  );
}
