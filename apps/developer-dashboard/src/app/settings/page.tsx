"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "Developer",
    email: "dev@example.com",
    company: "CinaCoin Labs",
    notifications: true,
    twoFactor: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setProfile({ ...profile, [target.name]: value });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-display-md font-semibold text-[var(--cc-ink)]">Account settings</h1>
        <p className="text-ink-body mt-1">Manage your account preferences and security.</p>
      </div>

      {/* Profile */}
      <div className="cc-card space-y-4">
        <h2 className="text-body-lg font-semibold text-[var(--cc-ink)]">Profile</h2>
        <div>
          <label className="block text-body-sm font-medium text-[var(--cc-ink)] mb-1">Display Name</label>
          <input
            name="name"
            type="text"
            className="cc-form-input"
            value={profile.name}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-body-sm font-medium text-[var(--cc-ink)] mb-1">Email</label>
          <input
            name="email"
            type="email"
            className="cc-form-input"
            value={profile.email}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-body-sm font-medium text-[var(--cc-ink)] mb-1">Company / Organization</label>
          <input
            name="company"
            type="text"
            className="cc-form-input"
            value={profile.company}
            onChange={handleChange}
          />
        </div>
        <button className="cc-btn-primary">Save Changes</button>
      </div>

      {/* Security */}
      <div className="cc-card space-y-4">
        <h2 className="text-body-lg font-semibold text-[var(--cc-ink)]">Security</h2>
        <div className="flex items-center justify-between p-4 bg-[var(--cc-canvas-soft)] rounded-sm">
          <div>
            <div className="text-body-sm font-medium text-[var(--cc-ink)]">Two-Factor Authentication</div>
            <div className="text-body-sm text-ink-mute">
              {profile.twoFactor ? "Enabled" : "Not enabled — recommended for security"}
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              name="twoFactor"
              type="checkbox"
              className="sr-only peer"
              checked={profile.twoFactor}
              onChange={handleChange}
            />
            <div className="w-11 h-6 bg-hairline-strong peer-focus:outline-none rounded-sm peer peer-checked:after:translate-x-full after:content[''] after:absolute after:top-[2px] after:left-[2px] after:bg-canvas after:rounded-sm after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-[var(--cc-canvas-soft)] rounded-sm">
          <div>
            <div className="text-body-sm font-medium text-[var(--cc-ink)]">Email Notifications</div>
            <div className="text-body-sm text-ink-mute">Receive alerts for key events</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              name="notifications"
              type="checkbox"
              className="sr-only peer"
              checked={profile.notifications}
              onChange={handleChange}
            />
            <div className="w-11 h-6 bg-hairline-strong peer-focus:outline-none rounded-sm peer peer-checked:after:translate-x-full after:content[''] after:absolute after:top-[2px] after:left-[2px] after:bg-canvas after:rounded-sm after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
          </label>
        </div>

        <button className="cc-btn-secondary">Change Password</button>
      </div>

      {/* Connected Wallets */}
      <div className="cc-card space-y-4">
        <h2 className="text-body-lg font-semibold text-[var(--cc-ink)]">Connected wallets</h2>
        <div className="p-4 bg-[var(--cc-canvas-soft)] rounded-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-warning/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-warning" aria-hidden="true" />
            </div>
            <div>
              <div className="text-body-sm font-medium text-[var(--cc-ink)]">MetaMask</div>
              <div className="text-body-sm text-ink-mute font-mono">0x1234...5678</div>
            </div>
          </div>
          <span className="badge badge-success">Connected</span>
        </div>
        <button className="cc-btn-secondary">+ Connect Wallet</button>
      </div>

      {/* Danger Zone */}
      <div className="cc-card border-danger/30">
        <h2 className="text-body-lg font-semibold text-danger mb-3">Danger zone</h2>
        <p className="text-body-sm text-ink-body mb-4">
          Permanently delete your account and all associated projects, API keys, and data.
        </p>
        <button className="cc-btn-danger">Delete Account</button>
      </div>
    </div>
  );
}
