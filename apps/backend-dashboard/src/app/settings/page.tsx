"use client";

import { useState, useCallback } from "react";

export default function SettingsPage() {
  const [refreshInterval, setRefreshInterval] = useState(30);
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

  const setLightTheme = useCallback(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  const setDarkTheme = useCallback(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="cc-display-sm text-[var(--cc-ink)]">Settings</h1>
          <p className="cc-body-sm text-[var(--cc-muted)] mt-1">Configure dashboard preferences and API endpoints</p>
        </div>
        {saved && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 cc-badge text-[var(--cc-success)] border border-[var(--cc-success)]/30">
            ✓ Saved
          </span>
        )}
      </div>

      {/* Appearance */}
      <div className="cc-card">
        <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Appearance</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="cc-body-sm-strong text-[var(--cc-ink)]">Theme</p>
              <p className="cc-body-sm text-[var(--cc-muted)]">Choose your preferred dashboard theme</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={setDarkTheme} className="cc-btn-secondary-sm">
                🌙 Dark
              </button>
              <button onClick={setLightTheme} className="cc-btn-secondary-sm">
                ☀️ Light
              </button>
            </div>
          </div>
          <hr className="border-[var(--cc-hairline)]" />
          <div className="flex items-center justify-between">
            <div>
              <p className="cc-body-sm-strong text-[var(--cc-ink)]">Demo Mode</p>
              <p className="cc-body-sm text-[var(--cc-muted)]">Use simulated metrics instead of live data</p>
            </div>
            <button onClick={() => setDemoMode(!demoMode)} className={`relative w-12 h-6 rounded-full transition-colors ${demoMode ? "bg-[var(--cc-link)]" : "bg-[var(--cc-hairline)]"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--cc-canvas)] rounded-full transition-transform ${demoMode ? "translate-x-6" : ""}`} />
            </button>
          </div>
          <hr className="border-[var(--cc-hairline)]" />
          <div className="flex items-center justify-between">
            <div>
              <p className="cc-body-sm-strong text-[var(--cc-ink)]">Sound Alerts</p>
              <p className="cc-body-sm text-[var(--cc-muted)]">Play sound when a service goes down</p>
            </div>
            <button onClick={() => setSoundEnabled(!soundEnabled)} className={`relative w-12 h-6 rounded-full transition-colors ${soundEnabled ? "bg-[var(--cc-link)]" : "bg-[var(--cc-hairline)]"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--cc-canvas)] rounded-full transition-transform ${soundEnabled ? "translate-x-6" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Monitoring */}
      <div className="cc-card">
        <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Monitoring</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="cc-body-sm-strong text-[var(--cc-ink)]">Health Check Interval</p>
              <p className="cc-body-sm text-[var(--cc-muted)]">How often to check worker health (seconds)</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="number" value={refreshInterval} onChange={(e) => setRefreshInterval(Number(e.target.value))} className="cc-form-input w-20 text-center" min={10} max={300} />
              <span className="cc-body-sm text-[var(--cc-muted)]">seconds</span>
            </div>
          </div>
          <hr className="border-[var(--cc-hairline)]" />
          <div className="flex items-center justify-between">
            <div>
              <p className="cc-body-sm-strong text-[var(--cc-ink)]">Email Alerts</p>
              <p className="cc-body-sm text-[var(--cc-muted)]">Receive email notifications for service issues</p>
            </div>
            <button onClick={() => setEmailAlerts(!emailAlerts)} className={`relative w-12 h-6 rounded-full transition-colors ${emailAlerts ? "bg-[var(--cc-link)]" : "bg-[var(--cc-hairline)]"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--cc-canvas)] rounded-full transition-transform ${emailAlerts ? "translate-x-6" : ""}`} />
            </button>
          </div>
          <hr className="border-[var(--cc-hairline)]" />
          <div className="flex items-center justify-between">
            <div>
              <p className="cc-body-sm-strong text-[var(--cc-ink)]">Alert: Service Down</p>
              <p className="cc-body-sm text-[var(--cc-muted)]">Notify after service is down for (seconds)</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="number" value={downAlertThreshold} onChange={(e) => setDownAlertThreshold(Number(e.target.value))} className="cc-form-input w-20 text-center" min={10} max={600} />
              <span className="cc-body-sm text-[var(--cc-muted)]">seconds</span>
            </div>
          </div>
          <hr className="border-[var(--cc-hairline)]" />
          <div className="flex items-center justify-between">
            <div>
              <p className="cc-body-sm-strong text-[var(--cc-ink)]">Alert: Service Degraded</p>
              <p className="cc-body-sm text-[var(--cc-muted)]">Notify after service is degraded for (seconds)</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="number" value={degradedAlertThreshold} onChange={(e) => setDegradedAlertThreshold(Number(e.target.value))} className="cc-form-input w-20 text-center" min={10} max={600} />
              <span className="cc-body-sm text-[var(--cc-muted)]">seconds</span>
            </div>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="cc-card">
        <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">API Endpoints</h3>
        <div className="space-y-4">
          <div>
            <label className="cc-body-sm text-[var(--cc-muted)] block mb-1">RPC API URL</label>
            <input type="text" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="cc-form-input font-mono" />
          </div>
          <div>
            <label className="cc-body-sm text-[var(--cc-muted)] block mb-1">WebSocket URL</label>
            <input type="text" value={wsUrl} onChange={(e) => setWsUrl(e.target.value)} className="cc-form-input font-mono" />
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="cc-card">
        <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Dashboard Info</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="cc-caption text-[var(--cc-muted)]">Version</p>
            <p className="cc-body-md-strong text-[var(--cc-ink)]">v0.1.0</p>
          </div>
          <div>
            <p className="cc-caption text-[var(--cc-muted)]">Framework</p>
            <p className="cc-body-md-strong text-[var(--cc-ink)]">Next.js 15</p>
          </div>
          <div>
            <p className="cc-caption text-[var(--cc-muted)]">Deploy Target</p>
            <p className="cc-body-md-strong text-[var(--cc-ink)]">Cloudflare Pages</p>
          </div>
          <div>
            <p className="cc-caption text-[var(--cc-muted)]">Last Build</p>
            <p className="cc-body-md-strong text-[var(--cc-ink)]">Jun 3, 2026</p>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end gap-3">
        <button onClick={() => {
            setRefreshInterval(30);
            setDemoMode(true);
            setSoundEnabled(false);
            setEmailAlerts(true);
            setDownAlertThreshold(60);
            setDegradedAlertThreshold(30);
            setApiUrl("https://api.cinacoin.com");
            setWsUrl("wss://ws.cinacoin.com");
          }}
          className="cc-btn-secondary-sm"
        >
          Reset
        </button>
        <button onClick={handleSave} className="cc-btn-primary-sm">Save Settings</button>
      </div>
    </div>
  );
}
