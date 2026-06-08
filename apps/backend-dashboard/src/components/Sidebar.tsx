"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@cinacoin/ui";

const NAV_SECTIONS = [
  {
    label: "Dashboard",
    items: [
      { href: "/", label: "Overview" },
      { href: "/analytics", label: "Analytics" },
    ],
  },
  {
    label: "Services",
    items: [
      { href: "/rpc-proxy", label: "RPC Proxy" },
      { href: "/keys-server", label: "Keys Server" },
      { href: "/relay-server", label: "Relay Server" },
      { href: "/notify-server", label: "Notify Server" },
      { href: "/push-server", label: "Push Server" },
    ],
  },
  {
    label: "Configuration",
    items: [
      { href: "/project", label: "Project" },
      { href: "/chains", label: "Networks" },
      { href: "/settings", label: "Settings" },
    ],
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleNav = () => {
    onClose?.();
  };

  return (
    <aside className="w-64 bg-[var(--cc-canvas)] border-r border-[var(--cc-hairline)] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-[var(--cc-hairline)]">
        <div className="flex items-center gap-3">
          <Brand href="/" logoSrc="/logo.png" sublabel="Dashboard" size={28} as="span" />
          {/* Mobile close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-[var(--cc-radius-sm)] text-[var(--cc-muted)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto" aria-label="Dashboard navigation" role="navigation">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="cc-caption-mono text-[var(--cc-muted)] px-3 mb-1.5">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNav}
                    className={`sidebar-nav-link min-h-[36px] ${
                      isActive
                        ? "text-[var(--cc-ink)] font-semibold"
                        : ""
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <footer className="px-4 py-3 border-t border-[var(--cc-hairline)]">
        <div className="cc-caption text-[var(--cc-muted)]">
          v0.1.0 • Cloudflare Workers
        </div>
      </footer>
    </aside>
  );
}
