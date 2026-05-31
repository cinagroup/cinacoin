"use client";

import { useAuth } from "@/lib/AuthProvider";
import { useWorkerHealth, aggregateStatusLabel } from "@/hooks/useWorkerHealth";

export default function Header() {
  const { address, isLoggedIn, doLogout } = useAuth();
  const { allHealthy, degradedCount, downCount, checking } = useWorkerHealth(15000);

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "";

  const statusBadge = aggregateStatusLabel(allHealthy, degradedCount, downCount, checking);

  // Determine dot color for health indicator
  const dotColor =
    downCount > 0
      ? "bg-dashboard-danger"
      : degradedCount > 0
        ? "bg-dashboard-warning"
        : checking
          ? "bg-dashboard-muted animate-pulse"
          : "bg-dashboard-success animate-pulse";

  const borderColor =
    downCount > 0
      ? "border-dashboard-danger/30"
      : degradedCount > 0
        ? "border-dashboard-warning/30"
        : checking
          ? "border-dashboard-border"
          : "border-dashboard-success/30";

  const bgColor =
    downCount > 0
      ? "bg-dashboard-danger/10"
      : degradedCount > 0
        ? "bg-dashboard-warning/10"
        : checking
          ? "bg-dashboard-muted/10"
          : "bg-dashboard-success/10";

  return (
    <header className="bg-dashboard-surface/80 backdrop-blur border-b border-dashboard-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Cinacoin" className="h-8 w-8 rounded-lg" />
        <div>
          <h2 className="text-xl font-semibold text-white">CinaCoin Backend</h2>
          <p className="text-sm text-dashboard-muted">Cloudflare Workers Management</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${bgColor} border ${borderColor}`}>
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className={`text-xs font-medium ${statusBadge.color}`}>{statusBadge.label}</span>
        </div>

        {isLoggedIn && (
          <>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="text-xs text-indigo-300 font-mono">{shortAddress}</span>
            </div>
            <button
              onClick={doLogout}
              className="px-3 py-1.5 text-xs font-medium text-red-400 border border-red-500/30 rounded-full hover:bg-red-500/10 transition-colors"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
