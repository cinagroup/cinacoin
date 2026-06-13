'use client';

import { Home, Activity, BarChart2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import React from 'react';

const navItems = [
  { key: 'overview', label: 'Overview', href: '/', icon: Home },
  { key: 'realtime', label: 'Realtime', href: '/realtime', icon: Activity },
  { key: 'behavior', label: 'Behavior', href: '/behavior', icon: BarChart2 },
] as const;

/**
 * Fixed bottom navigation bar for mobile viewports.
 * Hidden on lg+ screens where the desktop header nav is visible.
 */
export default React.memo(function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-[var(--cc-canvas)] border-t border-[var(--cc-hairline)] z-50 lg:hidden safe-bottom"
      aria-label="Mobile navigation"
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive =
            item.key === 'overview' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <a
              key={item.key}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-caption transition-colors ${
                isActive
                  ? 'text-[var(--cc-primary)] font-medium'
                  : 'text-[var(--cc-muted)] hover:text-[var(--cc-ink)]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
});
