"use client";

import React, { useState, useCallback } from "react";

type NavPage = "overview" | "realtime" | "behavior";

interface SiteHeaderProps {
  /** Currently active page — highlights the corresponding nav link */
  activePage: NavPage;
  /** Optional time-range selector (Overview page) */
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  /** Breadcrumb label for sub-pages */
  breadcrumb?: string;
}

const navItems: { key: NavPage; label: string; href: string }[] = [
  { key: "overview", label: "Overview", href: "/" },
  { key: "realtime", label: "Realtime", href: "/realtime" },
  { key: "behavior", label: "Behavior", href: "/behavior" },
];

const timeRanges = ["24h", "7d", "30d", "90d"] as const;

/**
 * Shared site header for all Analytics Dashboard pages.
 * Consolidates the duplicated header markup from page.tsx, realtime/page.tsx,
 * and behavior/page.tsx into a single responsive component.
 */
export default React.memo(function SiteHeader({
  activePage,
  timeRange,
  onTimeRangeChange,
  breadcrumb,
}: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  return (
    <header className="bg-canvas/80 backdrop-blur-sm border-b border-hairline sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-lg">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Breadcrumb */}
          <div className="flex items-center gap-md min-w-0">
            <a
              href="/"
              className="flex items-center gap-md hover:opacity-80 transition-opacity flex-shrink-0"
              aria-label="CinaCoin Analytics Home"
            >
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h1 className="text-heading-3 text-ink hidden sm:block">CinaCoin Analytics</h1>
            </a>

            {/* Breadcrumb for sub-pages */}
            {breadcrumb && (
              <div className="flex items-center gap-sm min-w-0">
                <span className="text-body-sm text-ink-mute" aria-hidden="true">/</span>
                <span className="text-body-sm text-ink-body truncate">{breadcrumb}</span>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-lg" aria-label="Main navigation">
            <div className="flex items-center gap-md">
              {navItems.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  className={`text-body-sm transition-colors ${
                    activePage === item.key
                      ? "text-ink font-medium"
                      : "text-ink-mute hover:text-ink"
                  }`}
                  aria-current={activePage === item.key ? "page" : undefined}
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Time Range Selector (Overview only) */}
            {timeRange && onTimeRangeChange && (
              <div className="flex bg-canvas-soft-2 rounded-md p-xxs" role="group" aria-label="Time range">
                {timeRanges.map((range) => (
                  <button
                    key={range}
                    onClick={() => onTimeRangeChange(range)}
                    className={`px-sm py-xxs text-body-sm rounded-sm transition-all ${
                      timeRange === range
                        ? "bg-canvas text-ink font-medium shadow-cinacoin-2"
                        : "text-ink-mute hover:text-ink"
                    }`}
                    aria-pressed={timeRange === range}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}

            {/* User Avatar */}
            <div
              className="w-8 h-8 bg-canvas-soft-2 rounded-full flex items-center justify-center"
              aria-label="User menu"
            >
              <span className="text-body-sm font-medium text-ink">A</span>
            </div>
          </nav>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 -mr-2 text-ink-mute hover:text-ink transition-colors"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div
            id="mobile-nav-menu"
            className="md:hidden pb-md border-t border-hairline pt-sm"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col gap-xs">
              {navItems.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  className={`text-body-sm px-sm py-xs rounded-md transition-colors ${
                    activePage === item.key
                      ? "text-ink font-medium bg-canvas-soft-2"
                      : "text-ink-mute hover:text-ink hover:bg-canvas-soft"
                  }`}
                  aria-current={activePage === item.key ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Mobile Time Range */}
            {timeRange && onTimeRangeChange && (
              <div className="mt-sm pt-sm border-t border-hairline">
                <p className="text-caption text-ink-mute mb-xs px-sm">Time Range</p>
                <div className="flex bg-canvas-soft-2 rounded-md p-xxs mx-sm" role="group" aria-label="Time range">
                  {timeRanges.map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        onTimeRangeChange(range);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex-1 px-sm py-xxs text-body-sm rounded-sm transition-all text-center ${
                        timeRange === range
                          ? "bg-canvas text-ink font-medium shadow-cinacoin-2"
                          : "text-ink-mute hover:text-ink"
                      }`}
                      aria-pressed={timeRange === range}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
});
