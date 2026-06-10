"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tutorials = [
  { href: "/basics", label: "Web3 Basics", category: "Fundamentals" },
  { href: "/wallet-integration", label: "Wallet Integration", category: "Fundamentals" },
  { href: "/multichain", label: "Multichain Development", category: "Advanced" },
  { href: "/best-practices", label: "Best Practices", category: "Advanced" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-bg-card border-r border-border-color overflow-y-auto">
      <div className="p-6">
        <Link href="/" className="block mb-8">
          <h1 className="text-display-md font-bold text-accent-blue">Cinacoin</h1>
          <p className="text-body-sm text-text-secondary">Learn Platform</p>
        </Link>

        <nav className="space-y-6">
          {["Fundamentals", "Advanced"].map((category) => (
            <div key={category}>
              <h3 className="text-caption font-semibold text-text-muted uppercase tracking-wider mb-3">
                {category}
              </h3>
              <ul className="space-y-1">
                {tutorials
                  .filter((t) => t.category === category)
                  .map((tutorial) => {
                    const isActive = pathname === tutorial.href;
                    return (
                      <li key={tutorial.href}>
                        <Link
                          href={tutorial.href}
                          className={`block px-3 py-2 rounded-lg text-body-sm transition-colors ${
                            isActive
                              ? "bg-accent-blue/10 text-accent-blue font-medium"
                              : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                          }`}
                        >
                          {tutorial.label}
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-8 pt-6 border-t border-border-color">
          <a
            href="https://cinacoin.com"
            className="text-body-sm text-text-secondary hover:text-accent-blue transition-colors"
          >
            ← Back to Cinacoin
          </a>
        </div>
      </div>
    </aside>
  );
}
