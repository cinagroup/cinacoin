"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function ApiKeysPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const mockKeys = [
    { id: 1, name: "Production API Key", key: "pk_live_*******************1234", created: "2026-01-15", lastUsed: "2 hours ago", status: "active" },
    { id: 2, name: "Development Key", key: "pk_test_*******************5678", created: "2026-02-20", lastUsed: "1 day ago", status: "active" },
    { id: 3, name: "Legacy Key", key: "pk_old_*******************9012", created: "2025-12-01", lastUsed: "Never", status: "revoked" },
  ];

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-canvas border-b border-hairline h-14 flex items-center px-6 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-sm hover:bg-canvas-soft-2 mr-4 transition-colors duration-fast"
          >
            <svg className="w-5 h-5 text-body" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>
        <Breadcrumbs />

        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-heading-2 text-ink">API Keys</h1>
              <p className="text-body-sm text-body mt-1">Manage your API keys for authentication</p>
            </div>
            <button className="cc-btn-primary px-4 py-2">
              + Create API Key
            </button>
          </div>

          <div className="bg-canvas border border-hairline rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-canvas-soft-2 border-b border-hairline">
                <tr>
                  <th className="text-left px-6 py-3 text-caption font-medium text-mute uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-caption font-medium text-mute uppercase">Key</th>
                  <th className="text-left px-6 py-3 text-caption font-medium text-mute uppercase">Created</th>
                  <th className="text-left px-6 py-3 text-caption font-medium text-mute uppercase">Last Used</th>
                  <th className="text-left px-6 py-3 text-caption font-medium text-mute uppercase">Status</th>
                  <th className="text-right px-6 py-3 text-caption font-medium text-mute uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockKeys.map((apiKey) => (
                  <tr key={apiKey.id} className="border-b border-hairline last:border-b-0 hover:bg-canvas-soft transition-colors">
                    <td className="px-6 py-4 text-body-sm text-ink font-medium">{apiKey.name}</td>
                    <td className="px-6 py-4">
                      <code className="text-caption-mono text-mute bg-canvas-soft-2 px-2 py-1 rounded">{apiKey.key}</code>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-body">{apiKey.created}</td>
                    <td className="px-6 py-4 text-body-sm text-body">{apiKey.lastUsed}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${apiKey.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                        {apiKey.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-canvas-soft-2 rounded transition-colors">
                        <svg className="w-4 h-4 text-body" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
