"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cloud, ChevronRight } from "lucide-react";
import {  LayoutDashboard,
  Settings,
  Key,
  CreditCard,
  Monitor,
  Box,
  Zap,
  HardDrive,
  Disc,
  Folder,
  Scale,
  Globe,
  Rocket,
  Database,
  Circle,
  Leaf,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  {
    category: "Overview",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, href: "/" },
      { name: "Settings", icon: Settings, href: "/settings" },
      { name: "API Keys", icon: Key, href: "/api-keys" },
      { name: "Billing", icon: CreditCard, href: "/billing" },
    ],
  },
  {
    category: "Compute",
    items: [
      { name: "Virtual Machines", icon: Monitor, href: "/compute/vms" },
      { name: "Containers", icon: Box, href: "/compute/containers" },
      { name: "Serverless", icon: Zap, href: "/compute/serverless" },
    ],
  },
  {
    category: "Storage",
    items: [
      { name: "Object Storage", icon: HardDrive, href: "/storage/object" },
      { name: "Block Storage", icon: Disc, href: "/storage/block" },
      { name: "File Storage", icon: Folder, href: "/storage/file" },
    ],
  },
  {
    category: "Network",
    items: [
      { name: "Load Balancers", icon: Scale, href: "/network/load-balancers" },
      { name: "DNS Zones", icon: Globe, href: "/network/dns" },
      { name: "CDN", icon: Rocket, href: "/network/cdn" },
    ],
  },
  {
    category: "Database",
    items: [
      { name: "PostgreSQL", icon: Database, href: "/database/postgresql" },
      { name: "Redis", icon: Circle, href: "/database/redis" },
      { name: "MongoDB", icon: Leaf, href: "/database/mongodb" },
    ],
  },
];

export default function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`bg-[var(--cc-canvas)] border-r border-[var(--cc-hairline)] transition-all duration-300 flex flex-col ${
        isOpen ? "w-64" : "w-0 overflow-hidden"
      }`}
      aria-label="Cloud navigation"
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-[var(--cc-hairline)]">
        <Link href="/" className="flex items-center">
          <div className="w-8 h-8 bg-[var(--cc-primary)] rounded-[var(--cc-radius-sm)] flex items-center justify-center">
            <Cloud className="w-5 h-5 text-[var(--cc-on-primary)]" />
          </div>
          <span className="ml-3 font-semibold text-[var(--cc-ink)]">CinaCoin Cloud</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4" aria-label="Main navigation">
        {menuItems.map((category) => (
          <div key={category.category} className="mb-4">
            <h3 className="px-4 cc-caption-mono text-[var(--cc-muted)] uppercase tracking-wider mb-2">
              {category.category}
            </h3>
            <ul>
              {category.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-2 text-[var(--text-body-sm)] transition-colors rounded-[var(--cc-radius-sm)] mx-2 ${
                      isActive(item.href)
                        ? "bg-[var(--cc-canvas-soft-2)] text-[var(--cc-ink)] font-medium"
                        : "text-[var(--cc-body)] hover:bg-[var(--cc-canvas-soft-2)] hover:text-[var(--cc-ink)]"
                    }`}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    <span className="mr-3 flex items-center">
                      <item.icon className="w-4 h-4 text-[var(--cc-body)]" />
                    </span>
                    <span className="flex-1">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--cc-hairline)]">
        <Link href="/settings" className="flex items-center gap-3 hover:bg-[var(--cc-canvas-soft-2)] rounded-[var(--cc-radius-sm)] p-2 -m-2 transition-colors">
          <div className="w-8 h-8 bg-[var(--cc-canvas-soft-2)] rounded-full flex items-center justify-center">
            <span className="text-[var(--text-caption)] font-medium text-[var(--cc-ink)]">AD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[var(--text-body-sm)] font-medium text-[var(--cc-ink)] truncate">Admin</p>
            <p className="text-[var(--text-caption)] text-[var(--cc-muted)] truncate">admin@cinacoin.com</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
