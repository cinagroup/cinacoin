"use client";

import { useAuth } from "@/lib/AuthProvider";
import { aggregateStatusLabel, useWorkerHealth } from "@/hooks/useWorkerHealth";
import { useTheme } from "@/providers/ThemeProvider";
import { Brand } from "@cinacoin/ui";
import { GlobalSearch } from "./GlobalSearch";

interface HeaderProps {
  onMenuToggle: () => void;
  refreshInterval?: number;
}

export default function Header({ onMenuToggle, refreshInterval = 15000 }: HeaderProps) {
  const { user, status, doLogout } = useAuth();
  const { allHealthy, degradedCount, downCount, checking } = useWorkerHealth(refreshInterval);
  const { theme, toggle } = useTheme();

  const isAuthenticated = status === "authenticated";
  const displayName = user
    ? user.username || `${user.email.slice(0, 2)}…${user.email.slice(-4)}`
    : "";

  const statusBadge = aggregateStatusLabel(allHealthy, degradedCount, downCount, checking);

  // Determine dot color for health indicator
  const dotColor =
    downCount > 0
      ? "bg-[var(--cc-error)]"
      : degradedCount > 0
        ? "bg-[var(--cc-warning)]"
        : checking
          ? "bg-[var(--cc-muted)] animate-pulse"
          : "bg-[var(--cc-success)] animate-pulse";

  return (
    <header className="cc-navbar flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-[var(--cc-radius-sm)] text-[var(--cc-muted)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Toggle sidebar"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Brand href="/" logoSrc="/logo.png" sublabel="Dashboard" size={28} as="span" />
        <div className="min-w-0">
          <h2 className="cc-body-md-strong text-[var(--cc-ink)] truncate">Backend dashboard.</h2>
          <p className="cc-caption text-[var(--cc-muted)] hidden sm:block">Cloudflare Workers Management</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <GlobalSearch />

        {/* Health status badge */}
        <span className="cc-badge">
          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${dotColor}`} />
          <span className="hidden sm:inline">{statusBadge.label}</span>
          <span className="sm:hidden">
            {downCount > 0 ? 'Down' : degradedCount > 0 ? 'Degraded' : 'OK'}
          </span>
        </span>

        {isAuthenticated && (
          <>
            <span className="cc-badge hidden sm:inline-flex">
              <span className="w-1.5 h-1.5 rounded-full mr-2 bg-[var(--cc-success)]" />
              <span className="cc-caption-mono">{displayName}</span>
            </span>
            <button
              onClick={doLogout}
              className="cc-btn-secondary-sm"
            >
              Logout
            </button>
          </>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          className="p-2 rounded-full text-[var(--cc-muted)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          {theme === "light" ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="5" />
              <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
