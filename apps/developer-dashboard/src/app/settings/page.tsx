"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "Developer",
    email: "dev@example.com",
    company: "Cinacoin Labs",
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
        <h1 className="text-[24px] font-semibold text-ink">Account Settings</h1>
        <p className="text-ink-body mt-1">Manage your account preferences and security.</p>
      </div>

      {/* Profile */}
      <div className="card space-y-4">
        <h2 className="text-[18px] font-semibold text-ink">Profile</h2>
        <div>
          <label className="block text-[14px] font-medium text-ink mb-1">Display Name</label>
          <input
            name="name"
            type="text"
            className="input"
            value={profile.name}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-[14px] font-medium text-ink mb-1">Email</label>
          <input
            name="email"
            type="email"
            className="input"
            value={profile.email}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-[14px] font-medium text-ink mb-1">Company / Organization</label>
          <input
            name="company"
            type="text"
            className="input"
            value={profile.company}
            onChange={handleChange}
          />
        </div>
        <button className="btn-primary">Save Changes</button>
      </div>

      {/* Security */}
      <div className="card space-y-4">
        <h2 className="text-[18px] font-semibold text-ink">Security</h2>
        <div className="flex items-center justify-between p-4 bg-canvas-soft rounded-lg">
          <div>
            <div className="text-[14px] font-medium text-ink">Two-Factor Authentication</div>
            <div className="text-[14px] text-ink-mute">
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
            <div className="w-11 h-6 bg-hairline-dark peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--color-canvas)] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-canvas-soft rounded-lg">
          <div>
            <div className="text-[14px] font-medium text-ink">Email Notifications</div>
            <div className="text-[14px] text-ink-mute">Receive alerts for key events</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              name="notifications"
              type="checkbox"
              className="sr-only peer"
              checked={profile.notifications}
              onChange={handleChange}
            />
            <div className="w-11 h-6 bg-hairline-dark peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--color-canvas)] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
          </label>
        </div>

        <button className="btn-secondary">Change Password</button>
      </div>

      {/* Connected Wallets */}
      <div className="card space-y-4">
        <h2 className="text-[18px] font-semibold text-ink">Connected Wallets</h2>
        <div className="p-4 bg-canvas-soft rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[24px]">🦊</span>
            <div>
              <div className="text-[14px] font-medium text-ink">MetaMask</div>
              <div className="text-[14px] text-ink-mute font-[var(--font-mono)]">0x1234...5678</div>
            </div>
          </div>
          <span className="badge badge-success">Connected</span>
        </div>
        <button className="btn-secondary">+ Connect Wallet</button>
      </div>

      {/* Danger Zone */}
      <div className="card border-danger/30">
        <h2 className="text-[18px] font-semibold text-danger mb-3">Danger Zone</h2>
        <p className="text-[14px] text-ink-body mb-4">
          Permanently delete your account and all associated projects, API keys, and data.
        </p>
        <button className="btn-danger">Delete Account</button>
      </div>
    </div>
  );
}
