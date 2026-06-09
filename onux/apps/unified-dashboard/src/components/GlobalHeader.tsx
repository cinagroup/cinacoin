"use client";

import { useNotifications } from "@/providers/NotificationProvider";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationCenter from "@/components/NotificationCenter";
import { useState } from "react";

interface GlobalHeaderProps {
  onMenuClick: () => void;
  onAppSwitcherClick: () => void;
}

/**
 * Global header with:
 * - Mobile menu toggle
 * - App switcher trigger (Cmd+K)
 * - Notification bell with unread count
 * - Theme toggle
 * - User avatar
 */
export default function GlobalHeader({
  onMenuClick,
  onAppSwitcherClick,
}: GlobalHeaderProps) {
  const { unreadCount } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="h-[var(--cc-header-height)] border-b border-[var(--cc-hairline)] bg-[var(--cc-canvas)] flex items-center px-4 gap-3 sticky top-0 z-30">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden cc-btn-icon"
        aria-label="Open sidebar"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* App switcher trigger */}
      <button
        onClick={onAppSwitcherClick}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--cc-muted)]
                   border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)]
                   hover:border-[var(--cc-hairline-strong)] hover:text-[var(--cc-ink-soft)]
                   transition-colors min-h-[36px]"
        aria-label="Switch application (Cmd+K)"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <span className="text-xs">Search apps...</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono
                        bg-[var(--cc-canvas-soft2)] border border-[var(--cc-hairline)] rounded text-[var(--cc-muted)]">
          ⌘K
        </kbd>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right section */}
      <div className="flex items-center gap-1">
        {/* Mobile app switcher */}
        <button
          onClick={onAppSwitcherClick}
          className="sm:hidden cc-btn-icon"
          aria-label="Switch application"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="cc-btn-icon relative"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center
                             text-[10px] font-bold text-white bg-[var(--cc-danger)] rounded-full">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {notifOpen && (
            <NotificationCenter onClose={() => setNotifOpen(false)} />
          )}
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User avatar */}
        <button
          className="w-8 h-8 rounded-full bg-[var(--cc-canvas-soft2)] border border-[var(--cc-hairline)]
                     flex items-center justify-center text-sm font-medium text-[var(--cc-ink-soft)]
                     hover:border-[var(--cc-hairline-strong)] transition-colors ml-1"
          aria-label="User menu"
        >
          U
        </button>
      </div>
    </header>
  );
}
