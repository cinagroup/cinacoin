"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-[var(--cc-canvas)] border-b border-[var(--cc-hairline)] h-14 flex items-center px-6 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-sm hover:bg-[var(--cc-canvas-soft-2)] mr-4 transition-colors duration-fast"
          >
            <Menu className="w-5 h-5 text-body" />
          </button>
        </header>
        <Breadcrumbs />

        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <h1 className="text-heading-2 text-[var(--cc-ink)]">Settings.</h1>
            <p className="text-body-sm text-body mt-1">Manage your account preferences and security.</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-[var(--cc-hairline)] mb-6">
            <nav className="flex gap-6">
              {["profile", "security", "notifications", "api"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-body-sm font-medium capitalize transition-colors border-b-2 ${
                    activeTab === tab
                      ? "text-[var(--cc-ink)] border-link"
                      : "text-body border-transparent hover:text-[var(--cc-ink)]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-md p-6">
              <h2 className="text-heading-3 text-[var(--cc-ink)] mb-6">Profile information.</h2>
              <form className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first-name" className="block text-body-sm font-medium text-[var(--cc-ink)] mb-2">First name</label>
                    <input
                      type="text"
                      defaultValue="Alex"
                      className="cc-form-input"
                    />
                  </div>
                  <div>
                    <label htmlFor="last-name" className="block text-body-sm font-medium text-[var(--cc-ink)] mb-2">Last name</label>
                    <input
                      type="text"
                      defaultValue="Chen"
                      className="cc-form-input"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email-address" className="block text-body-sm font-medium text-[var(--cc-ink)] mb-2">Email address</label>
                  <input
                    type="email"
                    defaultValue="alex.chen@cinacoin.com"
                    className="cc-form-input"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-body-sm font-medium text-[var(--cc-ink)] mb-2">Company</label>
                  <input
                    type="text"
                    defaultValue="Cinacoin Technologies"
                    className="cc-form-input"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-body-sm font-medium text-[var(--cc-ink)] mb-2">Role</label>
                  <input
                    type="text"
                    defaultValue="Engineering Lead"
                    className="cc-form-input"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--cc-hairline)]">
                  <button type="button" className="cc-btn-secondary px-4 py-2">Cancel</button>
                  <button type="submit" className="cc-btn-primary px-4 py-2">Save changes</button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-md p-6">
                <h2 className="text-heading-3 text-[var(--cc-ink)] mb-6">Change password.</h2>
                <form className="space-y-4">
                  <div>
                    <label htmlFor="current-password" className="block text-body-sm font-medium text-[var(--cc-ink)] mb-2">Current password</label>
                    <input id="current-password" type="password" className="cc-form-input" />
                  </div>
                  <div>
                    <label htmlFor="new-password" className="block text-body-sm font-medium text-[var(--cc-ink)] mb-2">New password</label>
                    <input id="new-password" type="password" className="cc-form-input" />
                    <p className="text-caption text-[var(--cc-muted)] mt-1">Minimum 12 characters with at least one number and special character.</p>
                  </div>
                  <div>
                    <label htmlFor="confirm-new-password" className="block text-body-sm font-medium text-[var(--cc-ink)] mb-2">Confirm new password</label>
                    <input id="confirm-new-password" type="password" className="cc-form-input" />
                  </div>
                  <div className="flex justify-end pt-4 border-t border-[var(--cc-hairline)]">
                    <button type="submit" className="cc-btn-primary px-4 py-2">Update password</button>
                  </div>
                </form>
              </div>

              <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-md p-6">
                <h2 className="text-heading-3 text-[var(--cc-ink)] mb-4">Two-factor authentication.</h2>
                <p className="text-body-sm text-body mb-4">
                  Add an extra layer of security by requiring a verification code from your authenticator app.
                </p>
                <div className="flex items-center justify-between p-4 bg-[var(--cc-canvas-soft)] border border-[var(--cc-hairline)] rounded">
                  <div>
                    <p className="text-body-sm font-medium text-[var(--cc-ink)]">Authenticator app</p>
                    <p className="text-caption text-[var(--cc-muted)]">Google Authenticator, Authy, or similar</p>
                  </div>
                  <button className="cc-btn-secondary px-4 py-2">Enable 2FA</button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-md p-6">
              <h2 className="text-heading-3 text-[var(--cc-ink)] mb-6">Notification preferences.</h2>
              <div className="space-y-4">
                {[
                  { label: "Email notifications", desc: "Receive email notifications for important updates", default: true },
                  { label: "Billing alerts", desc: "Get notified about billing changes and invoices", default: true },
                  { label: "Security alerts", desc: "Receive alerts for security-related events", default: true },
                  { label: "Product updates", desc: "Stay informed about new features and improvements", default: false },
                ].map((item, idx) => (
                  <div key={item.label} className="flex items-start justify-between py-4 border-b border-[var(--cc-hairline)] last:border-b-0">
                    <div>
                      <p className="text-body-sm font-medium text-[var(--cc-ink)]">{item.label}</p>
                      <p className="text-caption text-[var(--cc-muted)] mt-1">{item.desc}</p>
                    </div>
                    <label htmlFor={`toggle-${idx}`} className="relative inline-flex items-center cursor-pointer">
                      <input id={`toggle-${idx}`} type="checkbox" defaultChecked={item.default} className="sr-only peer" />
                      <div className="w-11 h-6 bg-[var(--cc-canvas-soft-2)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-link/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[var(--color-canvas)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--cc-canvas)] after:border-[var(--cc-hairline)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-link"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API Tab */}
          {activeTab === "api" && (
            <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-md p-6">
              <h2 className="text-heading-3 text-[var(--cc-ink)] mb-6">API configuration.</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="api-endpoint" className="block text-body-sm font-medium text-[var(--cc-ink)] mb-2">API endpoint</label>
                  <input
                    type="text"
                    value="https://api.cinacoin.com/v1"
                    readOnly
                    className="cc-form-input bg-[var(--cc-canvas-soft-2)]"
                  />
                </div>
                <div>
                  <label htmlFor="websocket-endpoint" className="block text-body-sm font-medium text-[var(--cc-ink)] mb-2">WebSocket endpoint</label>
                  <input
                    type="text"
                    value="wss://ws.cinacoin.com"
                    readOnly
                    className="cc-form-input bg-[var(--cc-canvas-soft-2)]"
                  />
                </div>
                <div className="pt-4 border-t border-[var(--cc-hairline)]">
                  <p className="text-caption text-[var(--cc-muted)]">
                    For API documentation, visit{" "}
                    <a href="https://docs.cinacoin.com" className="text-link hover:underline">
                      docs.cinacoin.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
