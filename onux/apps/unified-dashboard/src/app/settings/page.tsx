"use client";

import { useState, useEffect } from "react";

/**
 * Settings page — user preferences and dashboard customization.
 */
export default function SettingsPage() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [timezone, setTimezone] = useState("UTC");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [dashboardLayout, setDashboardLayout] = useState<"default" | "compact" | "expanded">("default");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load preferences from localStorage
    const stored = localStorage.getItem("userPreferences");
    if (stored) {
      const prefs = JSON.parse(stored);
      setTheme(prefs.theme || "light");
      setTimezone(prefs.timezone || "UTC");
      setEmailNotifications(prefs.emailNotifications ?? true);
      setPushNotifications(prefs.pushNotifications ?? true);
      setDashboardLayout(prefs.dashboardLayout || "default");
    }
  }, []);

  const handleSave = () => {
    const prefs = {
      theme,
      timezone,
      emailNotifications,
      pushNotifications,
      dashboardLayout,
    };
    localStorage.setItem("userPreferences", JSON.stringify(prefs));

    // Apply theme
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      // System preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--cc-ink)]">Settings</h1>
        <p className="text-sm text-[var(--cc-muted)] mt-1">
          Customize your dashboard preferences
        </p>
      </div>

      {/* Appearance */}
      <div className="cc-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--cc-ink)]">Appearance</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-[var(--cc-ink-soft)] mb-2">Theme</label>
            <div className="flex gap-2">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-4 py-2 text-sm font-medium rounded-[var(--cc-radius-md)] transition-colors ${
                    theme === t
                      ? "bg-[var(--cc-ink)] text-[var(--cc-canvas)]"
                      : "border border-[var(--cc-hairline)] text-[var(--cc-ink-soft)] hover:bg-[var(--cc-canvas-soft)]"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--cc-ink-soft)] mb-2">Dashboard Layout</label>
            <div className="flex gap-2">
              {(["default", "compact", "expanded"] as const).map((layout) => (
                <button
                  key={layout}
                  onClick={() => setDashboardLayout(layout)}
                  className={`px-4 py-2 text-sm font-medium rounded-[var(--cc-radius-md)] transition-colors ${
                    dashboardLayout === layout
                      ? "bg-[var(--cc-ink)] text-[var(--cc-canvas)]"
                      : "border border-[var(--cc-hairline)] text-[var(--cc-ink-soft)] hover:bg-[var(--cc-canvas-soft)]"
                  }`}
                >
                  {layout.charAt(0).toUpperCase() + layout.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Regional */}
      <div className="cc-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--cc-ink)]">Regional</h2>

        <div>
          <label className="block text-sm text-[var(--cc-ink-soft)] mb-2">Timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] bg-[var(--cc-canvas)] text-[var(--cc-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--cc-brand)]"
          >
            <option value="UTC">UTC (Coordinated Universal Time)</option>
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="Europe/London">London (GMT/BST)</option>
            <option value="Europe/Paris">Paris (CET/CEST)</option>
            <option value="Asia/Tokyo">Tokyo (JST)</option>
            <option value="Asia/Shanghai">Shanghai (CST)</option>
          </select>
        </div>
      </div>

      {/* Notifications */}
      <div className="cc-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--cc-ink)]">Notifications</h2>

        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm text-[var(--cc-ink)]">Email notifications</p>
              <p className="text-xs text-[var(--cc-muted)]">Receive updates via email</p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="w-10 h-6 rounded-full appearance-none bg-[var(--cc-canvas-soft2)] checked:bg-[var(--cc-brand)] relative cursor-pointer transition-colors"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm text-[var(--cc-ink)]">Push notifications</p>
              <p className="text-xs text-[var(--cc-muted)]">Browser push notifications</p>
            </div>
            <input
              type="checkbox"
              checked={pushNotifications}
              onChange={(e) => setPushNotifications(e.target.checked)}
              className="w-10 h-6 rounded-full appearance-none bg-[var(--cc-canvas-soft2)] checked:bg-[var(--cc-brand)] relative cursor-pointer transition-colors"
            />
          </label>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-4">
        <button onClick={handleSave} className="cc-btn-primary">
          Save Preferences
        </button>
        {saved && (
          <span className="text-sm text-green-600 animate-fade-in">✓ Saved successfully</span>
        )}
      </div>
    </div>
  );
}
