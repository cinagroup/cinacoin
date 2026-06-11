"use client";

import dynamic from "next/dynamic";
import { Sidebar } from "@/components/Sidebar";
import { StatsCards } from "@/components/StatsCards";
import { SystemOverview } from "@/components/SystemOverview";
import { RecentActivity } from "@/components/RecentActivity";

// Lazy-load heavy chart components (recharts is ~500KB)
const UserGrowthChart = dynamic(() => import("@/components/UserGrowthChart").then(m => ({ default: m.UserGrowthChart })), {
  loading: () => <div className="h-64 flex items-center justify-center text-ink-mute">Loading chart...</div>,
  ssr: false,
});
const ApiCallsChart = dynamic(() => import("@/components/ApiCallsChart").then(m => ({ default: m.ApiCallsChart })), {
  loading: () => <div className="h-64 flex items-center justify-center text-ink-mute">Loading chart...</div>,
  ssr: false,
});

export default function Home() {
  return (
    <div className="flex min-h-screen bg-canvas-soft">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-display-sm text-ink">
              Dashboard Overview
            </h1>
            <p className="text-body-color mt-1">
              Welcome to CinaCoin Unified Dashboard
            </p>
          </header>

          <StatsCards />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <UserGrowthChart />
            <ApiCallsChart />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <SystemOverview />
            <RecentActivity />
          </div>
        </div>
      </main>
    </div>
  );
}
