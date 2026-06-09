"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    
    const newKey: ApiKey = {
      id: crypto.randomUUID(),
      name: newKeyName,
      key: `ck_${crypto.randomUUID().replace(/-/g, "")}`,
      createdAt: new Date().toISOString(),
      lastUsed: null,
    };
    
    setApiKeys([...apiKeys, newKey]);
    setNewKeyName("");
    setShowCreateModal(false);
  };

  const handleDeleteKey = (id: string) => {
    if (confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      setApiKeys(apiKeys.filter((k) => k.id !== id));
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--cc-ink)] mb-2">API Keys</h1>
              <p className="text-sm text-[var(--cc-muted)]">
                Manage your API keys for authenticating requests
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[var(--cc-ink)] text-[var(--cc-canvas)] px-4 py-2 rounded-md text-sm font-medium hover:bg-[var(--cc-ink-soft)] transition-colors"
            >
              Create API Key
            </button>
          </div>

          {apiKeys.length === 0 ? (
            <div className="bg-[var(--cc-canvas)] border border-[var(--cc-border)] rounded-lg p-12 text-center">
              <p className="text-sm text-[var(--cc-muted)] mb-4">
                No API keys yet. Create one to start making API requests.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="bg-[var(--cc-canvas)] border border-[var(--cc-border)] rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-[var(--cc-ink)]">{key.name}</h3>
                    <button
                      onClick={() => handleDeleteKey(key.id)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="font-mono text-xs text-[var(--cc-muted)] mb-2 bg-[var(--cc-canvas-soft)] px-3 py-2 rounded">
                    {key.key}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--cc-muted)]">
                    <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                    {key.lastUsed && (
                      <span>Last used: {new Date(key.lastUsed).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-[var(--cc-canvas)] border border-[var(--cc-border)] rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-lg font-medium text-[var(--cc-ink)] mb-4">Create API Key</h2>
                <div className="mb-4">
                  <label htmlFor="keyName" className="block text-sm font-medium text-[var(--cc-ink)] mb-2">
                    Key Name
                  </label>
                  <input
                    id="keyName"
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--cc-border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cc-link)]"
                    placeholder="Production API Key"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-[var(--cc-border)] rounded-md text-sm font-medium text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateKey}
                    className="flex-1 bg-[var(--cc-ink)] text-[var(--cc-canvas)] px-4 py-2 rounded-md text-sm font-medium hover:bg-[var(--cc-ink-soft)] transition-colors"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
