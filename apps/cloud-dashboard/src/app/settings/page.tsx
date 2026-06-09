"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [displayName, setDisplayName] = useState("Admin");
  const [email, setEmail] = useState("admin@cinacoin.com");
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-canvas border-b border-hairline h-14 flex items-center px-6 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-sm hover:bg-canvas-soft-2 mr-4 transition-colors duration-fast"
          >
            <svg className="w-5 h-5 text-body" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-body-sm font-medium text-ink">Settings</h1>
        </header>
        <Breadcrumbs />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-3xl">
            <div className="mb-8">
              <h1 className="text-heading-2 text-ink">Settings</h1>
              <p className="text-body-sm text-body mt-1">
                Manage your account preferences and notifications.
              </p>
            </div>

            {/* Profile Section */}
            <form onSubmit={handleSave} className="bg-canvas rounded-md shadow-level-2 p-6 mb-6">
              <h2 className="text-heading-3 text-ink mb-4">Profile</h2>
              <div className="space-y-5">
                <div>
                  <label htmlFor="displayName" className="block text-body-sm font-medium text-ink mb-2">
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-body-sm font-medium text-ink mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-hairline">
                  <div className="flex items-center gap-3">
                    <input
                      id="notifications"
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      className="w-4 h-4 rounded border-hairline text-link focus:ring-link"
                    />
                    <label htmlFor="notifications" className="text-body-sm text-ink">
                      Email notifications for account activity
                    </label>
                  </div>
                  <button type="submit" className="btn-primary px-4 py-2">
                    Save Changes
                  </button>
                </div>

                {saved && (
                  <div className="bg-success/10 text-success text-body-sm font-medium px-4 py-2 rounded-sm">
                    ✓ Settings saved successfully
                  </div>
                )}
              </div>
            </form>

            {/* API Keys Section */}
            <div className="bg-canvas rounded-md shadow-level-2 p-6 mb-6">
              <h2 className="text-heading-3 text-ink mb-4">API Access</h2>
              <p className="text-body-sm text-body mb-4">
                Manage your API keys for programmatic access to CinaCoin Cloud.
              </p>
              <a href="/api-keys" className="btn-secondary px-4 py-2 inline-block">
                Manage API Keys →
              </a>
            </div>

            {/* Danger Zone */}
            <div className="bg-canvas rounded-md shadow-level-2 p-6 border border-error/20">
              <h2 className="text-heading-3 text-error mb-4">Danger Zone</h2>
              <p className="text-body-sm text-body mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                    alert("Account deletion requested (demo)");
                  }
                }}
                className="bg-error text-on-primary px-4 py-2 rounded-sm hover:bg-error/90 transition-colors duration-fast"
              >
                Delete Account
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
