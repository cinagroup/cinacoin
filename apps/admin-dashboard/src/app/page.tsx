"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Menu, Search, Bell } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import ServiceStatus from "@/components/ServiceStatus";
import ResourceTable from "@/components/ResourceTable";
import QuickActions from "@/components/QuickActions";

const QuotaUsage = dynamic(() => import("@/components/QuotaUsage"), {
  loading: () => <div className="h-64 flex items-center justify-center text-[var(--cc-muted)]">Loading chart...</div>,
  ssr: false,
});

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-[var(--cc-canvas)] border-b border-[var(--cc-hairline)] h-14 flex items-center px-6 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-[var(--cc-radius-sm)] hover:bg-[var(--cc-canvas-soft-2)] mr-4 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-[var(--cc-body)]" />
          </button>
          <div className="flex-1 flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--cc-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search resources..."
                className="pl-10 pr-4 py-2 bg-[var(--cc-canvas-soft)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] text-[var(--text-body-sm)] w-80 focus:outline-none focus:border-[var(--cc-link)] focus:ring-2 focus:ring-[var(--cc-link)]/10 transition-colors"
                aria-label="Search resources"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-[var(--cc-radius-sm)] hover:bg-[var(--cc-canvas-soft-2)] relative transition-colors" aria-label="Notifications">
              <Bell className="w-5 h-5 text-[var(--cc-body)]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--cc-error)] rounded-full"></span>
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-[var(--cc-link)] to-[var(--cc-violet)] rounded-full flex items-center justify-center">
              <span className="text-[var(--text-body-sm)] font-medium text-white">A</span>
            </div>
          </div>
        </header>
        <Breadcrumbs />

        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <h1 className="cc-display-sm text-[var(--cc-ink)]">Cloud overview.</h1>
            <p className="cc-body-sm text-[var(--cc-body)] mt-1">
              6 services running · 12 active resources · $677.75/mo estimated
            </p>
          </div>

          {/* Service Status */}
          <div className="mb-6">
            <h2 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Service status.</h2>
            <ServiceStatus />
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <QuickActions />
          </div>

          {/* Resource Table and Quota */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <ResourceTable />
            </div>
            <div>
              <QuotaUsage />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
