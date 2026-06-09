"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/providers/ThemeProvider";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/settings", label: "Settings" },
];

const ThemeToggleIcon = ({ theme }: { theme: string }) =>
  theme === "light" ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="5" />
      <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );

export default function Header() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const themeLabel = `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`;

  return (
    <header className="cc-navbar relative">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 cc-body-md-strong text-[var(--cc-ink)]" aria-label="Cinacoin Cloud home">
          <Image src="/logo.png" alt="Cinacoin logo" width={28} height={28} className="h-7 w-7 rounded-md" unoptimized />
          <span>Cinacoin <span className="text-[var(--cc-muted)] font-normal">Cloud</span></span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-4 lg:gap-6" aria-label="Primary navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors px-2 py-1 rounded-[var(--app-radius)] ${
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
            aria-label={themeLabel}
            className="p-2 rounded-full text-[var(--cc-muted)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ThemeToggleIcon theme={theme} />
          </button>
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-1 sm:hidden">
          <button
            onClick={toggle}
            aria-label={themeLabel}
            className="p-2 rounded-full text-[var(--cc-muted)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ThemeToggleIcon theme={theme} />
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-full text-[var(--cc-muted)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 sm:hidden"
            onClick={() => setMobileOpen(false)}
            role="presentation"
            aria-hidden="true"
          />
          <nav className="fixed right-4 top-16 z-50 w-56 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level5)] p-2 sm:hidden" aria-label="Mobile navigation">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-[var(--cc-radius-sm)] text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                    isActive
                      ? "text-[var(--cc-ink)] bg-[var(--cc-canvas-soft-2)]"
                      : "text-[var(--cc-body)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft)]"
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </>
      )}
    </header>
  );
}
