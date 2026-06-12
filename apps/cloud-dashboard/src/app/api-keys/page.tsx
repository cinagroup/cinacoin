"use client";

import { useState } from "react";
import { Menu, MoreVertical, Eye, EyeOff } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function ApiKeysPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());

  const mockKeys = [
    { id: 1, name: "Production API", key: "cc_live_sk_a1b2c3d4e5f6g7h8i9j0", created: "Jan 15, 2026", lastUsed: "2 hours ago", status: "active", requests: "1.2M" },
    { id: 2, name: "Development", key: "cc_test_sk_m3n4o5p6q7r8s9t0u1v2", created: "Feb 20, 2026", lastUsed: "1 day ago", status: "active", requests: "45.8K" },
    { id: 3, name: "Mobile App", key: "cc_live_sk_w3x4y5z6a7b8c9d0e1f2", created: "Mar 10, 2026", lastUsed: "3 hours ago", status: "active", requests: "892K" },
    { id: 4, name: "Legacy Integration", key: "cc_live_sk_g3h4i5j6k7l8m9n0o1p2", created: "Dec 1, 2025", lastUsed: "Never", status: "revoked", requests: "0" },
  ];

  const toggleKeyVisibility = (id: number) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleKeys(newVisible);
  };

  const maskKey = (key: string) => {
    return `${key.slice(0, 11)}${'•'.repeat(12)}${key.slice(-4)}`;
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-[var(--cc-canvas)] border-b border-[var(--cc-hairline)] h-14 flex items-center px-6 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-sm hover:bg-[var(--cc-canvas-soft-2)] mr-4 transition-colors duration-fast"
          >
            <Menu className="w-5 h-5 text-body" />
          </button>
        </header>
        <Breadcrumbs />

        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-heading-2 text-[var(--cc-ink)]">API keys.</h1>
              <p className="text-body-sm text-body mt-1">Manage authentication keys for your applications.</p>
            </div>
            <button className="cc-btn-primary px-4 py-2">
              + Create key
            </button>
          </div>

          <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-[var(--cc-canvas-soft-2)] border-b border-[var(--cc-hairline)]">
                <tr>
                  <th className="text-left px-6 py-3 text-caption font-medium text-[var(--cc-muted)]">Name</th>
                  <th className="text-left px-6 py-3 text-caption font-medium text-[var(--cc-muted)]">Key</th>
                  <th className="text-left px-6 py-3 text-caption font-medium text-[var(--cc-muted)]">Created</th>
                  <th className="text-left px-6 py-3 text-caption font-medium text-[var(--cc-muted)]">Last used</th>
                  <th className="text-left px-6 py-3 text-caption font-medium text-[var(--cc-muted)]">Requests</th>
                  <th className="text-left px-6 py-3 text-caption font-medium text-[var(--cc-muted)]">Status</th>
                  <th className="text-right px-6 py-3 text-caption font-medium text-[var(--cc-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockKeys.map((apiKey) => (
                  <tr key={apiKey.id} className="border-b border-[var(--cc-hairline)] last:border-b-0 hover:bg-[var(--cc-canvas-soft)] transition-colors">
                    <td className="px-6 py-4 text-body-sm text-[var(--cc-ink)] font-medium">{apiKey.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-caption-mono text-[var(--cc-muted)] bg-[var(--cc-canvas-soft-2)] px-2 py-1 rounded">
                          {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                        </code>
                        <button 
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                          className="p-1 hover:bg-[var(--cc-canvas-soft-2)] rounded transition-colors"
                          aria-label={visibleKeys.has(apiKey.id) ? "Hide key" : "Show key"}
                        >
                          {visibleKeys.has(apiKey.id) ? <EyeOff className="w-3.5 h-3.5 text-[var(--cc-muted)]" /> : <Eye className="w-3.5 h-3.5 text-[var(--cc-muted)]" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-body">{apiKey.created}</td>
                    <td className="px-6 py-4 text-body-sm text-body">{apiKey.lastUsed}</td>
                    <td className="px-6 py-4 text-body-sm text-[var(--cc-ink)] font-medium">{apiKey.requests}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${apiKey.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                        {apiKey.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-[var(--cc-canvas-soft-2)] rounded transition-colors">
                        <MoreVertical className="w-4 h-4 text-body" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-[var(--cc-canvas-soft)] border border-[var(--cc-hairline)] rounded-md">
            <p className="text-caption text-[var(--cc-muted)]">
              <strong className="text-[var(--cc-ink)]">Security note:</strong> Never share your API keys. Rotate keys regularly and use environment variables to store them securely.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
