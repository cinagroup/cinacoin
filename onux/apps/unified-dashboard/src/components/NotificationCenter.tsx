"use client";

import { useNotifications } from "@/providers/NotificationProvider";
import { useState } from "react";

interface NotificationCenterProps {
  onClose: () => void;
}

type NotificationFilter = "all" | "system" | "project" | "team";

/**
 * Notification center dropdown with filtering and mark-as-read.
 */
export default function NotificationCenter({ onClose }: NotificationCenterProps) {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState<NotificationFilter>("all");

  const filteredNotifications =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.category === filter);

  const filters: { key: NotificationFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "system", label: "System" },
    { key: "project", label: "Project" },
    { key: "team", label: "Team" },
  ];

  return (
    <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-lg)] shadow-lg z-50 animate-slide-up">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--cc-hairline)] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--cc-ink)]">Notifications</h3>
        <button
          onClick={markAllAsRead}
          className="text-xs text-[var(--cc-brand)] hover:text-[var(--cc-brand-dark)] transition-colors"
        >
          Mark all as read
        </button>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b border-[var(--cc-hairline)] flex gap-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filter === f.key
                ? "bg-[var(--cc-ink)] text-[var(--cc-canvas)]"
                : "text-[var(--cc-ink-soft)] hover:bg-[var(--cc-canvas-soft2)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="max-h-96 overflow-y-auto cc-scrollbar">
        {filteredNotifications.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-[var(--cc-muted)]">
            No notifications
          </div>
        ) : (
          <div className="divide-y divide-[var(--cc-hairline)]">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  markAsRead(notif.id);
                  if (notif.href) {
                    onClose();
                    // Navigate would happen here
                  }
                }}
                className={`px-4 py-3 hover:bg-[var(--cc-canvas-soft)] cursor-pointer transition-colors ${
                  !notif.read ? "bg-[var(--cc-brand-light)]" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notif.category === "system"
                        ? "bg-blue-100 text-blue-600"
                        : notif.category === "project"
                        ? "bg-green-100 text-green-600"
                        : "bg-purple-100 text-purple-600"
                    }`}
                  >
                    {notif.category === "system" && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                    )}
                    {notif.category === "project" && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                    )}
                    {notif.category === "team" && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--cc-ink)] line-clamp-2">
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[var(--cc-brand)] flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--cc-muted)] mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-xs text-[var(--cc-muted)] mt-1">
                      {formatTimeAgo(notif.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[var(--cc-hairline)]">
        <button
          onClick={onClose}
          className="w-full text-center text-xs text-[var(--cc-brand)] hover:text-[var(--cc-brand-dark)] transition-colors py-1"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}
