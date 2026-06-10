"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const mobileNavItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/projects", label: "Projects", icon: "📦" },
  { href: "/api-keys", label: "Keys", icon: "🔑" },
  { href: "/analytics", label: "Stats", icon: "📈" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop top bar */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 border-b border-hairline bg-canvas">
        <div className="text-body-sm text-ink-mute">
          {pathname === "/" ? "Dashboard" : pathname.slice(1).split("/").map(
            (s) => s.charAt(0).toUpperCase() + s.slice(1)
          ).join(" / ")}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/projects/new" className="cc-btn-primary text-caption">
            + New Project
          </Link>
          <div className="w-8 h-8 rounded-full bg-ink text-[var(--color-on-primary)] flex items-center justify-center text-body-sm font-medium">
            D
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-canvas border-t border-hairline flex justify-around py-2 z-40">
        {mobileNavItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-caption ${
                isActive ? "text-ink font-medium" : "text-ink-mute"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
