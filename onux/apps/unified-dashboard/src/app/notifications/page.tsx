"use client";

import { useNotifications } from "@/providers/NotificationProvider";

/**
 * Full notifications page.
 */
export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--cc-ink)]">Notifications</h1>
          <p className="text-sm text-[var(--cc-muted)] mt-1">
            All your notifications in one place
          </p>
        </div>
        <button onClick={markAllAsRead} className="cc-btn-secondary text-xs">
          Mark all as read
        </button>
      </div>

      {/* Notifications list */}
      <div className="cc-card overflow-hidden">
        {notifications.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[var(--cc-muted)]">
            No notifications yet
          </div>
        ) : (
          <div className="divide-y divide-[var(--cc-hairline)]">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`px-5 py-4 hover:bg-[var(--cc-canvas-soft)] cursor-pointer transition-colors ${
                  !notif.read ? "bg-[var(--cc-brand-light)]" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Category icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notif.category === "system"
                        ? "bg-blue-100 text-blue-600"
                        : notif.category === "project"
                        ? "bg-green-100 text-green-600"
                        : "bg-purple-100 text-purple-600"
                    }`}
                  >
                    {notif.category === "system" && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                    )}
                    {notif.category === "project" && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                    )}
                    {notif.category === "team" && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-[var(--cc-ink)]">{notif.title}</p>
                        <p className="text-sm text-[var(--cc-ink-soft)] mt-0.5">{notif.message}</p>
                      </div>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[var(--cc-brand)] flex-shrink-0 mt-2" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="cc-badge cc-badge-info">{notif.category}</span>
                      <span className="text-xs text-[var(--cc-muted)]">
                        {new Date(notif.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
