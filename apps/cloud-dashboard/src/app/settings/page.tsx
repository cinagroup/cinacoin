"use client";

import { useState, type FormEvent } from "react";
import Header from "@/components/Header";

export default function SettingsPage() {
  const [apiKey] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    // Demo: persist locally. A production build would PATCH the profile API.
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      "Delete your account? This action is permanent and cannot be undone."
    );
    if (confirmed) {
      // Demo: a production build would call the account-deletion endpoint here.
      window.alert("Account deletion requested (demo).");
    }
  };

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
                  type="button"
                  onClick={() => apiKey && navigator.clipboard.writeText(apiKey)}
                  disabled={!apiKey}
                  className="rounded-[var(--cc-radius-sm)] border border-[var(--cc-hairline)] bg-[var(--cc-canvas)] px-3 py-2 text-sm font-medium text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft-2)] disabled:opacity-50"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile */}
        <form
          onSubmit={handleSaveProfile}
          className="mb-6 rounded-lg border border-[var(--cc-hairline)] bg-[var(--cc-card)] p-6 shadow-[var(--cc-level1)]"
          style={{ boxShadow: 'var(--cc-level2)' }}
        >
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-[var(--cc-ink)]">Profile</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-[var(--cc-ink)]">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="mt-1 block w-full rounded-md border border-[var(--cc-hairline)] bg-[var(--cc-canvas)] px-3 py-2 text-sm text-[var(--cc-ink)] shadow-[var(--cc-level1)] focus:border-[var(--cc-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--cc-primary)]"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--cc-ink)]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 block w-full rounded-md border border-[var(--cc-hairline)] bg-[var(--cc-canvas)] px-3 py-2 text-sm text-[var(--cc-ink)] shadow-[var(--cc-level1)] focus:border-[var(--cc-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--cc-primary)]"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-[100px] bg-[var(--cc-primary)] px-4 py-2 text-sm font-medium text-[var(--cc-on-primary)] hover:opacity-85"
              >
                Save Changes
              </button>
              {saved && (
                <span className="text-sm text-[var(--cc-success)]">Saved</span>
              )}
            </div>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="rounded-lg border border-red-200 bg-[var(--cc-card)] p-6 shadow-[var(--cc-level1)]" style={{ boxShadow: 'var(--cc-level2)' }}>
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-[var(--cc-error)]">Danger Zone</h2>
          <p className="mb-4 text-sm text-[var(--cc-body)]">
            Once you delete your account, there is no going back.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="rounded-md border border-[var(--cc-error-soft)] bg-[var(--cc-error-soft)] px-4 py-2 text-sm font-medium text-[var(--cc-error)] hover:bg-[var(--cc-error-soft)]"
          >
            Delete Account
          </button>
        </div>
      </main>
    </div>
  );
}
