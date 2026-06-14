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

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Administration",
    items: [
      { id: "users", name: "Users", icon: Users },
      { id: "newsletter", name: "Newsletter", icon: Mail },
    ],
  },
  {
    label: "Security",
    items: [
      { id: "permissions", name: "Permissions", icon: ShieldCheck },
      { id: "2fa", name: "Two-factor auth", icon: Shield },
    ],
  },
  {
    label: "System",
    items: [
      { id: "audit", name: "Audit log", icon: ClipboardList },
      { id: "config", name: "Configuration", icon: Settings },
    ],
  },
];

export function Sidebar({ activeTab = "users", onTabChange = () => {} }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[var(--cc-canvas)] border-r border-[var(--cc-hairline)] flex flex-col" aria-label="Cinacoin backend navigation">
      <div className="px-5 py-4 border-b border-[var(--cc-hairline)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[var(--cc-radius-sm)] bg-[var(--cc-primary)] flex items-center justify-center">
            <span className="text-[11px] font-semibold text-[var(--cc-on-primary)]">CC</span>
          </div>
          <div>
            <h2 className="cc-body-sm-strong text-[var(--cc-ink)] leading-tight">Backend</h2>
            <p className="cc-caption text-[var(--cc-muted)]">Administration</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3" aria-label="Main navigation">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-5 mb-1.5 cc-caption text-[var(--cc-muted)] font-medium">{group.label}</p>
            <div className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--cc-radius-sm)] cc-body-sm transition-all duration-150 ${
                      isActive
                        ? "bg-[var(--cc-canvas-soft-2)] text-[var(--cc-ink)] font-medium shadow-[inset_0_0_0_1px_var(--cc-hairline)]"
                        : "text-[var(--cc-body)] hover:bg-[var(--cc-canvas-soft)] hover:text-[var(--cc-ink)]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--cc-link)]' : 'text-[var(--cc-muted)]'}`} aria-hidden="true" />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-[var(--cc-hairline)]" aria-label="User menu">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-[var(--cc-radius-sm)] hover:bg-[var(--cc-canvas-soft)] transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--cc-link)] to-[var(--cc-violet)] flex items-center justify-center cc-body-sm font-medium text-white">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="cc-body-sm-strong text-[var(--cc-ink)] truncate">Alex Chen</p>
            <p className="cc-caption text-[var(--cc-muted)] truncate">alex@cinacoin.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
