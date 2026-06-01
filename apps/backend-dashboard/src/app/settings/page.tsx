"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [demoMode, setDemoMode] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In production, save to localStorage or API
    localStorage.setItem("dashboard-settings", JSON.stringify({
      refreshInterval,
      theme,
      demoMode,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">⚙️ Settings</h1>
        <p className="text-dashboard-muted mt-1">Configure dashboard preferences</p>
      </div>

      {saved && (
        <div role="status" className="bg-dashboard-success/10 border border-dashboard-success/30 rounded-xl px-4 py-3 text-sm text-dashboard-success">
          ✓ Settings saved successfully
        </div>
      )}

      {/* Display Settings */}
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border p-6 space-y-6">
        <h2 className="text-lg font-semibold text-white">Display</h2>

        {/* Theme */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Theme</p>
            <p className="text-sm text-dashboard-muted">Choose dashboard appearance</p>
          </div>
          <div className="flex gap-2" role="radiogroup" aria-label="Theme selection">
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                role="radio"
                aria-checked={theme === t}
                aria-label={`Switch to ${t} theme`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface ${
                  theme === t
                    ? "bg-brand-500 text-white"
                    : "bg-dashboard-border text-dashboard-muted hover:text-white"
                }`}
              >
                {t === "dark" ? "🌙 Dark" : "☀️ Light"}
              </button>
            ))}
          </div>
        </div>

        {/* Refresh Interval */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Refresh Interval</p>
            <p className="text-sm text-dashboard-muted">How often to check service health (seconds)</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              aria-label="Health check refresh interval in seconds"
              aria-valuemin={5}
              aria-valuemax={120}
              aria-valuenow={refreshInterval}
              className="w-32 accent-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface"
            />
            <span className="text-white font-mono w-12 text-right" aria-live="polite">{refreshInterval}s</span>
          </div>
        </div>

        {/* Demo Mode */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Demo Mode</p>
            <p className="text-sm text-dashboard-muted">Show simulated metrics when services are unreachable</p>
          </div>
          <button
            onClick={() => setDemoMode(!demoMode)}
            role="switch"
            aria-checked={demoMode}
            aria-label={`Demo mode: ${demoMode ? 'on' : 'off'}`}
            className={`relative w-12 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface ${
              demoMode ? "bg-brand-500" : "bg-dashboard-border"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                demoMode ? "left-6" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Service URLs */}
      <div className="bg-dashboard-surface rounded-xl border border-dashboard-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Service Endpoints</h2>
        <p className="text-sm text-dashboard-muted">
          Configure base URLs for each Cloudflare Worker service.
          Leave blank to use defaults.
        </p>
        <div className="space-y-3">
          {[
            { label: "RPC Proxy", env: "SERVICE_URL_RPC_PROXY", default: "/api/rpc" },
            { label: "Keys Server", env: "SERVICE_URL_KEYS_SERVER", default: "/api/keys" },
            { label: "Relay Server", env: "SERVICE_URL_RELAY_SERVER", default: "/api/relay" },
            { label: "Notify Server", env: "SERVICE_URL_NOTIFY_SERVER", default: "/api/notify" },
            { label: "Push Server", env: "SERVICE_URL_PUSH_SERVER", default: "/api/push" },
          ].map((svc) => (
            <div key={svc.env} className="flex items-center gap-3">
              <span className="text-sm text-dashboard-muted w-28">{svc.label}</span>
              <input
                type="text"
                defaultValue={svc.default}
                aria-label={`${svc.label} endpoint URL`}
                className="flex-1 bg-dashboard-bg border border-dashboard-border rounded-lg px-3 py-2 text-sm text-white placeholder-dashboard-muted/50 focus:outline-none focus:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface"
                placeholder="https://..."
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          aria-label="Save dashboard settings"
          className="px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-surface"
        >
          {saved ? "✓ Saved" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
