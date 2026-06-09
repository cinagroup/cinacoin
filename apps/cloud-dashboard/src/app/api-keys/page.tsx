"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  status: "active" | "revoked";
}

export default function ApiKeysPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [keys, setKeys] = useState<ApiKey[]>([
    {
      id: "key-001",
      name: "Production API Key",
      key: "ck_live_••••••••••••••••••••••••a1b2c3",
      created: "2026-01-15",
      lastUsed: "2 hours ago",
      status: "active",
    },
    {
      id: "key-002",
      name: "Development Key",
      key: "ck_test_••••••••••••••••••••••••d4e5f6",
      created: "2026-02-20",
      lastUsed: "1 day ago",
      status: "active",
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      key: `ck_live_••••••••••••••••••••••••${Math.random().toString(36).slice(2, 8)}`,
      created: new Date().toISOString().split("T")[0],
      lastUsed: "Never",
      status: "active",
    };
    setKeys([newKey, ...keys]);
    setNewKeyName("");
    setShowCreateModal(false);
  };

  const handleRevokeKey = (id: string) => {
    if (confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      setKeys(keys.map((k) => (k.id === id ? { ...k, status: "revoked" as const } : k)));
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-canvas border-b border-hairline h-14 flex items-center px-6 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-sm hover:bg-canvas-soft-2 mr-4 transition-colors duration-fast"
          >
            <svg className="w-5 h-5 text-body" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-body-sm font-medium text-ink">API Keys</h1>
        </header>
        <Breadcrumbs />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-heading-2 text-ink">API Keys</h1>
                <p className="text-body-sm text-body mt-1">
                  Manage your API keys for programmatic access.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary px-4 py-2"
              >
                + Create API Key
              </button>
            </div>

            {/* API Keys List */}
            <div className="bg-canvas rounded-md shadow-level-2 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-canvas-soft">
                    <tr>
                      <th className="px-6 py-3 text-left text-caption font-medium text-mute uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-caption font-medium text-mute uppercase tracking-wider">
                        Key
                      </th>
                      <th className="px-6 py-3 text-left text-caption font-medium text-mute uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-caption font-medium text-mute uppercase tracking-wider">
                        Last Used
                      </th>
                      <th className="px-6 py-3 text-left text-caption font-medium text-mute uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-caption font-medium text-mute uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {keys.map((key) => (
                      <tr key={key.id} className="hover:bg-canvas-soft transition-colors duration-fast">
                        <td className="px-6 py-4">
                          <p className="text-body-sm font-medium text-ink">{key.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-caption font-mono text-body bg-canvas-soft-2 px-2 py-1 rounded-sm">
                            {key.key}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-body-sm text-body">{key.created}</td>
                        <td className="px-6 py-4 text-body-sm text-body">{key.lastUsed}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-pill text-caption font-medium ${
                              key.status === "active" ? "badge-success" : "badge-error"
                            }`}
                          >
                            {key.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {key.status === "active" && (
                            <button
                              onClick={() => handleRevokeKey(key.id)}
                              className="text-caption text-error hover:underline"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-canvas-soft-2 rounded-md p-4 border border-hairline">
              <p className="text-body-sm text-body">
                <strong className="text-ink">Security Note:</strong> API keys carry privileges. Keep them secure and never share them in public repositories or client-side code.
              </p>
            </div>
          </div>

          {/* Create Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-canvas rounded-md shadow-level-5 max-w-md w-full p-6">
                <h2 className="text-heading-3 text-ink mb-4">Create New API Key</h2>
                <form onSubmit={handleCreateKey} className="space-y-4">
                  <div>
                    <label htmlFor="keyName" className="block text-body-sm font-medium text-ink mb-2">
                      Key Name
                    </label>
                    <input
                      id="keyName"
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Production API Key"
                      className="input"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="btn-primary flex-1 py-2">
                      Create Key
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="btn-secondary flex-1 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
