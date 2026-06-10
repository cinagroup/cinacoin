"use client";

import { useState } from "react";
import ApiKeyTable from "@/components/ApiKeyTable";
import ApiKeyModal from "@/components/ApiKeyModal";

const initialKeys = [
  {
    id: "key-1",
    name: "Production Key",
    prefix: "cc_live_sk1_...a8f2",
    permissions: "admin" as const,
    lastUsed: "2026-06-09",
    createdAt: "2025-03-15",
    usage: 584_210,
    status: "active" as const,
  },
  {
    id: "key-2",
    name: "Staging Key",
    prefix: "cc_test_sk1_...b3e1",
    permissions: "write" as const,
    lastUsed: "2026-06-08",
    createdAt: "2025-06-20",
    usage: 212_890,
    status: "active" as const,
  },
  {
    id: "key-3",
    name: "CI/CD Key",
    prefix: "cc_live_sk1_...c7d4",
    permissions: "read" as const,
    lastUsed: "2026-06-07",
    createdAt: "2025-09-01",
    usage: 45_201,
    status: "active" as const,
  },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState(initialKeys);
  const [showModal, setShowModal] = useState(false);
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);

  const handleCreate = (name: string, permissions: "read" | "write" | "admin") => {
    const newKey = {
      id: `key-${Date.now()}`,
      name,
      prefix: `cc_live_sk1_...${Math.random().toString(36).slice(2, 6)}`,
      permissions,
      lastUsed: "Never",
      createdAt: new Date().toISOString().split("T")[0],
      usage: 0,
      status: "active" as const,
    };
    setKeys([newKey, ...keys]);
    setShowModal(false);
    // Show the newly generated key
    setShowNewKey(`cc_live_sk1_${Math.random().toString(36).slice(2, 34)}`);
  };

  const handleRevoke = (id: string) => {
    setKeys(keys.filter((k) => k.id !== id));
  };

  const handleRotate = (id: string) => {
    setRotatingId(id);
    // Simulate rotation
    setTimeout(() => {
      setKeys(
        keys.map((k) =>
          k.id === id
            ? {
                ...k,
                prefix: `cc_live_sk1_...${Math.random().toString(36).slice(2, 6)}`,
                createdAt: new Date().toISOString().split("T")[0],
                lastUsed: "Never",
              }
            : k
        )
      );
      setRotatingId(null);
      setShowNewKey(`cc_live_sk1_${Math.random().toString(36).slice(2, 34)}`);
    }, 1000);
  };

  const totalUsage = keys.reduce((sum, k) => sum + k.usage, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-md font-semibold text-ink">API Keys</h1>
          <p className="text-ink-body mt-1">
            Manage API keys for authenticating with Cinacoin services.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Generate Key
        </button>
      </div>

      {/* Info Banner */}
      <div className="card bg-canvas-soft border-hairline">
        <p className="text-body-sm text-ink-body">
          🔐 <strong>Security:</strong> API keys carry privileges. Use the minimum
          permission level needed. Rotate keys regularly and never commit them to
          version control.
        </p>
      </div>

      {/* Usage Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-body-sm text-ink-mute">Total Keys</div>
          <div className="text-display-md font-semibold text-ink mt-1">{keys.length}</div>
        </div>
        <div className="card">
          <div className="text-body-sm text-ink-mute">Total Requests (All Keys)</div>
          <div className="text-display-md font-semibold text-ink mt-1">{totalUsage.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="text-body-sm text-ink-mute">Active Keys</div>
          <div className="text-display-md font-semibold text-ink mt-1">
            {keys.filter((k) => k.status === "active").length}
          </div>
        </div>
      </div>

      {/* Newly Generated Key Alert */}
      {showNewKey && (
        <div className="card bg-[#ecfdf5] border-[#00875a]/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-body-sm font-medium text-[#00875a] mb-1">
                ✅ New API key generated!
              </p>
              <p className="text-caption text-ink-body mb-2">
                Copy this key now. You won't be able to see it again.
              </p>
              <code className="text-body-sm font-[var(--font-mono)] bg-[var(--color-canvas)] px-3 py-2 rounded border border-[#00875a]/20 block">
                {showNewKey}
              </code>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(showNewKey).catch(() => {})}
                className="btn-primary text-caption"
              >
                📋 Copy
              </button>
              <button
                onClick={() => setShowNewKey(null)}
                className="text-ink-mute hover:text-ink text-body-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <ApiKeyTable keys={keys} onRevoke={handleRevoke} onRotate={handleRotate} rotatingId={rotatingId} />

      {showModal && (
        <ApiKeyModal
          onCreate={handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
