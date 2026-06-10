'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';

export default function SettingsPage() {
  const { connected, address, chain, connect, disconnect } = useWallet();
  const [currency, setCurrency] = useState('USD');
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // TODO: persist settings
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-2 text-ink">Settings</h1>
        <p className="mt-1 text-body text-mute">Manage your wallet preferences.</p>
      </div>

      {/* Connection Status */}
      <div className="cc-card">
        <h2 className="text-heading-3 text-ink mb-4">Connection</h2>
        {connected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-mute">Status</span>
              <span className="badge badge-success">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-mute">Address</span>
              <code className="text-caption-mono text-ink">
                {address?.slice(0, 10)}...{address?.slice(-6)}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-mute">Network</span>
              <span className="text-body-sm text-ink capitalize">{chain}</span>
            </div>
            <button onClick={disconnect} className="cc-btn-secondary mt-2">
              Disconnect Wallet
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-body-sm text-mute mb-3">No wallet connected.</p>
            <button onClick={connect} className="cc-btn-primary">
              Connect Wallet
            </button>
          </div>
        )}
      </div>

      {/* Preferences */}
      <div className="cc-card">
        <h2 className="text-heading-3 text-ink mb-4">Preferences</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-caption text-mute mb-2">Display Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="search-bar"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CNY">CNY (¥)</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-sm text-ink">Notifications</p>
              <p className="text-caption text-mute">Receive alerts for incoming transactions</p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                notifications ? 'bg-primary' : 'bg-hairline'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-canvas transition-transform ${
                  notifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="cc-card">
        <h2 className="text-heading-3 text-ink mb-4">Actions</h2>
        <div className="space-y-3">
          <button className="cc-btn-secondary w-full justify-start">
            Export Transaction History
          </button>
          <button className="cc-btn-secondary w-full justify-start">
            View Recovery Phrase
          </button>
          <button className="cc-btn-secondary w-full justify-start" style={{ color: 'var(--color-error)' }}>
            Reset Wallet
          </button>
        </div>
      </div>

      {saved && (
        <div className="rounded-lg bg-success-light p-4 text-body-sm text-center" style={{ color: 'var(--color-success)' }}>
          ✓ Settings saved successfully
        </div>
      )}

      <button onClick={handleSave} className="cc-btn-primary w-full py-3">
        Save Settings
      </button>
    </div>
  );
}
