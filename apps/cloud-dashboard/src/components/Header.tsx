"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/providers/ThemeProvider";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/settings", label: "Settings" },
];

export default function Header() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <header className="cc-navbar">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 cc-body-md-strong text-[var(--cc-ink)]" aria-label="Cinacoin Cloud home">
          <Image src="/logo.svg" alt="Cinacoin logo" width={28} height={28} className="h-7 w-7 rounded-md" unoptimized />
          <span>Cinacoin <span className="text-[var(--cc-muted)] font-normal">Cloud</span></span>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6" aria-label="Primary navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors px-2 py-1 rounded-[var(--cc-radius-full)] ${
                isActive
                  ? "text-[var(--cc-ink)] bg-[var(--cc-canvas-soft-2)]"
                  : "text-[var(--cc-body)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft)]"
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.label}
            </Link>
            )
          })}
          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            className="p-2 rounded-full text-[var(--cc-muted)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {theme === "light" ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="5" />
                <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
