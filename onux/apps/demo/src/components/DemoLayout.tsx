'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavLink } from './Header';
import Footer from './Footer';
import { DemoDisclaimer } from './DemoDisclaimer';

const NAV_ITEMS: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Swap', href: '/swap' },
  { label: 'Tokens', href: '/tokens' },
  { label: 'Multi-Chain', href: '/multi-chain' },
  { label: 'Batch', href: '/batch' },
  { label: 'AA Demo', href: '/aa-demo' },
  { label: 'Onramp', href: '/onramp' },
  { label: 'Auth', href: '/auth' },
  { label: 'Activity', href: '/activity' },
  { label: 'Profile', href: '/profile' },
  { label: 'Settings', href: '/settings' },
];

/* ── Sidebar navigation (Vercel app-shell style) ── */
function Sidebar({ links, mobileOpen, onClose }: { links: NavLink[]; mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 px-4 h-16 border-b border-[var(--cc-hairline)] shrink-0" onClick={onClose}>
        <img src="/demo/logo.png" alt="Cinacoin" className="h-6 w-6 rounded-[4px]" />
        <span className="text-sm font-semibold text-[var(--cc-ink)] tracking-[-0.28px]">Cinacoin</span>
      </Link>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {links.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`relative flex items-center px-3 py-2 rounded-[6px] text-[14px] font-[400] leading-[20px] tracking-[-0.28px] transition-colors ${
                isActive
                  ? 'text-[var(--cc-ink)] font-[500] bg-[var(--cc-canvas-soft-2)]'
                  : 'text-[var(--cc-body)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft-2)]/60'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[var(--cc-ink)] rounded-r-full" />
              )}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[200px] shrink-0 bg-[var(--cc-canvas)] border-r border-[var(--cc-hairline)] h-screen sticky top-0 flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20" onClick={onClose} />
          <aside className="relative w-[240px] h-full bg-[var(--cc-canvas)] shadow-[var(--cc-level5)]">
            <button onClick={onClose} className="absolute top-4 right-4 p-1 text-[var(--cc-body)] hover:text-[var(--cc-ink)]" aria-label="Close menu">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

export default function DemoLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafafa] text-[var(--cc-ink)] flex">
      <Sidebar links={NAV_ITEMS} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-40 bg-[var(--cc-canvas)] border-b border-[var(--cc-hairline)] h-14 flex items-center px-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-[6px] text-[var(--cc-body)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft-2)] transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/" className="flex items-center gap-2 ml-3">
            <img src="/demo/logo.png" alt="Cinacoin" className="h-5 w-5 rounded-[4px]" />
            <span className="text-sm font-semibold text-[var(--cc-ink)]">Cinacoin</span>
          </Link>
        </div>

        <main id="main-content" className="flex-1">
          <DemoDisclaimer compact />
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
