"use client";

import { useState } from "react";
import Header from "@/components/Header";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");

  return (
    <div className="min-h-screen bg-[var(--cc-canvas)]">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--cc-ink)]">Account Settings</h1>
          <p className="mt-1 text-sm text-[var(--cc-body)]">
            Manage your account preferences and API access.
          </p>
        </div>

        {/* API Access */}
        <div className="mb-6 rounded-lg border border-[var(--cc-hairline)] bg-[var(--cc-card)] p-6 shadow-[var(--cc-level1)]" style={{ boxShadow: 'var(--cc-level2)' }}>
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-[var(--cc-ink)]">API Access</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--cc-ink)]">
                Default API Key
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={apiKey || "Not configured"}
                  readOnly
                  className="flex-1 rounded-md border border-[var(--cc-hairline)] bg-[var(--cc-canvas-soft)] px-3 py-2 text-sm font-mono text-[var(--cc-ink)]"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(apiKey)}
                  className="rounded-[var(--cc-radius-sm)] border border-[var(--cc-hairline)] bg-[var(--cc-canvas)] px-3 py-2 text-sm font-medium text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft-2)]"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="mb-6 rounded-lg border border-[var(--cc-hairline)] bg-[var(--cc-card)] p-6 shadow-[var(--cc-level1)]" style={{ boxShadow: 'var(--cc-level2)' }}>
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-[var(--cc-ink)]">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--cc-ink)]">
                Display Name
              </label>
              <input
                type="text"
                defaultValue="十三先生"
                className="mt-1 block w-full rounded-md border border-[var(--cc-hairline)] bg-[var(--cc-canvas)] px-3 py-2 text-sm text-[var(--cc-ink)] shadow-[var(--cc-level1)] focus:border-[var(--cc-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--cc-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--cc-ink)]">
                Email
              </label>
              <input
                type="email"
                defaultValue="user@cinacoin.dev"
                className="mt-1 block w-full rounded-md border border-[var(--cc-hairline)] bg-[var(--cc-canvas)] px-3 py-2 text-sm text-[var(--cc-ink)] shadow-[var(--cc-level1)] focus:border-[var(--cc-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--cc-primary)]"
              />
            </div>
            <button className="rounded-[100px] bg-[var(--cc-primary)] px-4 py-2 text-sm font-medium text-[var(--cc-on-primary)] hover:opacity-85">
              Save Changes
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-lg border border-red-200 bg-[var(--cc-card)] p-6 shadow-[var(--cc-level1)]" style={{ boxShadow: 'var(--cc-level2)' }}>
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-red-600">Danger Zone</h2>
          <p className="mb-4 text-sm text-[var(--cc-body)]">
            Once you delete your account, there is no going back.
          </p>
          <button className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100">
            Delete Account
          </button>
        </div>
      </main>
    </div>
  );
}
