"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  Folder,
  Key,
  BarChart3,
  Settings,
  BookOpen,
  CreditCard,
  Plus,
  Search,
} from "lucide-react";

interface Command {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const commands: Command[] = [
    {
      id: "home",
      label: "Go to Home",
      icon: Home,
      action: () => router.push("/"),
    },
    {
      id: "projects",
      label: "Go to Projects",
      icon: Folder,
      action: () => router.push("/projects"),
    },
    {
      id: "api-keys",
      label: "Go to API Keys",
      icon: Key,
      action: () => router.push("/api-keys"),
    },
    {
      id: "analytics",
      label: "Go to Analytics",
      icon: BarChart3,
      action: () => router.push("/analytics"),
    },
    {
      id: "billing",
      label: "Go to Billing",
      icon: CreditCard,
      action: () => router.push("/billing"),
    },
    {
      id: "settings",
      label: "Go to Settings",
      icon: Settings,
      action: () => router.push("/settings"),
    },
    {
      id: "docs",
      label: "Go to Documentation",
      icon: BookOpen,
      action: () => router.push("/docs"),
    },
    {
      id: "new-project",
      label: "Create New Project",
      icon: Plus,
      action: () => router.push("/projects/new"),
    },
  ];

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen(true);
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#171717]/50 flex items-start justify-center pt-[20vh] p-4"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="bg-canvas border border-hairline rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-hairline">
          <Search className="w-5 h-5 text-ink-mute" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command..."
            aria-label="Search commands"
            className="flex-1 bg-transparent outline-none text-body-md text-ink placeholder:text-ink-mute"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
            }}
          />
        </div>
        <div className="max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-body-sm text-ink-mute">
              No commands found
            </div>
          ) : (
            <ul>
              {filtered.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <li key={cmd.id}>
                    <button
                      onClick={() => {
                        cmd.action();
                        setOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-canvas-soft transition-colors text-left"
                    >
                      <Icon className="w-5 h-5 text-ink-mute" />
                      <span className="text-body-sm text-ink">{cmd.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
