"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_SECTIONS = [
  {
    label: "Dashboard",
    items: [
      { href: "/", label: "Overview", icon: "📊" },
      { href: "/analytics", label: "Analytics", icon: "📈" },
    ],
  },
  {
    label: "Services",
    items: [
      { href: "/rpc-proxy", label: "RPC Proxy", icon: "🔄" },
      { href: "/keys-server", label: "Keys Server", icon: "🔑" },
      { href: "/relay-server", label: "Relay Server", icon: "📡" },
      { href: "/notify-server", label: "Notify Server", icon: "🔔" },
      { href: "/push-server", label: "Push Server", icon: "📱" },
    ],
  },
  {
    label: "Configuration",
    items: [
      { href: "/project", label: "Project", icon: "📦" },
      { href: "/chains", label: "Networks", icon: "🌐" },
      { href: "/settings", label: "Settings", icon: "⚙️" },
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
    <aside className="w-64 bg-dashboard-surface border-r border-dashboard-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-dashboard-border">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔢</span>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">CinaCoin</h1>
            <p className="text-xs text-dashboard-muted">Backend Dashboard</p>
          </div>
          {/* Mobile close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] uppercase tracking-wider text-dashboard-muted/60 font-semibold mb-2 px-3">
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                      isActive
                        ? "bg-dashboard-primary/20 text-dashboard-primaryLight"
                        : "text-dashboard-muted hover:text-white hover:bg-dashboard-border/50"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-dashboard-border">
        <div className="text-xs text-dashboard-muted">
          v0.1.0 • Cloudflare Workers
        </div>
      </div>
    </aside>
  );
}
