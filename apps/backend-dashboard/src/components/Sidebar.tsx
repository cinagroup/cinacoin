"use client";

import { Users, Mail, ShieldCheck, Shield, ClipboardList, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onClose?: () => void;
}

interface NavItem {
  id: string;
  name: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: "users", name: "User Management", icon: Users },
  { id: "newsletter", name: "Newsletter", icon: Mail },
  { id: "permissions", name: "Permissions", icon: ShieldCheck },
  { id: "2fa", name: "Two-Factor Auth", icon: Shield },
  { id: "audit", name: "Audit Log", icon: ClipboardList },
  { id: "config", name: "System Config", icon: Settings },
];

export function Sidebar({ activeTab = "users", onTabChange = () => {}, onClose }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[var(--cc-canvas)] border-r border-[var(--cc-hairline)] flex flex-col">
      <div className="p-6 border-b border-[var(--cc-hairline)]">
        <h2 className="text-[var(--text-display-sm)] font-semibold text-[var(--cc-ink)] flex items-center gap-2">
          <span className="font-mono text-[var(--cc-muted)] text-xs">CC</span>
          CinaCoin
        </h2>
        <p className="text-[var(--text-caption)] text-[var(--cc-muted)] mt-1 font-mono">BACKEND ADMIN</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-[var(--cc-radius-sm)] text-[var(--text-body-sm)] font-medium transition-colors ${
                activeTab === item.id
                  ? "bg-[var(--cc-canvas-soft-2)] text-[var(--cc-ink)]"
                  : "text-[var(--cc-body)] hover:bg-[var(--cc-canvas-soft-2)] hover:text-[var(--cc-ink)]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--cc-hairline)]">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-[var(--cc-canvas-soft-2)] flex items-center justify-center text-[var(--text-body-sm)] font-medium text-[var(--cc-ink)]">
            S
          </div>
          <div>
            <p className="text-[var(--text-body-sm)] font-medium text-[var(--cc-ink)]">Super Admin</p>
            <p className="text-[var(--text-caption)] text-[var(--cc-muted)]">root@cinacoin.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
