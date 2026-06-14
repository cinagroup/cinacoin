"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Folder, Key, BarChart3, BookOpen, CreditCard, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/projects", label: "Projects", icon: Folder },
  { href: "/api-keys", label: "API Keys", icon: Key },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/api-reference", label: "API Reference", icon: BookOpen },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar hidden md:flex flex-col py-4 px-3 shrink-0" aria-label="Main navigation">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 px-3 mb-6">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
          <span className="text-on-primary font-semibold text-body-sm">0</span>
        </div>
        <div>
          <div className="text-body-sm font-semibold text-[var(--cc-ink)] leading-tight">Cinacoin</div>
          <div className="text-caption text-ink-mute leading-tight">Developer Portal</div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${isActive(item.href) ? "active" : ""}`}
            aria-current={isActive(item.href) ? "page" : undefined}
          >
            <item.icon className="w-4 h-4" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pt-4 border-t border-[var(--cc-hairline)] mt-4">
        <div className="text-caption text-ink-mute">v2.4.1</div>
        <a
          href="https://docs.cinacoin.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-caption text-link hover:text-link-deep mt-1 flex items-center gap-1"
        >
          <BookOpen className="w-3 h-3" aria-hidden="true" />
          Documentation
        </a>
      </div>
    </aside>
  );
}
