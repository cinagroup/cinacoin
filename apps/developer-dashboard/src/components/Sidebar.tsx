"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/projects", label: "Projects", icon: "📦" },
  { href: "/api-keys", label: "API Keys", icon: "🔑" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar hidden md:flex flex-col py-4 px-3 shrink-0">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 px-3 mb-6">
        <span className="text-2xl">🔢</span>
        <div>
          <div className="text-sm font-semibold text-ink leading-tight">Cinacoin</div>
          <div className="text-xs text-ink-mute leading-tight">Developer Portal</div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${isActive(item.href) ? "active" : ""}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pt-4 border-t border-hairline mt-4">
        <div className="text-xs text-ink-mute">v2.4.1</div>
        <a
          href="https://docs.cinacoin.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-link hover:text-link-hover mt-1 block"
        >
          📖 Documentation
        </a>
      </div>
    </aside>
  );
}
