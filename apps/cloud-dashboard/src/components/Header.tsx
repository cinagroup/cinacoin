"use client";

import Image from "next/image";
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
    <header className="cc-navbar">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-[16px] font-semibold tracking-tight text-[var(--cc-ink)]" aria-label="Cinacoin Cloud home">
          <Image src="/logo.png" alt="Cinacoin logo" width={28} height={28} className="h-7 w-7 rounded-md" unoptimized />
          <span>Cinacoin <span className="text-[var(--cc-muted)] font-normal">Cloud</span></span>
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
