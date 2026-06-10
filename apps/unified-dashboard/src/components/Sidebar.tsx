"use client";

import { useState } from "react";

const navItems = [
  { name: "Dashboard", icon: "📊", active: true },
  { name: "Users", icon: "👥", active: false },
  { name: "API", icon: "🔌", active: false },
  { name: "Transactions", icon: "💰", active: false },
  { name: "Analytics", icon: "📈", active: false },
  { name: "Settings", icon: "⚙️", active: false },
];

export function Sidebar() {
  const [active, setActive] = useState("Dashboard");

  return (
    <aside className="sidebar fixed left-0 top-0 h-full w-64 flex flex-col">
      <div className="p-6 border-b border-[var(--color-on-primary)]/10">
        <h2 className="text-display-sm font-semibold flex items-center gap-2">
          <span className="text-display-md">🪙</span>
          CinaCoin
        </h2>
        <p className="text-caption text-[var(--color-on-primary)]/60 mt-1">Unified Dashboard</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setActive(item.name)}
            className={`sidebar-item w-full ${
              active === item.name ? "active" : ""
            }`}
          >
            <span className="text-body-lg">{item.icon}</span>
            {item.name}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[var(--color-on-primary)]/10">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-canvas)]/20 flex items-center justify-center text-body-sm font-semibold">
            A
          </div>
          <div>
            <p className="text-body-sm font-medium">Admin</p>
            <p className="text-caption text-[var(--color-on-primary)]/60">admin@cinacoin.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
