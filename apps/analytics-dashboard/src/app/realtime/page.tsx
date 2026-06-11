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
    <div className="min-h-screen bg-canvas-soft">
      {/* Header */}
      <SiteHeader activePage="realtime" breadcrumb="Realtime" />

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-lg py-xl">
        <div className="mb-lg">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">REALTIME</p>
          <h2 className="text-heading-2 text-[var(--cc-ink)]">Realtime dashboard.</h2>
          <p className="text-body text-[var(--cc-body)] mt-xxs">Live metrics and transaction stream.</p>
        </div>
        <RealtimeDashboard />
      </main>
    </div>
  );
}
