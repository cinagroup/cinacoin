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
  const [newKey, setNewKey] = useState('');
  const [showNewKey, setShowNewKey] = useState('');

  const generateKey = () => {
    const key = 'ck_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0')).join('');
    setNewKey(key);
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
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-500"
        >
          Generate API Key
        </button>
      </div>

      {/* Show newly generated key */}
      {showNewKey && (
        <div className="rounded-lg border border-emerald-800 bg-emerald-950/30 p-4">
          <p className="mb-2 text-sm font-medium text-emerald-400">New API Key Generated</p>
          <code className="block rounded bg-dark-900 px-3 py-2 text-sm font-mono text-white break-all">
            {showNewKey}
          </code>
          <p className="mt-2 text-xs text-slate-400">Save this key now. It won&apos;t be shown again.</p>
        </div>
      )}

      {/* Keys list */}
      <div className="space-y-2">
        {keys.map((key) => (
          <div
            key={key.id}
            className={`flex items-center justify-between rounded-lg border p-4 transition ${
              key.isActive ? 'border-dark-800 bg-dark-900' : 'border-dark-800/50 bg-dark-950/50 opacity-60'
            }`}
          >
            <div>
              <div className="text-sm font-medium text-white">{key.label}</div>
              <div className="mt-0.5 text-xs text-slate-400">
                {key.permissions} • Created {key.createdAt}
                {key.lastUsedAt && ` • Last used ${key.lastUsedAt}`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                key.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {key.isActive ? 'Active' : 'Revoked'}
              </span>
              {key.isActive && (
                <button
                  onClick={() => revokeKey(key.id)}
                  className="rounded-md px-3 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
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
