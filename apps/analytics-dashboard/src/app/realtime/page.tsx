"use client";

import dynamic from "next/dynamic";
import SiteHeader from "@/components/SiteHeader";

// Lazy-load heavy realtime dashboard (WebSocket + frequent re-renders)
const RealtimeDashboard = dynamic(() => import("@/components/RealtimeDashboard"), {
  loading: () => <div className="h-64 flex items-center justify-center text-ink-mute">Loading realtime dashboard...</div>,
  ssr: false,
});

export default function RealtimePage() {
  return (
    <div className="min-h-screen bg-[var(--cc-canvas-soft)]">
      {/* Header */}
      <SiteHeader activePage="realtime" breadcrumb="Realtime" />

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-lg py-xl">
        <div className="mb-lg flex items-baseline justify-between">
          <h2 className="text-heading-2 text-[var(--cc-ink)]">Realtime</h2>
          <span className="text-caption text-[var(--cc-muted)]">Streaming live data</span>
        </div>
        <RealtimeDashboard />
      </main>
    </div>
  );
}
