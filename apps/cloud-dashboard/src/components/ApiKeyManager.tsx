'use client';

import { useState } from 'react';

interface ApiKey {
  id: string;
  label: string;
  permissions: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

const mockKeys: ApiKey[] = [
  { id: 'key_1', label: 'Production Key', permissions: 'read,write', isActive: true, createdAt: '2025-01-01', lastUsedAt: '2025-01-15' },
  { id: 'key_2', label: 'Testing Key', permissions: 'read', isActive: true, createdAt: '2025-01-05', lastUsedAt: '2025-01-14' },
  { id: 'key_3', label: 'Deprecated', permissions: 'read,write', isActive: false, createdAt: '2024-12-01', lastUsedAt: '2025-01-01' },
];

export function ApiKeyManager({ projectId }: { projectId: string }) {
  const [keys, setKeys] = useState(mockKeys);
  const [showNewKey, setShowNewKey] = useState('');

  const generateKey = () => {
    const key = 'ck_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0')).join('');
    const now = new Date().toISOString().slice(0, 10);
    const entry: ApiKey = {
      id: 'key_' + Date.now(),
      label: 'New Key',
      permissions: 'read,write',
      isActive: true,
      createdAt: now,
      lastUsedAt: null,
    };
    setKeys((prev) => [entry, ...prev]);
    setShowNewKey(key);
  };

  const revokeKey = (id: string) => {
    setKeys(keys.map((k) => k.id === id ? { ...k, isActive: false } : k));
    setShowNewKey('');
  };

  return (
    <div className="space-y-4">
      {/* Generate new key */}
      <div className="flex items-center gap-3">
        <button
          onClick={generateKey}
          className="cc-btn-primary-sm !h-9 px-4 text-sm"
        >
          Generate API Key
        </button>
      </div>

      {/* Show newly generated key */}
      {showNewKey && (
        <div className="rounded-lg border border-[var(--cc-success)]/30 bg-[var(--cc-canvas)] p-4 shadow-[var(--cc-level1)]">
          <p className="mb-2 text-sm font-medium text-[var(--cc-success)]">New API Key Generated</p>
          <code className="block rounded bg-[var(--cc-canvas-soft)] px-3 py-2 text-sm font-mono text-[var(--cc-ink)] break-all">
            {showNewKey}
          </code>
          <p className="mt-2 text-xs text-[var(--cc-muted)]">Save this key now. It won&apos;t be shown again.</p>
        </div>
      )}

      {/* Keys list */}
      <div className="space-y-2">
        {keys.map((key) => (
          <div
            key={key.id}
            className={`flex items-center justify-between rounded-lg border p-4 transition ${
              key.isActive ? 'border-[var(--cc-hairline)] bg-[var(--cc-canvas)]' : 'border-[var(--cc-hairline)]/50 bg-[var(--cc-canvas-soft)]/50 opacity-60'
            }`}
          >
            <div>
              <div className="text-sm font-medium text-[var(--cc-ink)]">{key.label}</div>
              <div className="mt-0.5 text-xs text-[var(--cc-muted)]">
                {key.permissions} • Created {key.createdAt}
                {key.lastUsedAt && ` • Last used ${key.lastUsedAt}`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`cc-badge ${
                key.isActive ? '!bg-[var(--cc-link-bg-soft)] !text-[var(--cc-link-deep)]' : '!bg-[var(--cc-error-soft)] !text-[var(--cc-error-deep)]'
              }`}>
                {key.isActive ? 'Active' : 'Revoked'}
              </span>
              {key.isActive && (
                <button
                  onClick={() => revokeKey(key.id)}
                  className="rounded-md border border-[var(--cc-error)]/20 bg-[var(--cc-error-soft)]/20 px-3 py-1 text-xs font-medium text-[var(--cc-error)] transition hover:bg-[var(--cc-error-soft)]/50"
                >
                  Revoke
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
