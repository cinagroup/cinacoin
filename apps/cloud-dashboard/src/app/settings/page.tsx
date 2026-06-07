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
    <div className="min-h-screen bg-[var(--cc-canvas-soft)]">
      <Header />
      <main id="main-content" className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="cc-display-md text-[var(--cc-ink)]">Account Settings</h1>
          <p className="mt-1 text-sm text-[var(--cc-ink)]">
            Manage your account preferences and API access.
          </p>
        </div>

        {/* API Access */}
        <div className="mb-6 cc-card">
          <h2 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">API Access</h2>
          <div className="space-y-4">
            <div>
              <label className="cc-body-sm-strong text-[var(--cc-ink)] block">
                Default API Key
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={apiKey || "Not configured"}
                  readOnly
                  className="flex-1 cc-form-input bg-[var(--cc-canvas-soft)] font-mono"
                />
                <button
                  type="button"
                  onClick={() => apiKey && navigator.clipboard.writeText(apiKey)}
                  disabled={!apiKey}
                  className="cc-btn-secondary-sm disabled:opacity-50"
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
          className="mb-6 cc-card"
        >
          <h2 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className="cc-body-sm-strong text-[var(--cc-ink)] block">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="mt-1 cc-form-input"
              />
            </div>
            <div>
              <label htmlFor="email" className="cc-body-sm-strong text-[var(--cc-ink)] block">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 cc-form-input"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="cc-btn-primary-sm !h-9 px-4 text-sm"
              >
                Save Changes
              </button>
              {saved && (
                <span className="text-sm text-[var(--cc-success)] font-medium">Saved</span>
              )}
            </div>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="cc-card border border-[var(--cc-error)] bg-[var(--cc-error-soft)]/10">
          <h2 className="cc-body-md-strong text-[var(--cc-error)] mb-4">Danger Zone</h2>
          <p className="cc-body-sm text-[var(--cc-ink)] mb-4">
            Once you delete your account, there is no going back.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="cc-btn-primary-sm bg-[var(--cc-error)] hover:bg-[var(--cc-error-deep)]"
          >
            Delete Account
          </button>
        </div>
      </main>
    </div>
  );
}
