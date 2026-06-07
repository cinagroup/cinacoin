"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
          <img src="/logo.png" alt="Cinacoin logo" className="h-7 w-7 rounded-md shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="cc-display-sm text-[var(--cc-ink)] leading-none">Cinacoin</h1>
            <p className="cc-body-sm text-[var(--cc-muted)] leading-none mt-0.5">Backend Dashboard</p>
          </div>
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
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
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
                    className={`flex items-center px-3 py-2 rounded-[var(--cc-radius-sm)] text-sm font-medium transition-colors min-h-[36px] ${
                      isActive
                        ? "bg-[var(--cc-canvas-soft-2)] text-[var(--cc-ink)]"
                        : "text-[var(--cc-body)] hover:bg-[var(--cc-canvas-soft)] hover:text-[var(--cc-ink)]"
                    }`}
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
      <div className="px-4 py-3 border-t border-[var(--cc-hairline)]">
        <div className="cc-caption text-[var(--cc-muted)]">
          v0.1.0 • Cloudflare Workers
        </div>
      </div>
    </aside>
  );
}
