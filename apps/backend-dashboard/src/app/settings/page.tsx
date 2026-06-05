"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [demoMode, setDemoMode] = useState(true);
  const [saved, setSaved] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [downAlertThreshold, setDownAlertThreshold] = useState(60);
  const [degradedAlertThreshold, setDegradedAlertThreshold] = useState(30);
  const [apiUrl, setApiUrl] = useState("https://api.cinacoin.com");
  const [wsUrl, setWsUrl] = useState("wss://ws.cinacoin.com");

  const handleSave = () => {
    localStorage.setItem("dashboard-settings", JSON.stringify({
      refreshInterval,
      theme,
      demoMode,
      soundEnabled,
      emailAlerts,
      downAlertThreshold,
      degradedAlertThreshold,
      apiUrl,
      wsUrl,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tighter text-white">⚙️ Settings</h1>
          <p className="text-dashboard-muted mt-1">Configure dashboard preferences and API endpoints</p>
        </div>
        {saved && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-dashboard-success/10 text-dashboard-success border border-dashboard-success/30">
            ✓ Saved
          </span>
        )}
      </div>

      {/* Appearance */}
      <div className="bg-dashboard-surface rounded-md border border-dashboard-border p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Appearance</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Theme</p>
              <p className="text-sm text-dashboard-muted">Choose your preferred dashboard theme</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme("dark")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  theme === "dark"
                    ? "bg-brand-500/20 text-brand-400 border-brand-500/30"
                    : "text-dashboard-muted border-dashboard-border hover:text-white"
                }`}
              >
                🌙 Dark
              </button>
              <button
                onClick={() => setTheme("light")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  theme === "light"
                    ? "bg-brand-500/20 text-brand-400 border-brand-500/30"
                    : "text-dashboard-muted border-dashboard-border hover:text-white"
                }`}
              >
                ☀️ Light
              </button>
            </div>
          </div>
          <hr className="border-dashboard-border" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Demo Mode</p>
              <p className="text-sm text-dashboard-muted">Use simulated metrics instead of live data</p>
            </div>
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                demoMode ? "bg-brand-500" : "bg-dashboard-border"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                demoMode ? "translate-x-6" : ""
              }`} />
            </button>
          </div>
          <hr className="border-dashboard-border" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Sound Alerts</p>
              <p className="text-sm text-dashboard-muted">Play sound when a service goes down</p>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                soundEnabled ? "bg-brand-500" : "bg-dashboard-border"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                soundEnabled ? "translate-x-6" : ""
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Monitoring */}
      <div className="bg-dashboard-surface rounded-md border border-dashboard-border p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Monitoring</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Health Check Interval</p>
              <p className="text-sm text-dashboard-muted">How often to check worker health (seconds)</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="w-20 bg-dashboard-border/30 border border-dashboard-border rounded-lg px-3 py-1.5 text-white text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
                min={10}
                max={300}
              />
              <span className="text-sm text-dashboard-muted">seconds</span>
            </div>
          </div>
          <hr className="border-dashboard-border" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Email Alerts</p>
              <p className="text-sm text-dashboard-muted">Receive email notifications for service issues</p>
            </div>
            <button
              onClick={() => setEmailAlerts(!emailAlerts)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                emailAlerts ? "bg-brand-500" : "bg-dashboard-border"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                emailAlerts ? "translate-x-6" : ""
              }`} />
            </button>
          </div>
          <hr className="border-dashboard-border" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Alert: Service Down</p>
              <p className="text-sm text-dashboard-muted">Notify after service is down for (seconds)</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={downAlertThreshold}
                onChange={(e) => setDownAlertThreshold(Number(e.target.value))}
                className="w-20 bg-dashboard-border/30 border border-dashboard-border rounded-lg px-3 py-1.5 text-white text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
                min={10}
                max={600}
              />
              <span className="text-sm text-dashboard-muted">seconds</span>
            </div>
          </div>
          <hr className="border-dashboard-border" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Alert: Service Degraded</p>
              <p className="text-sm text-dashboard-muted">Notify after service is degraded for (seconds)</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={degradedAlertThreshold}
                onChange={(e) => setDegradedAlertThreshold(Number(e.target.value))}
                className="w-20 bg-dashboard-border/30 border border-dashboard-border rounded-lg px-3 py-1.5 text-white text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
                min={10}
                max={600}
              />
              <span className="text-sm text-dashboard-muted">seconds</span>
            </div>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-dashboard-surface rounded-md border border-dashboard-border p-5">
        <h3 className="text-lg font-semibold text-white mb-4">API Endpoints</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-dashboard-muted mb-1">RPC API URL</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full bg-dashboard-border/30 border border-dashboard-border rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm text-dashboard-muted mb-1">WebSocket URL</label>
            <input
              type="text"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              className="w-full bg-dashboard-border/30 border border-dashboard-border rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="bg-dashboard-surface rounded-md border border-dashboard-border p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Dashboard Info</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-dashboard-muted">Version</p>
            <p className="text-lg font-semibold text-white">v0.1.0</p>
          </div>
          <div>
            <p className="text-sm text-dashboard-muted">Framework</p>
            <p className="text-lg font-semibold text-white">Next.js 15</p>
          </div>
          <div>
            <p className="text-sm text-dashboard-muted">Deploy Target</p>
            <p className="text-lg font-semibold text-white">Cloudflare Pages</p>
          </div>
          <div>
            <p className="text-sm text-dashboard-muted">Last Build</p>
            <p className="text-lg font-semibold text-white">Jun 3, 2026</p>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
            setRefreshInterval(30);
            setTheme("dark");
            setDemoMode(true);
            setSoundEnabled(false);
            setEmailAlerts(true);
            setDownAlertThreshold(60);
            setDegradedAlertThreshold(30);
            setApiUrl("https://api.cinacoin.com");
            setWsUrl("wss://ws.cinacoin.com");
          }}
          className="px-4 py-2 text-sm text-dashboard-muted border border-dashboard-border rounded-[100px] hover:text-white hover:border-white/30 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm bg-brand-500 text-white rounded-[100px] hover:bg-brand-600 transition-colors font-medium"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
