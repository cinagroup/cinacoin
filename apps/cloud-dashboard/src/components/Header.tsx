"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/settings", label: "Settings" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--cc-hairline)] bg-[var(--cc-canvas)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-[var(--cc-ink)]">
          <span className="text-[var(--cc-primary)]">🔢</span>
          <span>Cinacoin Cloud</span>
        </Link>
        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "text-[var(--cc-primary)]"
                  : "text-[var(--cc-body)] hover:text-[var(--cc-ink)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
