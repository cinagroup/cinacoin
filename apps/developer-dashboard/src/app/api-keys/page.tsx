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
  },
  {
    id: "key-2",
    name: "Staging Key",
    prefix: "cc_test_sk1_...b3e1",
    permissions: "write" as const,
    lastUsed: "2026-06-08",
    createdAt: "2025-06-20",
  },
  {
    id: "key-3",
    name: "CI/CD Key",
    prefix: "cc_live_sk1_...c7d4",
    permissions: "read" as const,
    lastUsed: "2026-06-07",
    createdAt: "2025-09-01",
  },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState(initialKeys);
  const [showModal, setShowModal] = useState(false);

  const handleCreate = (name: string, permissions: "read" | "write" | "admin") => {
    const newKey = {
      id: `key-${Date.now()}`,
      name,
      prefix: `cc_live_sk1_...${Math.random().toString(36).slice(2, 6)}`,
      permissions,
      lastUsed: "Never",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setKeys([newKey, ...keys]);
    setShowModal(false);
  };

  const handleRevoke = (id: string) => {
    setKeys(keys.filter((k) => k.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">API Keys</h1>
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
        <p className="text-sm text-ink-body">
          🔐 <strong>Security:</strong> API keys carry privileges. Use the minimum
          permission level needed. Rotate keys regularly and never commit them to
          version control.
        </p>
      </div>

      <ApiKeyTable keys={keys} onRevoke={handleRevoke} />

      {showModal && (
        <ApiKeyModal
          onCreate={handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
