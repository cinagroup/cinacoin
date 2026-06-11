"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

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
  const { session, logout, isLoading } = useAuth();

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
        {isLoading ? (
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-canvas)]/20 animate-pulse"></div>
            <div className="flex-1">
              <div className="h-3 bg-[var(--color-canvas)]/20 rounded w-20 mb-1"></div>
              <div className="h-2 bg-[var(--color-canvas)]/10 rounded w-32"></div>
            </div>
          </div>
        ) : session.authenticated ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-[var(--color-canvas)]/20 flex items-center justify-center text-body-sm font-semibold">
                {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium truncate">
                  {session.user?.name || session.user?.email || 'User'}
                </p>
                {session.user?.email && (
                  <p className="text-caption text-[var(--color-on-primary)]/60 truncate">
                    {session.user.email}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full px-4 py-2 text-body-sm text-left text-[var(--color-on-primary)]/80 hover:text-[var(--color-on-primary)] hover:bg-[var(--color-canvas)]/10 rounded transition-colors"
            >
              🚪 Logout
            </button>
          </div>
        ) : (
          <button
            onClick={() => window.location.href = 'https://auth.cinacoin.com'}
            className="w-full px-4 py-2 text-body-sm font-medium text-center bg-[var(--color-canvas)]/20 hover:bg-[var(--color-canvas)]/30 rounded transition-colors"
          >
            🔐 Login
          </button>
        )}
      </div>
    </aside>
  );
}
