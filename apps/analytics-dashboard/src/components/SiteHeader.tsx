'use client';

import { BarChart3, Menu, X } from 'lucide-react';
import React, { useState, useCallback } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';

type NavPage = 'overview' | 'realtime' | 'behavior';

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
  { key: 'overview', label: 'Overview', href: '/' },
  { key: 'realtime', label: 'Realtime', href: '/realtime' },
  { key: 'behavior', label: 'Behavior', href: '/behavior' },
];

const timeRanges = ['24h', '7d', '30d', '90d'] as const;

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
    <header className="bg-canvas/80 backdrop-blur-sm border-b border-[var(--cc-hairline)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-lg">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Breadcrumb */}
          <div className="flex items-center gap-md min-w-0">
            <a
              href="/"
              className="flex items-center gap-md hover:opacity-80 transition-opacity flex-shrink-0"
              aria-label="Cinacoin Analytics Home"
            >
              <div className="w-8 h-8 bg-[var(--cc-primary)] rounded-sm flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[var(--cc-on-primary)]" />
              </div>
              <h1 className="text-heading-3 text-[var(--cc-ink)] hidden sm:block">
                Cinacoin analytics.
              </h1>
            </a>

            {/* Breadcrumb for sub-pages */}
            {breadcrumb && (
              <div className="flex items-center gap-sm min-w-0">
                <span className="text-body-sm text-[var(--cc-muted)]" aria-hidden="true">
                  /
                </span>
                <span className="text-body-sm text-[var(--cc-body)] truncate">{breadcrumb}</span>
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
                      ? 'text-[var(--cc-ink)] font-medium'
                      : 'text-[var(--cc-muted)] hover:text-[var(--cc-ink)]'
                  }`}
                  aria-current={activePage === item.key ? 'page' : undefined}
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Time Range Selector (Overview only) */}
            {timeRange && onTimeRangeChange && (
              <div
                className="flex bg-[var(--cc-canvas-soft-2)] rounded-sm p-xxs"
                role="group"
                aria-label="Time range"
              >
                {timeRanges.map((range) => (
                  <button
                    key={range}
                    onClick={() => onTimeRangeChange(range)}
                    className={`px-sm py-xxs text-body-sm rounded-sm transition-all ${
                      timeRange === range
                        ? 'bg-[var(--cc-canvas)] text-[var(--cc-ink)] font-medium shadow-cinacoin-2'
                        : 'text-[var(--cc-muted)] hover:text-[var(--cc-ink)]'
                    }`}
                    aria-pressed={timeRange === range}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}

            {/* Theme & Language Toggles */}
            <div className="flex items-center gap-1">
              <LanguageToggle />
              <ThemeToggle />
            </div>

            {/* User Avatar */}
            <div
              className="w-8 h-8 bg-[var(--cc-canvas-soft-2)] rounded-full flex items-center justify-center"
              aria-label="User menu"
            >
              <span className="text-body-sm font-medium text-[var(--cc-ink)]">A</span>
            </div>
          </nav>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 -mr-2 text-[var(--cc-muted)] hover:text-[var(--cc-ink)] transition-colors"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div
            id="mobile-nav-menu"
            className="md:hidden pb-md border-t border-[var(--cc-hairline)] pt-sm"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col gap-xs">
              {navItems.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  className={`text-body-sm px-sm py-xs rounded-sm transition-colors ${
                    activePage === item.key
                      ? 'text-[var(--cc-ink)] font-medium bg-[var(--cc-canvas-soft-2)]'
                      : 'text-[var(--cc-muted)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft)]'
                  }`}
                  aria-current={activePage === item.key ? 'page' : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Mobile Time Range */}
            {timeRange && onTimeRangeChange && (
              <div className="mt-sm pt-sm border-t border-[var(--cc-hairline)]">
                <label
                  htmlFor="mobile-time-range-select"
                  className="text-caption text-[var(--cc-muted)] mb-xs block px-sm"
                >
                  Time range.
                </label>
                <select
                  id="mobile-time-range-select"
                  value={timeRange}
                  onChange={(e) => {
                    onTimeRangeChange(e.target.value);
                    setMobileMenuOpen(false);
                  }}
                  className="block w-[calc(100%-1rem)] mx-sm px-sm py-xs text-body-sm bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] rounded-sm text-[var(--cc-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--cc-primary)]"
                  aria-label="Select time range"
                >
                  {timeRanges.map((range) => (
                    <option key={range} value={range}>
                      {range === '24h'
                        ? 'Last 24 hours'
                        : range === '7d'
                          ? 'Last 7 days'
                          : range === '30d'
                            ? 'Last 30 days'
                            : 'Last 90 days'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
});
