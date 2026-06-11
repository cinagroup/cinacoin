"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-canvas border-b border-hairline h-14 flex items-center px-6 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-sm hover:bg-canvas-soft-2 mr-4 transition-colors duration-fast"
          >
            <svg className="w-5 h-5 text-body" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>
        <Breadcrumbs />

        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <p className="font-mono text-xs text-mute mb-2">CONFIGURATION</p>
            <h1 className="text-heading-2 text-ink">Settings</h1>
            <p className="text-body-sm text-body mt-1">Manage your account settings and preferences</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-hairline mb-6">
            <nav className="flex gap-6">
              {["profile", "security", "notifications", "api"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-body-sm font-medium capitalize transition-colors border-b-2 ${
                    activeTab === tab
                      ? "text-ink border-link"
                      : "text-body border-transparent hover:text-ink"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="bg-canvas border border-hairline rounded-md p-6">
              <h2 className="text-heading-3 text-ink mb-6">Profile Information</h2>
              <form className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first-name" className="block text-body-sm font-medium text-ink mb-2">First Name</label>
                    <input
                      type="text"
                      defaultValue="Admin"
                      className="cc-form-input"
                    />
                  </div>
                  <div>
                    <label htmlFor="last-name" className="block text-body-sm font-medium text-ink mb-2">Last Name</label>
                    <input
                      type="text"
                      defaultValue="User"
                      className="cc-form-input"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email-address" className="block text-body-sm font-medium text-ink mb-2">Email Address</label>
                  <input
                    type="email"
                    defaultValue="admin@cinacoin.com"
                    className="cc-form-input"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-body-sm font-medium text-ink mb-2">Company</label>
                  <input
                    type="text"
                    defaultValue="CinaCoin"
                    className="cc-form-input"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-hairline">
                  <button type="button" className="cc-btn-secondary px-4 py-2">Cancel</button>
                  <button type="submit" className="cc-btn-primary px-4 py-2">Save Changes</button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="bg-canvas border border-hairline rounded-md p-6">
                <h2 className="text-heading-3 text-ink mb-6">Change Password</h2>
                <form className="space-y-4">
                  <div>
                    <label htmlFor="current-password" className="block text-body-sm font-medium text-ink mb-2">Current Password</label>
                    <input id="current-password" type="password" className="cc-form-input" />
                  </div>
                  <div>
                    <label htmlFor="new-password" className="block text-body-sm font-medium text-ink mb-2">New Password</label>
                    <input id="new-password" type="password" className="cc-form-input" />
                  </div>
                  <div>
                    <label htmlFor="confirm-new-password" className="block text-body-sm font-medium text-ink mb-2">Confirm New Password</label>
                    <input id="confirm-new-password" type="password" className="cc-form-input" />
                  </div>
                  <div className="flex justify-end pt-4 border-t border-hairline">
                    <button type="submit" className="cc-btn-primary px-4 py-2">Update Password</button>
                  </div>
                </form>
              </div>

              <div className="bg-canvas border border-hairline rounded-md p-6">
                <h2 className="text-heading-3 text-ink mb-4">Two-Factor Authentication</h2>
                <p className="text-body-sm text-body mb-4">
                  Add an extra layer of security to your account by enabling two-factor authentication.
                </p>
                <button className="cc-btn-secondary px-4 py-2">Enable 2FA</button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="bg-canvas border border-hairline rounded-md p-6">
              <h2 className="text-heading-3 text-ink mb-6">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { label: "Email notifications", desc: "Receive email notifications for important updates" },
                  { label: "Billing alerts", desc: "Get notified about billing changes and invoices" },
                  { label: "Security alerts", desc: "Receive alerts for security-related events" },
                  { label: "Product updates", desc: "Stay informed about new features and improvements" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between py-4 border-b border-hairline last:border-b-0">
                    <div>
                      <p className="text-body-sm font-medium text-ink">{item.label}</p>
                      <p className="text-caption text-mute mt-1">{item.desc}</p>
                    </div>
                    <label htmlFor="field-149" className="relative inline-flex items-center cursor-pointer">
                      <input id="field-149" type="checkbox" defaultChecked={idx < 2} className="sr-only peer" />
                      <div className="w-11 h-6 bg-canvas-soft-2 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-link/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[var(--color-canvas)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-canvas after:border-hairline after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-link"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API Tab */}
          {activeTab === "api" && (
            <div className="bg-canvas border border-hairline rounded-md p-6">
              <h2 className="text-heading-3 text-ink mb-6">API Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="api-endpoint" className="block text-body-sm font-medium text-ink mb-2">API Endpoint</label>
                  <input
                    type="text"
                    value="https://api.cinacoin.com/v1"
                    readOnly
                    className="cc-form-input bg-canvas-soft-2"
                  />
                </div>
                <div>
                  <label htmlFor="websocket-endpoint" className="block text-body-sm font-medium text-ink mb-2">WebSocket Endpoint</label>
                  <input
                    type="text"
                    value="wss://ws.cinacoin.com"
                    readOnly
                    className="cc-form-input bg-canvas-soft-2"
                  />
                </div>
                <div className="pt-4 border-t border-hairline">
                  <p className="text-caption text-mute">
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
