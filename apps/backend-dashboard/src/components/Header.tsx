"use client";

import { useAuth } from "@/lib/AuthProvider";
import { useWorkerHealth, aggregateStatusLabel } from "@/hooks/useWorkerHealth";
import { useTheme } from "@/providers/ThemeProvider";

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { address, isLoggedIn, doLogout } = useAuth();
  const { allHealthy, degradedCount, downCount, checking } = useWorkerHealth(15000);
  const { theme, toggle } = useTheme();

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
          className="lg:hidden p-2 rounded-[var(--cc-radius-sm)] text-dashboard-muted hover:text-[var(--cc-ink)] hover:bg-[var(--cc-canvas)]/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Toggle sidebar"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <img src="/logo.png" alt="Cinacoin logo" className="h-7 w-7 sm:h-8 sm:w-8 rounded-md shrink-0" />
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-semibold tracking-tight text-[var(--cc-ink)] truncate">Cinacoin <span className="text-dashboard-muted font-normal">Backend</span></h2>
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

        {/* Theme Toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-[var(--cc-radius-sm)] text-dashboard-muted hover:text-dashboard-text hover:bg-dashboard-surface-hover transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {isLoggedIn && (
          <>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30">
              <span className="w-2 h-2 rounded-full bg-brand-400" />
              <span className="text-xs text-brand-300 font-mono">{shortAddress}</span>
            </div>
            <button
              onClick={doLogout}
              className="px-3 py-1.5 text-xs font-medium text-[var(--cc-error)] border border-[var(--cc-error)]/30 rounded-full hover:bg-[var(--cc-error)]/10 transition-colors min-h-[36px]"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
