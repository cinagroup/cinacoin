"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
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
      className={`bg-canvas border-r border-hairline transition-all duration-300 flex flex-col ${
        isOpen ? "w-64" : "w-0 overflow-hidden"
      }`}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-hairline">
        <Link href="/" className="flex items-center">
          <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
            <svg className="w-5 h-5 text-on-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <span className="ml-3 font-semibold text-ink">CinaCoin Cloud</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((category, idx) => (
          <div key={idx} className="mb-4">
            <h3 className="px-4 text-caption font-medium text-mute uppercase tracking-wider mb-2">
              {category.category}
            </h3>
            <ul>
              {category.items.map((item, itemIdx) => (
                <li key={itemIdx}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-2 text-body-sm transition-colors duration-fast rounded-sm mx-2 ${
                      isActive(item.href)
                        ? "bg-canvas-soft-2 text-ink font-medium"
                        : "text-body hover:bg-canvas-soft-2 hover:text-ink"
                    }`}
                  >
                    <span className="mr-3 flex items-center">
                      <item.icon className="w-4 h-4 text-body" />
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
      <div className="p-4 border-t border-hairline">
        <Link href="/settings" className="flex items-center gap-3 hover:bg-canvas-soft-2 rounded-sm p-2 -m-2 transition-colors">
          <div className="w-8 h-8 bg-canvas-soft-2 rounded-full flex items-center justify-center">
            <span className="text-caption font-medium text-ink">AD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body-sm font-medium text-ink truncate">Admin</p>
            <p className="text-caption text-mute truncate">admin@cinacoin.com</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
