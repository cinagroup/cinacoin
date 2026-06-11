"use client";

import { useState } from "react";
import { LayoutDashboard, Users, Plug, Coins, TrendingUp, Settings, Coins as CoinIcon, Menu, X } from 'lucide-react';

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Users", icon: Users },
  { name: "API", icon: Plug },
  { name: "Transactions", icon: Coins },
  { name: "Analytics", icon: TrendingUp },
  { name: "Settings", icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("Dashboard");

  return (
    <div className="md:hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--cc-canvas)] border-b border-[var(--cc-hairline)]">
        <div className="flex items-center gap-2">
          <CoinIcon className="w-5 h-5 text-[var(--cc-ink)]" />
          <span className="cc-body-sm-strong text-[var(--cc-ink)]">CinaCoin</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          className="p-2 rounded-[var(--cc-radius-sm)] hover:bg-[var(--cc-canvas-soft)] transition-colors"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Slide-down nav */}
      {open && (
        <nav
          className="bg-[var(--cc-canvas)] border-b border-[var(--cc-hairline)] px-4 pb-4"
          aria-label="Mobile navigation"
        >
          <div className="grid grid-cols-3 gap-2">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setActive(item.name);
                  setOpen(false);
                }}
                aria-current={active === item.name ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 p-3 rounded-[var(--cc-radius-sm)] transition-colors ${
                  active === item.name
                    ? 'bg-[var(--cc-canvas-soft-2)] text-[var(--cc-ink)]'
                    : 'text-[var(--cc-body)] hover:bg-[var(--cc-canvas-soft)]'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="cc-caption">{item.name}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
