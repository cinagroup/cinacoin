"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AppSwitcherProps {
  open: boolean;
  onClose: () => void;
}

interface App {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: string;
  category: string;
}

const APPS: App[] = [
  {
    id: "dashboard",
    name: "Unified Dashboard",
    description: "Overview and metrics",
    href: "/",
    icon: "📊",
    category: "Overview",
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Detailed analytics and reports",
    href: "/analytics",
    icon: "📈",
    category: "Overview",
  },
  {
    id: "backend",
    name: "Backend Services",
    description: "RPC, Keys, Relay, Notify",
    href: "/apps/backend",
    icon: "🖥️",
    category: "Applications",
  },
  {
    id: "cloud",
    name: "Cloud Platform",
    description: "Cloud infrastructure management",
    href: "/apps/cloud",
    icon: "☁️",
    category: "Applications",
  },
  {
    id: "wallet",
    name: "Wallet Explorer",
    description: "Wallet and transaction explorer",
    href: "/apps/wallet",
    icon: "👛",
    category: "Applications",
  },
  {
    id: "projects",
    name: "Projects",
    description: "Manage projects and configurations",
    href: "/projects",
    icon: "📁",
    category: "Management",
  },
  {
    id: "team",
    name: "Team",
    description: "Team members and permissions",
    href: "/team",
    icon: "👥",
    category: "Management",
  },
  {
    id: "settings",
    name: "Settings",
    description: "Preferences and configuration",
    href: "/settings",
    icon: "⚙️",
    category: "Settings",
  },
];

/**
 * App Switcher (Cmd+K / Ctrl+K) — quick navigation across all apps.
 * Shows recent visits and supports fuzzy search.
 */
export default function AppSwitcher({ open, onClose }: AppSwitcherProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentApps, setRecentApps] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load recent apps from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentApps");
    if (stored) {
      setRecentApps(JSON.parse(stored));
    }
  }, []);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Global keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) {
          onClose();
        } else {
          // Trigger open via parent
          window.dispatchEvent(new CustomEvent("openAppSwitcher"));
        }
      }
      if (e.key === "Escape" && open) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Filter apps based on query
  const filteredApps = query
    ? APPS.filter(
        (app) =>
          app.name.toLowerCase().includes(query.toLowerCase()) ||
          app.description.toLowerCase().includes(query.toLowerCase()) ||
          app.category.toLowerCase().includes(query.toLowerCase())
      )
    : APPS;

  // Sort: recent first, then by category
  const sortedApps = [...filteredApps].sort((a, b) => {
    const aRecent = recentApps.indexOf(a.id);
    const bRecent = recentApps.indexOf(b.id);
    if (aRecent !== -1 && bRecent !== -1) return aRecent - bRecent;
    if (aRecent !== -1) return -1;
    if (bRecent !== -1) return 1;
    return 0;
  });

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, sortedApps.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && sortedApps[selectedIndex]) {
      e.preventDefault();
      navigateTo(sortedApps[selectedIndex]);
    }
  };

  const navigateTo = (app: App) => {
    // Update recent apps
    const updated = [app.id, ...recentApps.filter((id) => id !== app.id)].slice(0, 5);
    setRecentApps(updated);
    localStorage.setItem("recentApps", JSON.stringify(updated));

    router.push(app.href);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[var(--cc-canvas)] rounded-[var(--cc-radius-xl)] shadow-2xl overflow-hidden animate-slide-up">
        {/* Search input */}
        <div className="border-b border-[var(--cc-hairline)]">
          <div className="flex items-center gap-3 px-4 py-3">
            <svg
              className="w-5 h-5 text-[var(--cc-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search applications..."
              className="flex-1 bg-transparent text-[var(--cc-ink)] placeholder:text-[var(--cc-muted)] outline-none text-sm"
            />
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-[10px] font-mono bg-[var(--cc-canvas-soft2)] border border-[var(--cc-hairline)] rounded text-[var(--cc-muted)]">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results list */}
        <div className="max-h-[60vh] overflow-y-auto cc-scrollbar py-2">
          {sortedApps.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--cc-muted)]">
              No applications found
            </div>
          ) : (
            <div className="space-y-1">
              {sortedApps.map((app, index) => (
                <button
                  key={app.id}
                  onClick={() => navigateTo(app)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    index === selectedIndex
                      ? "bg-[var(--cc-canvas-soft2)]"
                      : "hover:bg-[var(--cc-canvas-soft)]"
                  }`}
                >
                  <span className="text-2xl">{app.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--cc-ink)]">
                      {app.name}
                    </div>
                    <div className="text-xs text-[var(--cc-muted)] truncate">
                      {app.description}
                    </div>
                  </div>
                  <span className="text-xs text-[var(--cc-muted)] px-2 py-0.5 bg-[var(--cc-canvas-soft2)] rounded">
                    {app.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--cc-hairline)] px-4 py-2 flex items-center justify-between text-xs text-[var(--cc-muted)]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[var(--cc-canvas-soft2)] border border-[var(--cc-hairline)] rounded font-mono">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[var(--cc-canvas-soft2)] border border-[var(--cc-hairline)] rounded font-mono">
                ↵
              </kbd>
              Select
            </span>
          </div>
          <span>
            {sortedApps.length} application{sortedApps.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
