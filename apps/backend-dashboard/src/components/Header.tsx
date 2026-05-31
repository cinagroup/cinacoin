"use client";

import { useAuth } from "@/lib/AuthProvider";
import { useWorkerHealth, aggregateStatusLabel } from "@/hooks/useWorkerHealth";

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
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
    <header className="bg-dashboard-surface/80 backdrop-blur border-b border-dashboard-border px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-dashboard-muted hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Toggle sidebar"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <img src="/logo.png" alt="Cinacoin" className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg shrink-0" />
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-semibold text-white truncate">CinaCoin Backend</h2>
          <p className="text-xs sm:text-sm text-dashboard-muted hidden sm:block">Cloudflare Workers Management</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full ${bgColor} border ${borderColor}`}>
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className={`text-xs font-medium hidden sm:inline ${statusBadge.color}`}>{statusBadge.label}</span>
          <span className={`text-xs font-medium sm:hidden ${statusBadge.color}`}>
            {downCount > 0 ? 'Down' : degradedCount > 0 ? 'Degraded' : 'OK'}
          </span>
        </div>

        {isLoggedIn && (
          <>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="text-xs text-indigo-300 font-mono">{shortAddress}</span>
            </div>
            <button
              onClick={doLogout}
              className="px-3 py-1.5 text-xs font-medium text-red-400 border border-red-500/30 rounded-full hover:bg-red-500/10 transition-colors min-h-[36px]"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
